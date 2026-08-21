import config, { starlight } from 'virtual:starlight-llm-actions/config';
import { markdownUrlForSlug } from '../config/resolve.js';
import {
  absoluteUrl,
  applyExclude,
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
 * Apply `exclude`, then `promote`/`demote` ordering.
 *
 * Every index starts from this one list: `llms.txt` links each entry, the full
 * bundle concatenates all of them, and a subset filters it down. Ordering before
 * filtering rather than after is what keeps a subset in the same relative order
 * the full bundle puts those pages in.
 */
export function indexEntries<T extends IndexEntry>(entries: readonly T[]): T[] {
  return sortEntries(
    applyExclude(entries, [...llmsTxt.exclude, ...NEVER_INDEXED]),
    llmsTxt.promote,
    llmsTxt.demote,
    collator,
  );
}

/** Absolute URL of one page's own Markdown route. */
export function pageUrl(id: string, site: URL): string {
  return absoluteUrl(
    markdownUrlForSlug(config.markdownUrl, id),
    import.meta.env.BASE_URL,
    site,
  );
}

/** Absolute URL of a bundle — `full` or a subset slug. */
export function bundleUrl(slug: string, site: URL): string {
  return absoluteUrl(`/llms-${slug}.txt`, import.meta.env.BASE_URL, site);
}
