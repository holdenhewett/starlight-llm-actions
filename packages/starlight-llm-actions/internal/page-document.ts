import type { APIContext } from 'astro';
import config, { renderer } from 'virtual:starlight-llm-actions/config';

/**
 * The docs entry fields a page document is composed from.
 *
 * A `type` rather than an `interface` on purpose: only a type alias picks up the
 * implicit index signature that makes it assignable to the renderer's
 * `DocsEntryLike`, whose `data` is a `Record<string, unknown>`.
 */
export type PageEntry = {
  /** Content Collection entry id, e.g. `guides/example`. */
  id: string;
  /** Raw Markdown/MDX source. */
  body?: string | undefined;
  data: {
    title: string;
    description?: string | undefined;
    hero?:
      | {
          title?: string | undefined;
          tagline?: string | undefined;
          actions?: readonly { text: string; link: string }[] | undefined;
        }
      | undefined;
  };
};

/**
 * Page documents built so far this build, keyed by entry id.
 *
 * The per-page Markdown route and every site-level index need byte-identical
 * Markdown for the same page, and producing it is the expensive part of both:
 * `renderMarkdown: 'simple'` runs a full Astro component render plus a unified
 * pipeline per page. Without sharing, a site with a `/llms-full.txt` pays that
 * twice for every page, and once more for every subset the page appears in.
 *
 * A module-level `Map` is enough because both routes resolve to the same module
 * instance in one Vite module graph inside one build process — the same reason
 * `simple-markdown.ts` can keep a single `AstroContainer` for the whole build.
 *
 * Populated only when an index is actually configured. With `llmsTxt` off there
 * is no second reader, so caching every page document for the length of the
 * build would retain the entire site's Markdown to serve nobody.
 *
 * Keyed on entry id alone, which means the first route to ask for a page fixes
 * the `APIContext` it renders under. The contexts differ only in `url` — the
 * page's own `.md` route versus `/llms-full.txt` — so this is observable only
 * from a component in a doc body that reads `Astro.url`, and Astro gives no
 * ordering guarantee between injected routes anyway. `starlight-llms-txt` passes
 * its own route's context the same way.
 */
const documents = new Map<string, Promise<string>>();
const shared = config.llmsTxt !== null;

/**
 * One page's Markdown document: heading, description blockquote, splash hero
 * content, and rendered body — the exact text the page's `.md` route serves.
 *
 * Rendering is memoized rather than the composition, because rendering is what
 * costs; but the whole document is what both callers want, so that is the unit
 * cached.
 *
 * The cached promise is never a rejected one: `renderBody` turns any renderer
 * failure into the raw source, so there is no poisoned-cache case to guard.
 */
export function pageDocument(
  entry: PageEntry,
  context: APIContext,
): Promise<string> {
  if (!shared) return buildDocument(entry, context);

  let document = documents.get(entry.id);
  if (!document) {
    document = buildDocument(entry, context);
    documents.set(entry.id, document);
  }
  return document;
}

async function buildDocument(
  entry: PageEntry,
  context: APIContext,
): Promise<string> {
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
    sections.push(
      hero.actions.map((action) => `- [${action.text}](${action.link})`).join('\n'),
    );
  }

  sections.push(body);

  return sections.join('\n\n');
}

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
  entry: PageEntry,
  context: APIContext,
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
