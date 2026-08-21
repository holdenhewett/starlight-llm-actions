import { createRequire } from 'node:module';
import type { AstroIntegration } from 'astro';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import {
  markdownUrlToRoutePattern,
  parseConfig,
  resolveConfig,
  type ResolvedConfig,
} from './config/resolve.js';
import type { StarlightLlmActionsConfig } from './config/schema.js';
import { siteMeta, type SiteMeta } from './internal/llms-txt.js';
import {
  findMissingSimpleDeps,
  missingSimpleDepsMessage,
  rendererSpecifier,
} from './internal/renderer.js';
import { virtualConfigPlugin } from './internal/virtual-module.js';

export type { StarlightLlmActionsConfig } from './config/schema.js';
export type { MarkdownRenderer } from './internal/renderer.js';

function createAstroIntegration(
  resolved: ResolvedConfig,
  parsed: StarlightLlmActionsConfig,
  rendererModule: string | null,
  starlightMeta: SiteMeta,
  pageTitleConflict: boolean,
): AstroIntegration {
  return {
    name: 'starlight-llm-actions',
    hooks: {
      'astro:config:setup'({ injectRoute, updateConfig, command, logger }) {
        if (pageTitleConflict && command === 'dev') {
          logger.warn(
            'A custom PageTitle override was detected. The automatic PageTitle injection has been skipped. ' +
              'To use page actions, import the component directly in your PageTitle override:\n' +
              "  import PageActions from 'starlight-llm-actions/components/PageActions.astro'",
          );
        }
        if (resolved.injectRoute) {
          injectRoute({
            pattern: markdownUrlToRoutePattern(resolved.markdownUrl),
            entrypoint: 'starlight-llm-actions/route',
            prerender: true,
          });
        }
        if (resolved.llmsTxt) {
          injectRoute({
            pattern: '/llms.txt',
            entrypoint: 'starlight-llm-actions/routes/llms-txt',
            prerender: true,
          });
          // One dynamic route covers `/llms-full.txt` and every subset. The
          // param sits inside the file name rather than owning a path segment,
          // so the bundles land beside `llms.txt` instead of under a directory.
          injectRoute({
            pattern: '/llms-[bundle].txt',
            entrypoint: 'starlight-llm-actions/routes/llms-bundle',
            prerender: true,
          });
        }
        updateConfig({
          vite: {
            plugins: [
              virtualConfigPlugin(resolved, parsed, rendererModule, starlightMeta),
            ],
          },
        });
      },
    },
  };
}

export default function starlightLlmActions(
  userConfig: StarlightLlmActionsConfig = {},
): StarlightPlugin {
  return {
    name: 'starlight-llm-actions',
    hooks: {
      'config:setup'({
        config,
        updateConfig,
        addIntegration,
        addRouteMiddleware,
        astroConfig,
      }) {
        const parsed = parseConfig(userConfig);
        const resolved = resolveConfig(parsed);

        if (resolved.renderMarkdown.mode === 'simple') {
          // Resolve from the project root, not from this package: that is where
          // Vite will resolve the renderer's own bare imports from, so it is the
          // only check that predicts whether the build will actually succeed.
          const requireFromRoot = createRequire(
            new URL('package.json', astroConfig.root),
          );
          const missing = findMissingSimpleDeps((specifier) =>
            requireFromRoot.resolve(specifier),
          );
          if (missing.length > 0) {
            throw new Error(missingSimpleDepsMessage(missing));
          }
        }

        if (resolved.llmsTxt && !astroConfig.site) {
          throw new Error(
            'starlight-llm-actions: `llmsTxt` needs an absolute URL to build its links from, ' +
              'but `site` is not set in your Astro config.\n' +
              "Set `site` (e.g. site: 'https://example.com'), or drop `llmsTxt`.",
          );
        }

        if (resolved.linkAlternate?.absolute && !astroConfig.site) {
          throw new Error(
            'starlight-llm-actions: `linkAlternate.absolute` needs an absolute URL to build from, ' +
              'but `site` is not set in your Astro config.\n' +
              "Set `site` (e.g. site: 'https://example.com'), or drop `absolute` to emit a root-relative href.",
          );
        }

        const rendererModule = rendererSpecifier(
          resolved.renderMarkdown,
          astroConfig.root,
        );

        const existingComponents = config.components ?? {};
        const pageTitleConflict = !!existingComponents.PageTitle;

        if (!pageTitleConflict) {
          updateConfig({
            components: {
              ...existingComponents,
              PageTitle: 'starlight-llm-actions/overrides/PageTitle.astro',
            },
          });
        }

        if (resolved.linkAlternate) {
          addRouteMiddleware({
            entrypoint: 'starlight-llm-actions/route-middleware',
          });
        }

        addIntegration(
          createAstroIntegration(
            resolved,
            parsed,
            rendererModule,
            siteMeta(config),
            pageTitleConflict,
          ),
        );
      },
    },
  };
}
