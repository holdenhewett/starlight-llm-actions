import micromatch from 'micromatch';
import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  applyExclude,
  applyInclude,
  createOrder,
  renderBundle,
  renderLlmsTxt,
  siteMeta,
  sortEntries,
} from './llms-txt.js';

const collator = new Intl.Collator('en');
const paths = (entries: { path: string }[]) => entries.map((e) => e.path);
const entries = (...list: string[]) => list.map((path) => ({ path }));

describe('createOrder', () => {
  it('bands promoted entries ahead of neutral ones, in pattern order', () => {
    const order = createOrder(['index', 'start/**'], []);
    expect(order('index')).toBeLessThan(order('start/here'));
    expect(order('start/here')).toBeLessThan(order('guides/example'));
    expect(order('guides/example')).toBe(0);
  });

  it('bands demoted entries behind neutral ones, in pattern order', () => {
    const order = createOrder([], ['legacy/**', 'archive/**']);
    expect(order('guides/example')).toBe(0);
    expect(order('guides/example')).toBeLessThan(order('legacy/old'));
    expect(order('legacy/old')).toBeLessThan(order('archive/ancient'));
  });

  it('demotes a page matching both promote and demote', () => {
    const order = createOrder(['api/**'], ['api/internal/**']);
    expect(order('api/tokens')).toBeLessThan(0);
    expect(order('api/internal/debug')).toBeGreaterThan(0);
  });

  it('treats every page as neutral when both lists are empty', () => {
    const order = createOrder([], []);
    expect(order('index')).toBe(0);
    expect(order('guides/example')).toBe(0);
  });
});

describe('sortEntries', () => {
  it('orders promoted, then neutral, then demoted', () => {
    const sorted = sortEntries(
      entries('reference/api', 'guides/b', 'index', 'guides/a', 'legacy/old'),
      ['index'],
      ['legacy/**'],
      collator,
    );
    expect(paths(sorted)).toEqual([
      'index',
      'guides/a',
      'guides/b',
      'reference/api',
      'legacy/old',
    ]);
  });

  it('breaks ties on path so output does not depend on loader order', () => {
    const forward = sortEntries(entries('a', 'b', 'c'), [], [], collator);
    const reverse = sortEntries(entries('c', 'b', 'a'), [], [], collator);
    expect(paths(forward)).toEqual(paths(reverse));
  });

  it('does not mutate the input array', () => {
    const input = entries('b', 'a');
    sortEntries(input, [], [], collator);
    expect(paths(input)).toEqual(['b', 'a']);
  });

  /**
   * The ordering this ports from is expressed as an underscore-prefix trick:
   * `starlight-llms-txt` prefixes each path with a computed number of underscores
   * and sorts the strings. Reimplementing that formula here and asserting both
   * produce the same sequence is what makes this a port rather than a rewrite
   * that happens to look similar — a consuming site moving its existing
   * `promote`/`demote` lists over gets the order it already had.
   */
  it('matches the reference implementation, underscore trick and all', () => {
    const promote = ['index*', 'getting-started/**'];
    const demote = ['reference/**', 'legacy/**'];
    const sample = entries(
      'index',
      'getting-started/install',
      'getting-started/concepts',
      'guides/rendering',
      'guides/opt-out',
      'actions/copy',
      'reference/config',
      'legacy/v1',
      'legacy/v0',
    );

    const prioritize = (path: string) => {
      const demoted = demote.findIndex((expr) => micromatch.isMatch(path, expr));
      const promoted =
        demoted > -1
          ? -1
          : promote.findIndex((expr) => micromatch.isMatch(path, expr));
      const prefixLength =
        (promoted > -1 ? promote.length - promoted : 0) + demote.length - demoted - 1;
      return '_'.repeat(prefixLength) + path;
    };
    const reference = [...sample].sort((a, b) =>
      collator.compare(prioritize(a.path), prioritize(b.path)),
    );

    expect(paths(sortEntries(sample, promote, demote, collator))).toEqual(
      paths(reference),
    );
  });
});

describe('applyExclude', () => {
  it('drops matching entries', () => {
    expect(
      paths(applyExclude(entries('index', 'internal/notes', 'guides/a'), ['internal/**'])),
    ).toEqual(['index', 'guides/a']);
  });

  it('keeps everything when the list is empty', () => {
    expect(paths(applyExclude(entries('index', 'guides/a'), []))).toEqual([
      'index',
      'guides/a',
    ]);
  });

  it('holds a single star to one path segment', () => {
    expect(paths(applyExclude(entries('api/tokens', 'api/v2/tokens'), ['api/*']))).toEqual(
      ['api/v2/tokens'],
    );
  });
});

describe('applyInclude', () => {
  it('keeps only matching entries', () => {
    expect(
      paths(applyInclude(entries('api/tokens', 'guides/a', 'api/agents'), ['api/**'])),
    ).toEqual(['api/tokens', 'api/agents']);
  });

  it('matches an exact path with no glob syntax', () => {
    expect(paths(applyInclude(entries('index', 'guides/a'), ['index']))).toEqual([
      'index',
    ]);
  });

  it('keeps nothing when the list is empty', () => {
    expect(paths(applyInclude(entries('api/tokens'), []))).toEqual([]);
  });
});

describe('absoluteUrl', () => {
  it('joins a base with a trailing slash', () => {
    expect(absoluteUrl('/llms.txt', '/docs/', 'https://example.com')).toBe(
      'https://example.com/docs/llms.txt',
    );
  });

  it('joins a base without a trailing slash', () => {
    expect(absoluteUrl('/llms.txt', '/docs', 'https://example.com')).toBe(
      'https://example.com/docs/llms.txt',
    );
  });

  it('handles a root base', () => {
    expect(absoluteUrl('/llms.txt', '/', 'https://example.com')).toBe(
      'https://example.com/llms.txt',
    );
  });

  it('keeps a nested page path intact', () => {
    expect(
      absoluteUrl('/getting-started/install.md', '/docs/', 'https://example.com'),
    ).toBe('https://example.com/docs/getting-started/install.md');
  });
});

describe('renderLlmsTxt', () => {
  const doc = {
    title: 'Acme Docs',
    description: 'Everything about Acme.',
    sets: [
      {
        label: 'Complete documentation',
        url: 'https://example.com/llms-full.txt',
        description: 'the full documentation for Acme Docs',
      },
      {
        label: 'API',
        url: 'https://example.com/llms-api.txt',
        description: 'the REST API reference',
      },
    ],
    pages: [
      {
        label: 'Install',
        url: 'https://example.com/install.md',
        description: 'How to install',
      },
      { label: 'Concepts', url: 'https://example.com/concepts.md' },
    ],
  };

  it('renders title, summary, sets, and pages in that order', () => {
    expect(renderLlmsTxt(doc)).toBe(
      [
        '# Acme Docs',
        '',
        '> Everything about Acme.',
        '',
        '## Documentation Sets',
        '',
        '- [Complete documentation](https://example.com/llms-full.txt): the full documentation for Acme Docs',
        '- [API](https://example.com/llms-api.txt): the REST API reference',
        '',
        '## Documentation',
        '',
        '- [Install](https://example.com/install.md): How to install',
        '- [Concepts](https://example.com/concepts.md)',
        '',
      ].join('\n'),
    );
  });

  it('omits the summary blockquote when there is no description', () => {
    expect(renderLlmsTxt({ ...doc, description: null })).not.toContain('>');
  });

  it('omits a section rather than emitting an empty heading', () => {
    const bare = renderLlmsTxt({ ...doc, sets: [], pages: [] });
    expect(bare).not.toContain('## Documentation Sets');
    expect(bare).not.toContain('## Documentation');
    expect(bare).toBe('# Acme Docs\n\n> Everything about Acme.\n');
  });
});

describe('renderBundle', () => {
  it('prefixes the system note and separates documents by a blank line', () => {
    expect(renderBundle('the full documentation for Acme', ['# A\n\nfirst', '# B\n\nsecond'])).toBe(
      '<SYSTEM>the full documentation for Acme</SYSTEM>\n\n# A\n\nfirst\n\n# B\n\nsecond\n',
    );
  });

  it('still names itself when the subset matched no pages', () => {
    expect(renderBundle('API: the REST API reference', [])).toBe(
      '<SYSTEM>API: the REST API reference</SYSTEM>\n',
    );
  });
});

describe('siteMeta', () => {
  it('passes a plain string title through', () => {
    expect(siteMeta({ title: 'Acme Docs', description: 'All of Acme.' })).toEqual({
      title: 'Acme Docs',
      description: 'All of Acme.',
      defaultLang: 'en',
    });
  });

  it('reports a missing description as null rather than undefined', () => {
    expect(siteMeta({ title: 'Acme Docs' }).description).toBeNull();
  });

  it('picks the default locale out of a localized title', () => {
    expect(
      siteMeta({
        title: { en: 'Acme Docs', fr: 'Docs Acme' },
        defaultLocale: 'fr',
        locales: { en: { lang: 'en' }, fr: { lang: 'fr' } },
      }),
    ).toMatchObject({ title: 'Docs Acme', defaultLang: 'fr' });
  });

  it("reads the language off the 'root' locale when no default is named", () => {
    expect(
      siteMeta({ title: { de: 'Acme Doku' }, locales: { root: { lang: 'de' } } }),
    ).toMatchObject({ title: 'Acme Doku', defaultLang: 'de' });
  });

  it('resolves `defaultLocale` as a locales key, not a language tag', () => {
    expect(
      siteMeta({
        title: { 'pt-BR': 'Documentos Acme' },
        defaultLocale: 'br',
        locales: { br: { lang: 'pt-BR' } },
      }),
    ).toMatchObject({ title: 'Documentos Acme', defaultLang: 'pt-BR' });
  });

  it('falls back to the first title when the default language has none', () => {
    expect(siteMeta({ title: { fr: 'Docs Acme' } }).title).toBe('Docs Acme');
  });

  /**
   * `lang` is optional on every locale but `root`, and Starlight fills it from
   * the key (`lang = locale.lang || key`). Defaulting to `'en'` instead would
   * sort a French site with an English collator and pick the wrong localized
   * title — the site would build, just subtly wrong.
   */
  it('falls back to the locales key when that entry omits `lang`', () => {
    expect(
      siteMeta({
        title: { fr: 'Docs Acme', en: 'Acme Docs' },
        defaultLocale: 'fr',
        // `StarlightMetaSource` models only the `lang` field `siteMeta`
        // reads; a real locale entry also carries `label` and `dir`.
        locales: { fr: {}, en: {} },
      }),
    ).toMatchObject({ title: 'Docs Acme', defaultLang: 'fr' });
  });

  it("still answers 'en' for a 'root' entry with no lang and no locales at all", () => {
    // `root` is the one key whose schema requires `lang`, so falling back to the
    // key would yield the nonsense tag 'root'.
    expect(siteMeta({ title: 'Acme Docs', locales: { root: {} } }).defaultLang).toBe('en');
    expect(siteMeta({ title: 'Acme Docs' }).defaultLang).toBe('en');
  });

  describe('llmsTxt overrides', () => {
    it('prefers the override over the Starlight title', () => {
      expect(
        siteMeta({ title: 'DOCS' }, { title: 'Acme Documentation' }).title,
      ).toBe('Acme Documentation');
    });

    it('prefers the override over the Starlight description', () => {
      expect(
        siteMeta(
          { title: 'DOCS', description: 'Docs for Acme.' },
          { description: 'Every page of the Acme platform docs.' },
        ).description,
      ).toBe('Every page of the Acme platform docs.');
    });

    it('supplies a description for a site that has none', () => {
      expect(
        siteMeta({ title: 'DOCS' }, { description: 'The Acme corpus.' }).description,
      ).toBe('The Acme corpus.');
    });

    // Each field falls back on its own: overriding the title should not blank
    // out a description the site already had.
    it('leaves the other field alone', () => {
      expect(
        siteMeta({ title: 'DOCS', description: 'Docs for Acme.' }, { title: 'Acme Documentation' }),
      ).toEqual({
        title: 'Acme Documentation',
        description: 'Docs for Acme.',
        defaultLang: 'en',
      });
    });

    // `resolved.llmsTxt` is `null` when index generation is off, and the
    // resolved fields are `null` when the user set neither.
    it('ignores a null override object and null fields', () => {
      const starlight = { title: 'DOCS', description: 'Docs for Acme.' };
      const expected = { title: 'DOCS', description: 'Docs for Acme.', defaultLang: 'en' };

      expect(siteMeta(starlight, null)).toEqual(expected);
      expect(siteMeta(starlight, { title: null, description: null })).toEqual(expected);
    });

    // The localized-title resolution still has to run: an override replaces the
    // title, not the language the collator sorts with.
    it('keeps resolving the default language', () => {
      expect(
        siteMeta(
          { title: { fr: 'Docs Acme' }, locales: { root: { lang: 'fr' } } },
          { title: 'Acme Documentation' },
        ),
      ).toEqual({
        title: 'Acme Documentation',
        description: null,
        defaultLang: 'fr',
      });
    });
  });
});

/**
 * `llms.txt` is a Markdown document, and page labels and descriptions come from
 * author-written frontmatter. These pin the two ways that text can stop being a
 * list item.
 */
describe('link sanitization', () => {
  const one = (label: string, description?: string) =>
    renderLlmsTxt({
      title: 'Acme Docs',
      description: null,
      sets: [],
      pages: [{ label, url: 'https://example.com/p.md', description }],
    })
      .split('\n')
      .find((line) => line.startsWith('- '))!;

  it('escapes brackets in a label so the link survives', () => {
    expect(one('[Deprecated] API')).toBe(
      '- [\\[Deprecated\\] API](https://example.com/p.md)',
    );
  });

  it('escapes an unbalanced bracket, which would otherwise destroy the link', () => {
    expect(one('Arrays: a] b')).toBe('- [Arrays: a\\] b](https://example.com/p.md)');
  });

  /**
   * CodeQL's js/incomplete-sanitization, and it is not theoretical: escaping only
   * the brackets renders `a \] b` as `a \\] b`, which CommonMark reads as an
   * escaped backslash plus a live `]`. Verified against remark: the label below
   * loses its link without the backslash in the character class.
   */
  it('escapes the backslash too, or the bracket escape is undone', () => {
    expect(one('Weird \\] title')).toBe(
      '- [Weird \\\\\\] title](https://example.com/p.md)',
    );
  });

  it('escapes a trailing backslash, which would eat the link text terminator', () => {
    expect(one('Trailing \\')).toBe('- [Trailing \\\\](https://example.com/p.md)');
  });

  it('collapses a multi-line description onto the list item', () => {
    // A YAML literal block keeps its newlines; emitted raw, the continuation
    // lines land outside the `- ` marker and read as prose between entries.
    expect(one('Install', 'How to install\nthe plugin,\nstep by step')).toBe(
      '- [Install](https://example.com/p.md): How to install the plugin, step by step',
    );
  });

  it('collapses a multi-line label too', () => {
    expect(one('A long\n  title')).toBe('- [A long title](https://example.com/p.md)');
  });
});
