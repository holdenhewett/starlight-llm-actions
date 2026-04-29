import type { AstroIntegration } from 'astro';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import {
  markdownUrlToRoutePattern,
  resolveConfig,
  type ResolvedConfig,
} from './config/resolve.js';
import type { StarlightLlmActionsConfig } from './config/schema.js';
import { virtualConfigPlugin } from './internal/virtual-module.js';

export type { StarlightLlmActionsConfig } from './config/schema.js';

function createAstroIntegration(resolved: ResolvedConfig): AstroIntegration {
  return {
    name: 'starlight-llm-actions',
    hooks: {
      'astro:config:setup'({ injectRoute, updateConfig }) {
        if (resolved.injectRoute) {
          injectRoute({
            pattern: markdownUrlToRoutePattern(resolved.markdownUrl),
            entrypoint: 'starlight-llm-actions/route',
            prerender: true,
          });
        }
        updateConfig({
          vite: {
            plugins: [virtualConfigPlugin(resolved)],
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
      'config:setup'({ config, updateConfig, addIntegration, logger }) {
        const resolved = resolveConfig(userConfig);

        const existingComponents = config.components ?? {};
        if (existingComponents.PageTitle) {
          logger.warn(
            'Skipping `PageTitle` override: another plugin or your site config has already overridden it. ' +
              'The Page Actions menu will not be rendered. ' +
              "To keep the menu, render `starlight-llm-actions`'s `PageActions` component from inside your own `PageTitle` override.",
          );
        } else {
          updateConfig({
            components: {
              ...existingComponents,
              PageTitle: 'starlight-llm-actions/overrides/PageTitle.astro',
            },
          });
        }

        addIntegration(createAstroIntegration(resolved));
      },
    },
  };
}
