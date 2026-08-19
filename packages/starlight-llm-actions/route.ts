import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import config, { renderer } from 'virtual:starlight-llm-actions/config';

export const prerender = true;

type DocsEntry = Awaited<ReturnType<typeof getCollection<'docs'>>>[number];

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs', (doc) => !doc.data.draft);
  return docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute = async (context) => {
  const { entry } = context.props as { entry: DocsEntry };
  const { hero, description } = entry.data;
  const title = hero?.title ?? entry.data.title;
  const body = await renderBody(entry, context);

  const sections = [`# ${title}`];
  if (description) sections.push(`> ${description}`);

  // A splash page keeps its tagline and primary calls to action in `hero`
  // frontmatter, which Starlight's layout renders — so none of it is in the
  // body the renderer sees. Left out, a site's home page advertises no way in:
  // its Markdown ends up with the card blurbs but not the "Get started" link.
  if (hero?.tagline) sections.push(hero.tagline);
  if (hero?.actions?.length) {
    sections.push(hero.actions.map((action) => `- [${action.text}](${action.link})`).join('\n'));
  }

  sections.push(body);

  return new Response(sections.join('\n\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

/**
 * Render one page body, falling back to the raw entry source if the configured
 * renderer throws.
 *
 * The fallback exists because rendering is page-fatal, not component-fatal: a
 * single framework component with no registered renderer aborts the whole page
 * render. Emitting that page's source is a far better outcome than failing the
 * build, and the warning tells the author which page needs attention.
 */
async function renderBody(
  entry: DocsEntry,
  context: Parameters<APIRoute>[0],
): Promise<string> {
  const raw = entry.body ?? '';
  if (!renderer) return raw;

  try {
    const { default: render } = await renderer();
    return await render(entry, context);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `[starlight-llm-actions] renderMarkdown: '${
        config.renderMarkdown.mode === 'module'
          ? config.renderMarkdown.module
          : config.renderMarkdown.mode
      }' failed for "${entry.id}"; emitting the raw source instead.\n  ${reason}`,
    );
    return raw;
  }
}
