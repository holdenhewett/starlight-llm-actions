import type { Element, Node, Root } from 'hast';
import { matches, select, selectAll } from 'hast-util-select';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';

/**
 * Expressive Code renders a `<figure>` full of styling chrome and moves the
 * language onto `<pre data-language>`. `rehype-remark` only recognises the
 * `language-*` class convention, so copy the language across and drop the
 * screen-reader-only "Terminal window"-style caption that would otherwise land
 * in the output as a stray paragraph.
 */
function expressiveCode() {
  return (tree: Root): void => {
    for (const instance of selectAll('.expressive-code', tree)) {
      const figcaption = select('figcaption', instance);
      if (figcaption) {
        const index = figcaption.children.findIndex((child) =>
          matches('span.sr-only', child as Element),
        );
        if (index > -1) figcaption.children.splice(index, 1);

        // What remains is the `title="..."` chip — a filename or label that the
        // rendered page shows as a header bar above the code. Flattened as-is it
        // becomes a bare line like `astro.config.mjs` floating between two
        // paragraphs, indistinguishable from an unfinished sentence. Bolding it
        // keeps it legible as a caption for the block that follows.
        if (figcaption.children.length > 0) {
          figcaption.children = [
            { type: 'element', tagName: 'strong', properties: {}, children: figcaption.children },
          ];
        }
      }

      const pre = select('pre', instance);
      const code = select('code', instance);
      const language = pre?.properties['dataLanguage'];
      if (code && typeof language === 'string') {
        const className = code.properties['className'];
        code.properties['className'] = [
          ...(Array.isArray(className) ? className : []),
          `language-${language}`,
        ];
      }
    }
  };
}

/**
 * `<starlight-tabs>` is a custom element, so `hast-util-to-mdast` unwraps it and
 * every tab label ends up glued to every panel body with no indication of which
 * belongs to which. Rewrite it into a list of "label, then panel" pairs, which
 * survives the flattening with the association intact.
 */
function tabs() {
  return (tree: Root): void => {
    for (const instance of selectAll('starlight-tabs', tree)) {
      const labels = selectAll('[role="tab"]', instance);
      const panels = selectAll('[role="tabpanel"]', instance);

      const items: Element[] = [];
      for (let i = 0; i < Math.min(labels.length, panels.length); i++) {
        const label = labels[i];
        const panel = panels[i];
        if (!label || !panel) continue;

        const text = label.children
          .filter((child) => child.type === 'text')
          .map((child) => child.value.trim())
          .filter(Boolean)
          .join('');

        items.push({
          type: 'element',
          tagName: 'li',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'p',
              properties: {},
              children: [{ type: 'text', value: text }],
            },
            panel,
          ],
        });
      }

      instance.tagName = 'ul';
      instance.properties = {};
      instance.children = items;
    }
  };
}

/**
 * Starlight renders `:::note` and friends as an `<aside>` whose title is just a
 * `<p>`. `hast-util-to-mdast` has no handler for `<aside>`, so it unwraps and
 * that title flattens into a paragraph indistinguishable from body text — the
 * reader loses both the boundary of the callout and the fact that it was one.
 * Rewrite it as a blockquote with a bolded title, which carries both.
 */
function asides() {
  return (tree: Root): void => {
    for (const instance of selectAll('aside.starlight-aside', tree)) {
      const title = select('.starlight-aside__title', instance);
      if (title) {
        remove(title, (node: Node) => matches('svg', node as Element));
        title.children = [
          {
            type: 'element',
            tagName: 'strong',
            properties: {},
            children: title.children,
          },
        ];
      }

      instance.tagName = 'blockquote';
      instance.properties = {};
    }
  };
}

/**
 * Strip the leftovers that only exist for browsers: FileTree's visually-hidden
 * "Directory" labels, the "Section titled …" anchor Starlight appends to every
 * heading, and HTML comments Astro leaves in the markup.
 */
function cleanup() {
  return (tree: Root): void => {
    for (const fileTree of selectAll('starlight-file-tree', tree)) {
      remove(fileTree, (node: Node) => matches('.sr-only', node as Element));
    }
    remove(
      tree,
      (node: Node) =>
        node.type === 'comment' || matches('a.sl-anchor-link', node as Element),
    );
  };
}

/**
 * Starlight renders a `<Card>` title as `<p class="title">`, styled to look like
 * a heading but marked up as a paragraph. `rehype-remark` faithfully turns it
 * into a paragraph, so the title becomes indistinguishable from the blurb it
 * labels — four cards flatten into eight anonymous paragraphs.
 *
 * Promoting it to a real heading restores the label/body relationship. The icon
 * goes: it carries no meaning in Markdown.
 */
function cardTitles() {
  return (tree: Root): void => {
    for (const card of selectAll('article.card', tree)) {
      const title = select('p.title', card);
      if (!title) continue;
      title.tagName = 'h2';
      title.children = title.children.filter(
        (child) => !matches('svg', child as Element),
      );
    }
  };
}

const pipeline = unified()
  .use(rehypeParse, { fragment: true })
  .use(expressiveCode)
  .use(tabs)
  .use(asides)
  .use(cardTitles)
  .use(cleanup)
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify);

/**
 * Flatten rendered Starlight page HTML into plain Markdown.
 *
 * Elements `hast-util-to-mdast` does not recognise are unwrapped rather than
 * dropped, so third-party Starlight components degrade to their text content
 * automatically. A component that should vanish entirely can opt out by setting
 * `data-mdast="ignore"` on its root element.
 */
export async function htmlToMarkdown(html: string): Promise<string> {
  return String(await pipeline.process(html)).trim();
}
