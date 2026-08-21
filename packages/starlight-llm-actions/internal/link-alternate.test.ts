import { describe, expect, it } from 'vitest';
import type { ResolvedLinkAlternate } from '../config/resolve.js';
import { alternateHeadTag } from './link-alternate.js';

const enabled: ResolvedLinkAlternate = { type: 'text/markdown', absolute: false };

function tagFor(
  overrides: {
    linkAlternate?: ResolvedLinkAlternate | null;
    markdownUrl?: string;
    entry?: { id: string; data: { draft: boolean } };
    covered?: boolean;
    base?: string;
    site?: URL | string | undefined;
  } = {},
) {
  return alternateHeadTag({
    linkAlternate: enabled,
    markdownUrl: '/{slug}.md',
    entry: { id: 'guides/example', data: { draft: false } },
    covered: true,
    base: '/',
    ...overrides,
  });
}

describe('alternateHeadTag', () => {
  it('returns null when linkAlternate is disabled', () => {
    expect(tagFor({ linkAlternate: null })).toBeNull();
  });

  it('emits a link tag with the configured type', () => {
    expect(tagFor()).toEqual({
      tag: 'link',
      attrs: {
        rel: 'alternate',
        type: 'text/markdown',
        href: '/guides/example.md',
      },
    });
  });

  it('honours a custom type', () => {
    const tag = tagFor({
      linkAlternate: { type: 'text/plain', absolute: false },
    });
    expect(tag?.attrs.type).toBe('text/plain');
  });

  describe('href resolution', () => {
    it('produces a root-relative href when base is "/"', () => {
      expect(tagFor()?.attrs.href).toBe('/guides/example.md');
    });

    it('prefixes a non-root base', () => {
      expect(tagFor({ base: '/docs/' })?.attrs.href).toBe(
        '/docs/guides/example.md',
      );
    });

    it('handles a base without a trailing slash', () => {
      expect(tagFor({ base: '/docs' })?.attrs.href).toBe(
        '/docs/guides/example.md',
      );
    });

    it('follows the markdownUrl template', () => {
      expect(tagFor({ markdownUrl: '/{slug}/index.md' })?.attrs.href).toBe(
        '/guides/example/index.md',
      );
    });

    it("maps the home page's empty entry id to 'index'", () => {
      expect(tagFor({ entry: { id: '', data: { draft: false } } })?.attrs.href).toBe(
        '/index.md',
      );
    });

    it('points the root page at the page URL plus the template suffix', () => {
      // The home page's URL is `/`, so `/{slug}/index.md` has to yield
      // `/index.md` — not `/index/index.md`, which parallels no page URL.
      // Both id spellings of the root have to land on it.
      for (const id of ['index', '']) {
        expect(
          tagFor({ markdownUrl: '/{slug}/index.md', entry: { id, data: { draft: false } } })
            ?.attrs.href,
        ).toBe('/index.md');
      }
    });

    it('keeps base in front of the collapsed root path', () => {
      expect(
        tagFor({
          markdownUrl: '/{slug}/index.md',
          entry: { id: 'index', data: { draft: false } },
          base: '/docs/',
        })?.attrs.href,
      ).toBe('/docs/index.md');
    });
  });

  describe('absolute hrefs', () => {
    it('builds an absolute URL from site', () => {
      const tag = tagFor({
        linkAlternate: { type: 'text/markdown', absolute: true },
        site: 'https://example.com',
      });
      expect(tag?.attrs.href).toBe('https://example.com/guides/example.md');
    });

    it('keeps base in the absolute URL', () => {
      const tag = tagFor({
        linkAlternate: { type: 'text/markdown', absolute: true },
        base: '/docs/',
        site: new URL('https://example.com'),
      });
      expect(tag?.attrs.href).toBe('https://example.com/docs/guides/example.md');
    });

    it('ignores any path already on site, since base owns the subpath', () => {
      const tag = tagFor({
        linkAlternate: { type: 'text/markdown', absolute: true },
        base: '/docs/',
        site: 'https://example.com/ignored/',
      });
      expect(tag?.attrs.href).toBe('https://example.com/docs/guides/example.md');
    });

    it('stays root-relative when absolute is off', () => {
      const tag = tagFor({ site: 'https://example.com' });
      expect(tag?.attrs.href).toBe('/guides/example.md');
    });
  });

  describe('percent-encoding', () => {
    it('encodes non-ASCII slugs the way Starlight encodes its own hrefs', () => {
      const tag = tagFor({
        entry: { id: 'guides/fëature', data: { draft: false } },
      });
      expect(tag?.attrs.href).toBe('/guides/f%C3%ABature.md');
    });

    it('leaves the path separators alone', () => {
      expect(tagFor({ base: '/docs/' })?.attrs.href).toBe(
        '/docs/guides/example.md',
      );
    });

    it('encodes on the absolute branch too', () => {
      const tag = tagFor({
        linkAlternate: { type: 'text/markdown', absolute: true },
        entry: { id: 'guides/fëature', data: { draft: false } },
        site: 'https://example.com',
      });
      expect(tag?.attrs.href).toBe('https://example.com/guides/f%C3%ABature.md');
    });
  });

  /**
   * The caller answers this from the set of pages the plugin actually emits, so
   * a site whose `collections` leave a route uncovered stops advertising a
   * Markdown URL for it — the same 404 the Page Actions dropdown avoids by
   * leaving its Markdown section out.
   */
  describe('coverage', () => {
    it('returns null for a page the plugin publishes no Markdown for', () => {
      expect(tagFor({ covered: false })).toBeNull();
    });
  });

  describe('404 exclusion', () => {
    it("returns null for Starlight's synthetic 404 entry, which the route never generates", () => {
      expect(tagFor({ entry: { id: '404', data: { draft: false } } })).toBeNull();
    });

    it('still emits a tag for a page merely containing 404 in its id', () => {
      expect(
        tagFor({ entry: { id: 'guides/404-handling', data: { draft: false } } }),
      ).not.toBeNull();
    });
  });

  describe('draft exclusion', () => {
    it('returns null for a draft entry', () => {
      expect(tagFor({ entry: { id: 'wip', data: { draft: true } } })).toBeNull();
    });

    it('emits a tag for a non-draft entry', () => {
      expect(
        tagFor({ entry: { id: 'wip', data: { draft: false } } }),
      ).not.toBeNull();
    });
  });
});
