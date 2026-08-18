import type { APIContext } from 'astro';
import config from 'virtual:starlight-llm-actions/config';
import { alternateHeadTag } from './internal/link-alternate.js';

/**
 * Appends a per-page `<link rel="alternate" type="text/markdown">` tag pointing
 * at the page's Markdown URL.
 *
 * Starlight's `head` config option is site-wide and static, so a per-page tag
 * has to be pushed onto `locals.starlightRoute.head` at request time. Route
 * middleware is the composable way to do that: unlike a `components.Head`
 * override it stacks with every other plugin's middleware instead of replacing
 * whatever override was already registered.
 *
 * Written as a plain function rather than through Starlight's
 * `defineRouteMiddleware()` helper — which is an identity function that exists
 * only for inference — because importing it pulls Starlight's raw route-data
 * source into this package's isolated typecheck, and that source depends on
 * `astro:content` types that only exist after `astro sync`.
 */
export function onRequest(context: APIContext): void {
  const route = context.locals.starlightRoute;

  const tag = alternateHeadTag({
    linkAlternate: config.linkAlternate,
    markdownUrl: config.markdownUrl,
    entry: route.entry,
    base: import.meta.env.BASE_URL,
    site: context.site,
  });

  if (tag) route.head.push(tag);
}
