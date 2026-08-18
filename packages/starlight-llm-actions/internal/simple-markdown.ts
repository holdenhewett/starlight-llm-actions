import mdxServer from '@astrojs/mdx/server.js';
import { experimental_AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import type { MarkdownRenderer } from './renderer.js';
import { htmlToMarkdown } from './markdown-pipeline.js';

// One container for the whole build. Creating it per page would re-run renderer
// setup for every route for no benefit.
const container = await experimental_AstroContainer.create({
  renderers: [{ name: 'astro:jsx', ssr: mdxServer }],
});

/**
 * Render a docs entry the way Astro would, then flatten the resulting HTML back
 * down to plain Markdown.
 *
 * The round-trip is what makes component-heavy MDX useful to an agent: `<Card>`,
 * `<Tabs>`, `<Steps>`, and `<FileTree>` become their rendered text rather than
 * literal JSX tags, and MDX `import` statements disappear because they were
 * never content to begin with.
 *
 * Only the Astro/MDX renderer is registered. Framework components (React, Vue,
 * Svelte, …) throw `NoMatchingRenderer` out of `renderToString`, which is fatal
 * for the whole page — the injected route catches that and falls back to the raw
 * source for that page.
 */
const renderSimpleMarkdown: MarkdownRenderer = async (entry, context) => {
  const { Content } = await render(entry);
  const html = await container.renderToString(Content, context);
  return htmlToMarkdown(html);
};

export default renderSimpleMarkdown;
