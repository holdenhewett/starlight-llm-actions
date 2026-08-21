import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { pageDocument } from './internal/page-document.js';

export const prerender = true;

type DocsEntry = Awaited<ReturnType<typeof getCollection<'docs'>>>[number];

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs', (doc) => !doc.data.draft);
  return docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute = async (context) => {
  const { entry } = context.props as { entry: DocsEntry };

  return new Response(await pageDocument(entry, context), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
