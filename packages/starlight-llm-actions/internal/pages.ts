import { getCollection } from 'astro:content';
import config from 'virtual:starlight-llm-actions/config';
import { pagePathForId } from '../config/resolve.js';
import type { CollectionPage, PageEntry } from './page-document.js';

/**
 * `getCollection`, retyped for a collection name known only at runtime.
 *
 * Astro generates a union of the project's own collection names and keys both
 * the filter and the return type off it. A plugin reading names out of config
 * has a plain `string`, so no honest signature fits. What is asserted instead is
 * the shape every entry a Starlight page can render actually has — an id, a
 * body, and frontmatter carrying a title.
 *
 * `data.draft` is optional here because a collection with its own schema has no
 * reason to declare it. Reading a missing field is `undefined`, so the filter
 * keeps the entry, which is the right answer for a schema that has no notion of
 * drafts at all.
 */
const loadCollection = getCollection as unknown as (
  name: string,
  filter: (entry: { data: { draft?: boolean | undefined } }) => boolean,
) => Promise<PageEntry[]>;

/**
 * `''` and `'index'` name the same page.
 *
 * `<StarlightPage>` derives an entry id from the URL, so the site root arrives
 * as zero segments, while a collection spells that page `index`. Normalizing to
 * the collection's spelling keeps one key for the page in the covered set, and
 * matches what `markdownUrlForSlug` does with the same two values.
 */
function normalizePath(path: string): string {
  return path === '' ? 'index' : path;
}

/**
 * Every page the plugin publishes Markdown for, across every configured
 * collection, in config order.
 *
 * The one place a collection name is read and the one place an entry id becomes
 * a site path — the per-page route, `llms.txt`, and the bundles all take the
 * corpus from here, so they cannot disagree about what is in it.
 */
async function loadPages(): Promise<CollectionPage[]> {
  const pages: CollectionPage[] = [];

  for (const { name, path } of config.collections) {
    const entries = await loadCollection(name, (entry) => !entry.data.draft);

    for (const entry of entries) {
      if (typeof entry.data.title !== 'string' || entry.data.title === '') {
        throw new Error(
          `[starlight-llm-actions] Entry "${entry.id}" in the '${name}' collection has no \`title\`. ` +
            'Every collection listed in `collections` needs a string `title` in its schema — ' +
            'it is the heading of the page’s Markdown and its label in every index.',
        );
      }

      pages.push({
        collection: name,
        path: normalizePath(pagePathForId(path, entry.id)),
        entry,
      });
    }
  }

  return pages;
}

/**
 * Memoize a promise-returning load for the length of a build, and only then.
 *
 * Three routes and one component all read the corpus, and the component reads it
 * once per page — recomputing it there would rebuild a thousand-entry list a
 * thousand times on a thousand-page site. The dev server is the opposite case:
 * it has to see a page added to a collection without a restart, and it renders
 * one page per request, so there is no repetition to save.
 */
function perBuild<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | undefined;
  return () => {
    if (!import.meta.env.PROD) return load();
    cached ??= load();
    return cached;
  };
}

export const collectionPages = perBuild(loadPages);

const coveredPaths = perBuild(
  async (): Promise<ReadonlySet<string>> =>
    new Set((await collectionPages()).map((page) => page.path)),
);

/**
 * Whether the plugin publishes a `.md` route for the page at this path.
 *
 * What lets Page Actions leave itself out on a page it cannot serve, rather than
 * pointing Copy and View at a 404. The answer is read off the corpus rather than
 * off the page's own entry, because a page rendered by `<StarlightPage>` reports
 * a fabricated `collection` and `filePath` — the emitted set is the only thing
 * that actually knows.
 *
 * Always false with `injectRoute: false`, where the site owns the Markdown route
 * and the plugin has no idea which paths it serves.
 */
export async function hasMarkdownRoute(path: string): Promise<boolean> {
  if (!config.injectRoute) return false;
  return (await coveredPaths()).has(normalizePath(path));
}
