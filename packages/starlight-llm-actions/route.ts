import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

type DocsEntry = Awaited<ReturnType<typeof getCollection<'docs'>>>[number];

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs', (doc) => !doc.data.draft);
  return docs.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

export const GET: APIRoute = async (context) => {
  const { entry } = context.props as { entry: DocsEntry };
  const title = entry.data.hero?.title ?? entry.data.title;
  const description = entry.data.description;
  const body = entry.body ?? '';

  const sections = [`# ${title}`];
  if (description) sections.push(`> ${description}`);
  sections.push(body);

  return new Response(sections.join('\n\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
