import type { APIRoute } from 'astro';
import { starlight } from 'virtual:starlight-llm-actions/config';
import {
  bundleUrl,
  indexEntries,
  llmsTxt,
  pageUrl,
} from '../internal/index-routes.js';
import {
  FULL_BUNDLE_SLUG,
  renderLlmsTxt,
  type IndexLink,
} from '../internal/llms-txt.js';
import { collectionPages } from '../internal/pages.js';

export const prerender = true;

/**
 * `/llms.txt` — the site's front door for agents.
 *
 * Lists the bundles first, then every page against its own Markdown route, so an
 * agent can either take the whole corpus in one request or fetch the three pages
 * it actually needs.
 */
export const GET: APIRoute = async (context) => {
  // Guaranteed by the config-time check in the plugin: enabling `llmsTxt`
  // without `site` is a build error, because these links have to be absolute.
  const site = context.site!;

  const entries = indexEntries(await collectionPages());

  const sets: IndexLink[] = [
    {
      label: 'Complete documentation',
      url: bundleUrl(FULL_BUNDLE_SLUG, site),
      description: `every page of the ${starlight.title} documentation as Markdown`,
    },
    ...llmsTxt.subsets.map((subset) => ({
      label: subset.label,
      url: bundleUrl(subset.slug, site),
      description: subset.description,
    })),
  ];

  const body = renderLlmsTxt({
    title: starlight.title,
    description: starlight.description,
    sets,
    pages: entries.map((page) => ({
      label: page.entry.data.title,
      url: pageUrl(page.path, site),
      description: page.entry.data.description,
    })),
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
