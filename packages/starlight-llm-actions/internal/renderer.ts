import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { APIContext } from 'astro';
import type { ResolvedRenderMarkdown } from '../config/resolve.js';

/**
 * The docs collection entry a renderer receives.
 *
 * Described structurally rather than as `CollectionEntry<'docs'>` because that
 * type only exists after `astro sync` generates it in the consumer's project.
 * The real value *is* a `CollectionEntry<'docs'>`, so a renderer that needs the
 * full type can annotate its own parameter with it instead.
 */
export interface DocsEntryLike {
  /** Entry id, e.g. `guides/example`. The home page's id is an empty string. */
  id: string;
  /** Raw Markdown/MDX source. */
  body?: string | undefined;
  /** Validated frontmatter. */
  data: Record<string, unknown>;
}

/**
 * Signature a `renderMarkdown: { module }` escape hatch must default-export.
 *
 * Returns the page **body** only — the injected route still prepends the `#
 * title` heading and `> description` blockquote, so raw and rendered output stay
 * structurally identical.
 */
export type MarkdownRenderer = (
  entry: DocsEntryLike,
  context: APIContext,
) => string | Promise<string>;

/**
 * Module the `'simple'` preset loads. Ships as raw TypeScript (like `route.ts`)
 * because it imports `astro:content`, which only exists inside an Astro build.
 */
const SIMPLE_MARKDOWN_MODULE = 'starlight-llm-actions/internal/simple-markdown';

/**
 * Optional peer dependencies the `'simple'` preset needs. They are optional so
 * that `'raw'` users — the default — never install a unified pipeline they will
 * never run.
 */
export const SIMPLE_MARKDOWN_DEPS = [
  '@astrojs/mdx',
  'unified',
  'rehype-parse',
  'rehype-remark',
  'remark-gfm',
  'remark-stringify',
  'hast-util-select',
  'unist-util-remove',
] as const;

/**
 * Specifier the virtual config module should `import()` to obtain the renderer,
 * or `null` for `'raw'` — in which case no `import()` is emitted at all, so raw
 * builds never pull the optional dependencies into the module graph.
 *
 * Relative and absolute paths resolve against the Astro project root and are
 * normalised to forward slashes, the form Vite uses internally. Bare specifiers
 * pass through untouched so npm packages keep resolving normally.
 */
export function rendererSpecifier(
  renderMarkdown: ResolvedRenderMarkdown,
  root: URL,
): string | null {
  if (renderMarkdown.mode === 'raw') return null;
  if (renderMarkdown.mode === 'simple') return SIMPLE_MARKDOWN_MODULE;

  const { module } = renderMarkdown;
  if (!module.startsWith('.') && !module.startsWith('/')) return module;
  return path.resolve(fileURLToPath(root), module).replace(/\\/g, '/');
}

/**
 * Which of `SIMPLE_MARKDOWN_DEPS` the given resolver cannot find. `resolve` is a
 * parameter rather than a hard-coded `import.meta.resolve` so the check is
 * testable without uninstalling packages.
 */
export function findMissingSimpleDeps(
  resolve: (specifier: string) => unknown,
): string[] {
  return SIMPLE_MARKDOWN_DEPS.filter((dep) => {
    try {
      resolve(dep);
      return false;
    } catch {
      return true;
    }
  });
}

/** Actionable install instructions for the dependencies `findMissingSimpleDeps` reported. */
export function missingSimpleDepsMessage(missing: readonly string[]): string {
  return (
    "starlight-llm-actions: `renderMarkdown: 'simple'` needs optional dependencies that are not installed.\n" +
    `Missing: ${missing.join(', ')}\n` +
    `Install them with:\n  npm install ${missing.join(' ')}\n` +
    "Or set `renderMarkdown: 'raw'` to keep emitting the unprocessed MDX source."
  );
}
