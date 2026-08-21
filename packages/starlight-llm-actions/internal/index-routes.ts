import config, { starlight } from 'virtual:starlight-llm-actions/config';
import { markdownUrlForSlug } from '../config/resolve.js';
import {
  absoluteUrl,
  applyExclude,
  applyInclude,
  sortEntries,
  type IndexEntry,
} from './llms-txt.js';

/**
 * The resolved index config, non-null.
 *
 * The assertion is safe by construction: the plugin only injects the routes that
 * import this module when `llmsTxt` resolved to something. Asserting once here
 * keeps the `!` out of the route files, which ship as raw TypeScript and are
 * never typechecked in this repo.
 */
export const llmsTxt = config.llmsTxt!;

/**
 * Tiebreak collator, built from Starlight's default language.
 *
 * Pinned to a language rather than left to the host default so that two builds
 * of the same site on different machines produce byte-identical files.
 */
const collator = new Intl.Collator(starlight.defaultLang);

/**
 * Pages that are never documentation, whatever the site's config says.
 *
 * Starlight renders a 404 page from a synthetic entry that never reaches the
 * collection, so only a site shipping its own `404.md` has one here. For those,
 * `404` sorts ahead of every letter, putting "Page not found" at the top of
 * `llms.txt` as the first thing an agent reads. `link-alternate.ts` already
 * refuses to advertise that page for the same reason.
 */
const NEVER_INDEXED = ['404'];

/**
 * Order the corpus, dropping only the pages nothing may ever index.
 *
 * Ordering before filtering rather than after is what keeps a subset in the same
 * relative order the full bundle puts those pages in.
 */
function orderEntries<T extends IndexEntry>(entries: readonly T[]): T[] {
  return sortEntries(
    applyExclude(entries, NEVER_INDEXED),
    llmsTxt.promote,
    llmsTxt.demote,
    collator,
  );
}

/**
 * The default corpus: `exclude` applied, then `promote`/`demote` ordering.
 *
 * Backs `llms.txt` and the full bundle, the two indexes that speak for the site
 * as a whole.
 */
export function indexEntries<T extends IndexEntry>(entries: readonly T[]): T[] {
  return orderEntries(applyExclude(entries, llmsTxt.exclude));
}

/**
 * One subset's entries, ordered, with `exclude` deliberately not applied.
 *
 * A subset names its pages in `paths`, which is a narrower statement than a
 * corpus-wide `exclude` glob, so the subset wins. That precedence is the whole
 * reason to configure both: a page too large or too duplicative for
 * `llms-full.txt` can still ship as a targeted bundle. Reversing it would leave
 * such a subset silently empty, since its `paths` name exactly the pages
 * `exclude` dropped.
 *
 * `NEVER_INDEXED` still applies. A 404 page belongs in no index, and no `paths`
 * glob is a considered request for one.
 */
export function subsetEntries<T extends IndexEntry>(
  entries: readonly T[],
  paths: readonly string[],
): T[] {
  return applyInclude(orderEntries(entries), paths);
}

/** Absolute URL of one page's own Markdown route. */
export function pageUrl(path: string, site: URL): string {
  return absoluteUrl(
    markdownUrlForSlug(config.markdownUrl, path),
    import.meta.env.BASE_URL,
    site,
  );
}

/** Absolute URL of a bundle — `full` or a subset slug. */
export function bundleUrl(slug: string, site: URL): string {
  return absoluteUrl(`/llms-${slug}.txt`, import.meta.env.BASE_URL, site);
}
