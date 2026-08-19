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
    expect(raw.match(/^# /gm)?.length).toBe(1);
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
