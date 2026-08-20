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
const ids = (entries: { id: string }[]) => entries.map((e) => e.id);
const entries = (...list: string[]) => list.map((id) => ({ id }));

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
    expect(ids(sorted)).toEqual([
      'index',
      'guides/a',
      'guides/b',
      'reference/api',
      'legacy/old',
    ]);
  });

  it('breaks ties on id so output does not depend on loader order', () => {
    const forward = sortEntries(entries('a', 'b', 'c'), [], [], collator);
    const reverse = sortEntries(entries('c', 'b', 'a'), [], [], collator);
    expect(ids(forward)).toEqual(ids(reverse));
  });

  it('does not mutate the input array', () => {
    const input = entries('b', 'a');
    sortEntries(input, [], [], collator);
    expect(ids(input)).toEqual(['b', 'a']);
  });

  /**
   * The ordering this ports from is expressed as an underscore-prefix trick:
   * `starlight-llms-txt` prefixes each id with a computed number of underscores
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

    const prioritize = (id: string) => {
      const demoted = demote.findIndex((expr) => micromatch.isMatch(id, expr));
      const promoted =
        demoted > -1 ? -1 : promote.findIndex((expr) => micromatch.isMatch(id, expr));
      const prefixLength =
        (promoted > -1 ? promote.length - promoted : 0) + demote.length - demoted - 1;
      return '_'.repeat(prefixLength) + id;
    };
    const reference = [...sample].sort((a, b) =>
      collator.compare(prioritize(a.id), prioritize(b.id)),
    );

    expect(ids(sortEntries(sample, promote, demote, collator))).toEqual(
      ids(reference),
    );
  });
});

describe('applyExclude', () => {
  it('drops matching entries', () => {
    expect(
      ids(applyExclude(entries('index', 'internal/notes', 'guides/a'), ['internal/**'])),
    ).toEqual(['index', 'guides/a']);
  });

  it('keeps everything when the list is empty', () => {
    expect(ids(applyExclude(entries('index', 'guides/a'), []))).toEqual([
      'index',
      'guides/a',
    ]);
  });

  it('holds a single star to one path segment', () => {
    expect(ids(applyExclude(entries('api/tokens', 'api/v2/tokens'), ['api/*']))).toEqual(
      ['api/v2/tokens'],
    );
  });
});

describe('applyInclude', () => {
  it('keeps only matching entries', () => {
    expect(
      ids(applyInclude(entries('api/tokens', 'guides/a', 'api/agents'), ['api/**'])),
    ).toEqual(['api/tokens', 'api/agents']);
  });

  it('matches an exact id with no glob syntax', () => {
    expect(ids(applyInclude(entries('index', 'guides/a'), ['index']))).toEqual([
      'index',
    ]);
  });

  it('keeps nothing when the list is empty', () => {
    expect(ids(applyInclude(entries('api/tokens'), []))).toEqual([]);
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
});
