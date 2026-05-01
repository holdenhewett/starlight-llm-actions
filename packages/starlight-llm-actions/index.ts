import type { AstroIntegration } from 'astro';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import {
  markdownUrlToRoutePattern,
  parseConfig,
  resolveConfig,
  type ResolvedConfig,
} from './config/resolve.js';
import type { StarlightLlmActionsConfig } from './config/schema.js';
import { virtualConfigPlugin } from './internal/virtual-module.js';

export type { StarlightLlmActionsConfig } from './config/schema.js';

function createAstroIntegration(
  resolved: ResolvedConfig,
  parsed: StarlightLlmActionsConfig,
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
        updateConfig({
          vite: {
            plugins: [virtualConfigPlugin(resolved, parsed)],
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
      'config:setup'({ config, updateConfig, addIntegration }) {
        const parsed = parseConfig(userConfig);
        const resolved = resolveConfig(parsed);

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

        addIntegration(createAstroIntegration(resolved, parsed, pageTitleConflict));
      },
    },
  };
}
