import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import config from 'virtual:starlight-llm-actions/config';
import { routeSlugForId } from './config/resolve.js';
import { pageDocument } from './internal/page-document.js';

export const prerender = true;

type DocsEntry = Awaited<ReturnType<typeof getCollection<'docs'>>>[number];

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs', (doc) => !doc.data.draft);
  // `routeSlugForId` rather than `entry.id`: the root page has zero path
  // segments, so under a template like `/{slug}/index.md` it drops the rest
  // parameter entirely and lands at `/index.md`. Every link to this file is
  // built by `markdownUrlForSlug`, which applies the same rule.
  return docs.map((entry) => ({
    params: { slug: routeSlugForId(config.markdownUrl, entry.id) },
    props: { entry },
  }));
};

export const GET: APIRoute = async (context) => {
  const { entry } = context.props as { entry: DocsEntry };

  return new Response(await pageDocument(entry, context), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
