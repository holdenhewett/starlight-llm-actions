import type { APIRoute, GetStaticPaths } from 'astro';
import config from 'virtual:starlight-llm-actions/config';
import { routeSlugForId } from './config/resolve.js';
import { pageDocument, type CollectionPage } from './internal/page-document.js';
import { collectionPages } from './internal/pages.js';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await collectionPages();
  // `routeSlugForId` rather than the path itself: the root page has zero path
  // segments, so under a template like `/{slug}/index.md` it drops the rest
  // parameter entirely and lands at `/index.md`. Every link to this file is
  // built by `markdownUrlForSlug`, which applies the same rule.
  return pages.map((page) => ({
    params: { slug: routeSlugForId(config.markdownUrl, page.path) },
    props: { page },
  }));
};

export const GET: APIRoute = async (context) => {
  const { page } = context.props as { page: CollectionPage };

  return new Response(await pageDocument(page, context), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
