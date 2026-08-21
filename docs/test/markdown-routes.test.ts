import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * End-to-end checks on the `.md` routes this site actually ships.
 *
 * The docs playground runs `renderMarkdown: 'simple'` and `linkAlternate: true`
 * (see astro.config.mjs), so these files are the real output of the flattening
 * pipeline — not a fixture. Unit tests cover the pipeline in isolation; this
 * covers the thing a consuming agent downloads.
 *
 * Requires `astro build` to have run. CI builds the docs before invoking this.
 */

const dist = fileURLToPath(new URL('../dist', import.meta.url));
// readdirSync(recursive) rather than fs.globSync: globSync is still flagged
// experimental on Node 22, which is in the CI matrix.
const files = existsSync(dist)
  ? readdirSync(dist, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.md'))
      .sort()
  : [];

/**
 * Markdown with fenced blocks and inline code removed.
 *
 * Both are places where MDX syntax appears *on purpose* — the guides quote raw
 * `<Tabs>` source to show what `'raw'` mode emits, and the reference names
 * components in prose. Scanning the file without stripping them reports those
 * as leaks, which is a false positive, not a bug.
 *
 * Fences are matched by length per CommonMark: an opener of N backticks is
 * closed only by N or more. The guides use four-backtick fences to wrap
 * examples that themselves contain three-backtick fences.
 */
function prose(raw: string): string {
  const out: string[] = [];
  let openFence: number | null = null;

  for (const line of raw.split('\n')) {
    const marker = line.match(/^(`{3,})/);
    if (openFence === null) {
      if (marker) {
        openFence = marker[1]!.length;
        continue;
      }
      out.push(line.replace(/`[^`]*`/g, ''));
    } else if (marker && marker[1]!.length >= openFence) {
      openFence = null;
    }
  }
  return out.join('\n');
}

const read = (f: string) => readFileSync(`${dist}/${f}`, 'utf8');

/** Starlight components that must never survive into a flattened `.md` route. */
const COMPONENTS = [
  'Tabs', 'TabItem', 'Aside', 'Card', 'CardGrid',
  'LinkCard', 'Steps', 'FileTree', 'Icon', 'Badge', 'LinkButton',
];

describe('built .md routes', () => {
  it('emits a route for every docs page', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain('index.md');
    expect(files).toContain('getting-started/install.md');
  });

  it.each(files)('%s is non-empty and has a single H1', (f) => {
    const raw = read(f);
    expect(raw.trim()).not.toBe('');
    // Counted on prose(), not raw: the llms.txt guide quotes a sample llms.txt
    // inside a fence, and its `# ` line is example content, not a heading.
    // Safe only because the next test pins fence balance — an unclosed fence
    // would make prose() swallow the tail and undercount to a passing 1.
    expect(prose(raw).match(/^# /gm)?.length).toBe(1);
  });

  it.each(files)('%s has balanced code fences', (f) => {
    // prose() consumes fences in pairs; an unclosed fence swallows the rest of
    // the file, so a trailing open fence means the document is malformed.
    const raw = read(f);
    const fences = raw.match(/^`{3,}/gm) ?? [];
    expect(fences.length % 2).toBe(0);
  });

  it.each(files)('%s leaks no MDX frontmatter, imports, or exports', (f) => {
    const raw = read(f);
    const p = prose(raw);
    expect(raw.startsWith('---\n')).toBe(false);
    expect(p).not.toMatch(/^import .* from ['"]/m);
    expect(p).not.toMatch(/^export (const|default) /m);
  });

  it.each(files)('%s leaks no unflattened component tags or directives', (f) => {
    const p = prose(read(f));
    for (const c of COMPONENTS) {
      expect(p, `<${c}> survived flattening`).not.toMatch(new RegExp(`<${c}[\\s/>]`));
    }
    expect(p, ':::  directive survived flattening').not.toMatch(/^:::/m);
  });
});

describe("'simple' mode preserves meaning, not just syntax", () => {
  it('flattens the install <Tabs> into labelled commands, all three intact', () => {
    const md = read('getting-started/install.md');
    for (const [label, cmd] of [
      ['npm', 'npm install starlight-llm-actions'],
      ['pnpm', 'pnpm add starlight-llm-actions'],
      ['Yarn', 'yarn add starlight-llm-actions'],
    ]) {
      expect(md).toContain(label);
      expect(md).toContain(cmd);
    }
    // Tab labels must still precede their own command, or the mapping is lost.
    expect(md.indexOf('npm install')).toBeLessThan(md.indexOf('pnpm add'));
    expect(md.indexOf('pnpm add')).toBeLessThan(md.indexOf('yarn add'));
  });

  it('flattens an :::note aside into a blockquote that keeps its title', () => {
    const md = read('getting-started/install.md');
    expect(md).toMatch(/^> \*\*Optional dependencies\*\*/m);
  });

  it('keeps fenced code blocks fenced, with their language tag', () => {
    expect(read('getting-started/install.md')).toMatch(/^```sh$/m);
    expect(read('configuration/reference.md')).toMatch(/^```(ts|js)$/m);
  });

  it('carries the splash hero into the home page route', () => {
    const md = read('index.md');
    // tagline and CTAs live in `hero` frontmatter, which the layout renders —
    // none of it is in the body, so it has to be emitted deliberately.
    expect(md).toContain('Copy as Markdown, view raw, save as PDF');
    expect(md).toContain('[Get started](/starlight-llm-actions/getting-started/install/)');
    expect(md).toContain(
      '[Configuration reference](/starlight-llm-actions/configuration/reference/)',
    );
  });

  it('keeps each <Card> title a heading rather than a bare paragraph', () => {
    const md = read('index.md');
    for (const title of [
      'One-line install',
      'Per-provider strategies',
      'Print-aware snapshots',
      'Per-page opt-out',
    ]) {
      expect(md).toMatch(new RegExp(`^#{2,3} ${title}$`, 'm'));
    }
  });

  it('never emits an empty emphasis run', () => {
    // Expressive Code ships the title chip even for untitled blocks, as an
    // empty span. Wrapping that yields a bare `****` between a tab label and
    // its command; a reader cannot tell it from a formatting error.
    for (const file of files) {
      expect(read(file), `${file} has an empty emphasis run`).not.toMatch(
        /^\s*\*\*\*\*\s*$/m,
      );
    }
  });

  it('documents the renderMarkdown values in the reference route', () => {
    const md = read('configuration/reference.md');
    for (const v of ["'raw'", "'simple'", 'module']) expect(md).toContain(v);
  });
});

/**
 * End-to-end checks on the site-level indexes.
 *
 * The playground enables `llmsTxt` with a `demote`, an `exclude`, and two named
 * subsets (see astro.config.mjs), so one build exercises every option the
 * feature has.
 *
 * The claim worth pinning here is pipeline consistency: the bundles must contain
 * exactly the bytes the per-page `.md` routes serve. That is the whole reason
 * this plugin generates its own indexes instead of deferring to
 * `starlight-llms-txt` — two generators on one site means two qualities of
 * Markdown.
 */
describe('site-level indexes', () => {
  const index = read('llms.txt');
  const full = read('llms-full.txt');

  /** The `- [label](url)` lines under `## Documentation`. */
  const pageLines = index
    .slice(index.indexOf('## Documentation\n'))
    .split('\n')
    .filter((line) => line.startsWith('- ['));

  /**
   * Pages that get a `.md` route but never appear in an index.
   *
   * `examples/mixed.md` is left out by the playground's `exclude`;
   * `404.md` is left out by construction, no config involved.
   */
  const unindexed = ['404.md', 'examples/mixed.md'];
  const indexable = files.filter((f) => !unindexed.includes(f));

  /** `dist`-relative `.md` path each page link points at. */
  const linked = pageLines.map(
    (line) =>
      line
        .match(/\]\(https:\/\/holdenhewett\.github\.io\/starlight-llm-actions\/(.+?)\)/)
        ?.[1] ?? line,
  );

  it('emits llms.txt, the full bundle, and one file per named subset', () => {
    for (const f of [
      'llms.txt',
      'llms-full.txt',
      'llms-configuration.txt',
      'llms-actions.txt',
      'llms-examples.txt',
    ]) {
      expect(existsSync(`${dist}/${f}`), `${f} was not generated`).toBe(true);
    }
  });

  // The playground sets `llmsTxt.title` and `llmsTxt.description`, which shadow
  // Starlight's own `title` ('starlight-llm-actions') and `description`
  // ('Playground for the starlight-llm-actions plugin.') everywhere the corpus
  // names itself — here, in the set description below, and in the <SYSTEM>
  // preambles further down.
  it('opens llms.txt with the llmsTxt header overrides', () => {
    expect(index.startsWith('# starlight-llm-actions plugin\n')).toBe(true);
    expect(index).toContain(
      '> Every page of the starlight-llm-actions plugin documentation, as Markdown.',
    );
    expect(index).not.toContain('Playground for the starlight-llm-actions plugin.');
  });

  it('lists the full bundle first, then each subset, as absolute URLs', () => {
    const sets = index
      .slice(index.indexOf('## Documentation Sets'), index.indexOf('## Documentation\n'))
      .split('\n')
      .filter((line) => line.startsWith('- ['));
    expect(sets).toEqual([
      '- [Complete documentation](https://holdenhewett.github.io/starlight-llm-actions/llms-full.txt): every page of the starlight-llm-actions plugin documentation as Markdown',
      '- [Configuration](https://holdenhewett.github.io/starlight-llm-actions/llms-configuration.txt): every configuration option',
      '- [Actions](https://holdenhewett.github.io/starlight-llm-actions/llms-actions.txt): the four page actions',
      '- [Examples](https://holdenhewett.github.io/starlight-llm-actions/llms-examples.txt): every example page, excluded ones included',
    ]);
  });

  it('links every indexable page at its own .md route', () => {
    // Copies, not `linked.sort()`: `linked` is shared with the ordering tests
    // below and Array#sort mutates in place.
    expect([...linked].sort()).toEqual([...indexable].sort());
  });

  it('still serves the excluded page its own .md route', () => {
    // `exclude` is about the indexes, not about hiding a page.
    expect(files).toContain('examples/mixed.md');
    expect(full).not.toMatch(/^# Example: Mixed overrides$/m);
  });

  it('carries an excluded page into a subset whose paths name it', () => {
    // The playground excludes `examples/mixed` and gives the Examples subset
    // `examples/**`. The narrower statement wins, so the page ships in that
    // bundle while staying out of the two site-wide indexes. Reversing the
    // precedence is what silently empties a subset built to publish exactly
    // the pages `exclude` dropped.
    const examples = read('llms-examples.txt');
    expect(examples).toContain(read('examples/mixed.md'));
    expect(full).not.toContain(read('examples/mixed.md'));
    expect(index).not.toContain('examples/mixed.md');
  });

  it('leaves a real 404 page out of every index without config', () => {
    // The playground ships src/content/docs/404.md, so the entry is genuinely
    // in the collection — and `404` sorts ahead of every letter, so a leak puts
    // "Page not found" at the top of llms.txt as the first thing an agent reads.
    expect(files).toContain('404.md');
    expect(index).not.toContain('404.md');
    expect(full).not.toMatch(/^# Page not found$/m);
    for (const f of ['llms-configuration.txt', 'llms-actions.txt', 'llms-examples.txt']) {
      expect(read(f)).not.toMatch(/^# Page not found$/m);
    }
  });

  it('never advertises the 404 page as a Markdown alternate', () => {
    // link-alternate skips id '404' for the same reason: a <link rel=alternate>
    // pointing at the not-found page is worse than no tag at all.
    const html = readFileSync(`${dist}/404.html`, 'utf8');
    expect(html).not.toMatch(/rel="alternate"[^>]*404\.md/);
  });

  it('promotes the index page and demotes the examples section', () => {
    expect(linked[0]).toBe('index.md');
    const lastGuide = linked.findLastIndex((f) => f.startsWith('guides/'));
    const firstExample = linked.findIndex((f) => f.startsWith('examples'));
    expect(lastGuide).toBeLessThan(firstExample);
  });

  it('concatenates the per-page routes verbatim into the full bundle', () => {
    for (const f of indexable) {
      expect(full, `${f} was re-rendered rather than reused`).toContain(read(f));
    }
  });

  it('orders the full bundle the same way llms.txt lists the pages', () => {
    const offsets = linked.map((f) => full.indexOf(read(f)));
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  });

  it('names what each bundle holds in a <SYSTEM> preamble', () => {
    expect(full.startsWith('<SYSTEM>This is the complete starlight-llm-actions plugin documentation, as Markdown.</SYSTEM>')).toBe(true);
    expect(read('llms-actions.txt')).toContain(
      '<SYSTEM>This is the Actions section of the starlight-llm-actions plugin documentation, as Markdown.</SYSTEM>',
    );
  });

  it('limits a subset to the pages its paths match', () => {
    const actions = read('llms-actions.txt');
    const pages = files.filter((f) => f.startsWith('actions/'));
    expect(pages.length).toBe(4);
    for (const f of pages) expect(actions).toContain(read(f));
    expect(actions.match(/^# /gm)?.length).toBe(pages.length);
  });
});

/**
 * The playground keeps its changelog in a second collection with its own route
 * file, so the two assumptions the plugin used to bake in are both false there:
 * the collection is not `docs`, and the entry ids (`0-11-0`) are not the paths
 * the site serves them at (`/changelog/entry/0-11-0`). The `.md` convention only
 * holds if the Markdown lands beside the HTML.
 */
describe('collections beyond docs', () => {
  const html = readFileSync(`${dist}/changelog/entry/0-11-0/index.html`, 'utf8');
  const index = read('llms.txt');

  it('emits a route at the page path, not at the entry id', () => {
    expect(files).toContain('changelog/entry/0-11-0.md');
    expect(files).toContain('changelog/entry/0-12-0.md');
    expect(files).not.toContain('changelog/0-11-0.md');
  });

  it("renders the entry body, so 'simple' mode works off a non-docs schema", () => {
    // `simple-markdown.ts` casts the entry to `CollectionEntry<'docs'>` before
    // calling `render()`. That cast is structural, and this is what says so.
    const md = read('changelog/entry/0-11-0.md');
    expect(md).toMatch(/^# 0\.11\.0$/m);
    expect(md).toContain('> Named subset bundles.');
    expect(md).toContain('`subsets`');
  });

  it('lists the pages in llms.txt at their site paths', () => {
    expect(index).toContain('/changelog/entry/0-11-0.md');
    expect(index).toContain('/changelog/entry/0-12-0.md');
  });

  it('carries them into the full bundle verbatim, off the shared render', () => {
    const full = read('llms-full.txt');
    expect(full).toContain(read('changelog/entry/0-11-0.md'));
    expect(full).toContain(read('changelog/entry/0-12-0.md'));
  });

  it('points the Page Actions dropdown at the page’s own Markdown', () => {
    expect(html).toContain(
      'data-markdown-href="/starlight-llm-actions/changelog/entry/0-11-0.md"',
    );
    expect(html).toContain('data-action="copy-md"');
  });

  it('advertises the Markdown alternate on the HTML page', () => {
    expect(html).toMatch(
      /rel="alternate"[^>]*href="\/starlight-llm-actions\/changelog\/entry\/0-11-0\.md"/,
    );
  });
});
