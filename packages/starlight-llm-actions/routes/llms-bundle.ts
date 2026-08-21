import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { starlight } from 'virtual:starlight-llm-actions/config';
import {
  indexEntries,
  llmsTxt,
  subsetEntries,
} from '../internal/index-routes.js';
import { FULL_BUNDLE_SLUG, renderBundle } from '../internal/llms-txt.js';
import { pageDocument } from '../internal/page-document.js';

export const prerender = true;

interface BundleProps {
  /** Globs limiting the bundle to a subset, or `null` for the whole corpus. */
  paths: string[] | null;
  /** Subset label, or `null` for the whole corpus. */
  label: string | null;
}

/**
 * One dynamic route serves `/llms-full.txt` and every `/llms-{slug}.txt` subset.
 *
 * They differ only in which entries they include and what the `<SYSTEM>` note
 * says, and `injectRoute` has no way to pass props — so a shared route with
 * `getStaticPaths` is how each bundle learns which one it is. It also makes
 * `full` a reserved slug, which config resolution enforces.
 */
export const getStaticPaths: GetStaticPaths = () => [
  { params: { bundle: FULL_BUNDLE_SLUG }, props: { paths: null, label: null } },
  ...llmsTxt.subsets.map((subset) => ({
    params: { bundle: subset.slug },
    props: { paths: subset.paths, label: subset.label },
  })),
];

export const GET: APIRoute = async (context) => {
  const { paths, label } = context.props as BundleProps;

  const docs = await getCollection('docs', (doc) => !doc.data.draft);
  const entries = paths ? subsetEntries(docs, paths) : indexEntries(docs);

  // A subset whose paths match nothing builds a file holding only the <SYSTEM>
  // line, and a 90-byte bundle listed in llms.txt reads as "this section is
  // empty" rather than as a config mistake. The globs match Content Collection
  // entry ids, so the usual cause is a leading slash or a file extension that
  // an id never carries.
  if (paths && entries.length === 0) {
    throw new Error(
      `[starlight-llm-actions] The '${label}' subset matched no pages. ` +
        `Its paths (${paths.join(', ')}) are globs over Content Collection ` +
        `entry ids, such as 'guides/example' — no leading slash, no extension.`,
    );
  }

  // Sequential on purpose. `pageDocument` can run a full Astro component render
  // per page, and a `Promise.all` over a thousand-page site would start every
  // one of those at once. Nothing here overlaps with I/O worth interleaving, so
  // the only thing concurrency would buy is peak memory.
  const documents: string[] = [];
  for (const entry of entries) {
    documents.push(await pageDocument(entry, context));
  }

  const note = label
    ? `This is the ${label} section of the ${starlight.title} documentation, as Markdown.`
    : `This is the complete ${starlight.title} documentation, as Markdown.`;

  return new Response(renderBundle(note, documents), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
