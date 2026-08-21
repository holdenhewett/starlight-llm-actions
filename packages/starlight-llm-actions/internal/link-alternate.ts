import { markdownUrlForSlug, type ResolvedLinkAlternate } from '../config/resolve.js';

/** The `<link rel="alternate">` tag, in Starlight's `head` config shape. */
export interface AlternateHeadTag {
  tag: 'link';
  attrs: { rel: 'alternate'; type: string; href: string };
}

export interface AlternateHeadTagOptions {
  /** Resolved `linkAlternate` config, or `null` when the option is off. */
  linkAlternate: ResolvedLinkAlternate | null;
  /** `markdownUrl` template from the resolved config, e.g. `/{slug}.md`. */
  markdownUrl: string;
  /** The page's docs collection entry. */
  entry: { id: string; data: { draft: boolean } };
  /**
   * Whether the plugin publishes a Markdown route for this page — see
   * `internal/pages.ts`.
   *
   * Passed in rather than looked up so this stays a pure function of its
   * arguments; the lookup needs `astro:content` and a whole content store.
   */
  covered: boolean;
  /**
   * Astro's `base`, exactly as `import.meta.env.BASE_URL` reports it — with or
   * without a trailing slash.
   */
  base: string;
  /** Astro's `site`. Only consulted when `linkAlternate.absolute` is set. */
  site?: URL | string | undefined;
}

/**
 * Build the per-page `<link rel="alternate">` tag, or `null` if this page should
 * not advertise a Markdown alternate.
 *
 * Kept separate from the route middleware that pushes it so the decisions worth
 * testing — draft exclusion, `base` handling, absolute vs root-relative — do not
 * need an Astro request context to exercise.
 */
export function alternateHeadTag({
  linkAlternate,
  markdownUrl,
  entry,
  covered,
  base,
  site,
}: AlternateHeadTagOptions): AlternateHeadTag | null {
  if (!linkAlternate) return null;

  // The page belongs to no collection this plugin was told about, so nothing
  // emits a `.md` for it. The two checks below overlap with this one and are
  // kept anyway: they say what the plugin refuses to advertise, while this says
  // what does not exist.
  if (!covered) return null;

  // Drafts are excluded from the injected Markdown route, so linking to one
  // would advertise a URL that 404s in production.
  if (entry.data.draft) return null;

  // Starlight renders a 404 page even when the docs collection has no `404`
  // entry, using a synthetic non-draft entry with `id: '404'`. That entry is not
  // in the collection, so the Markdown route never generates a page for it.
  // Sites that *do* ship a real `404.md` lose the tag on that one page, which is
  // a fair trade for never advertising a URL that does not exist.
  if (entry.id === '404') return null;

  // The root page is handled inside `markdownUrlForSlug`, which knows whether
  // the template can express zero path segments. Both spellings of the root
  // reach it: `''` from `<StarlightPage>`'s URL-derived id, and `'index'` from
  // the docs collection.
  //
  // Mirrors how PageActions.astro builds its Markdown link: strip the trailing
  // slash off `base` so it joins cleanly with the leading slash that the
  // `markdownUrl` template always carries.
  const pathname =
    base.replace(/\/$/, '') + markdownUrlForSlug(markdownUrl, entry.id);

  // Astro slugifies whitespace out of ids but keeps non-ASCII characters, so a
  // page named `fëature.md` reaches us with the accent intact. `new URL()`
  // percent-encodes it on the absolute branch; `encodeURI` does the same here so
  // both branches match the encoding Starlight uses for its own hrefs.
  const href = linkAlternate.absolute && site
    ? new URL(pathname, site).href
    : encodeURI(pathname);

  return {
    tag: 'link',
    attrs: { rel: 'alternate', type: linkAlternate.type, href },
  };
}
