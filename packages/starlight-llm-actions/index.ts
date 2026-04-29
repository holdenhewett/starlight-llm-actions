import type { AstroIntegration } from 'astro';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import {
  markdownUrlToRoutePattern,
  resolveConfig,
  type ResolvedConfig,
} from './config/resolve';
import type { StarlightLlmActionsConfig } from './config/schema';
import { virtualConfigPlugin } from './internal/virtual-module';

export type { StarlightLlmActionsConfig } from './config/schema';

function createAstroIntegration(resolved: ResolvedConfig): AstroIntegration {
  return {
    name: 'starlight-llm-actions',
    hooks: {
      'astro:config:setup'({ injectRoute, updateConfig }) {
        if (resolved.injectRoute) {
          injectRoute({
            pattern: markdownUrlToRoutePattern(resolved.markdownUrl),
            entrypoint: new URL('./route.ts', import.meta.url),
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
      'config:setup'({ updateConfig, addIntegration }) {
        const resolved = resolveConfig(userConfig);

        updateConfig({
          components: {
            PageTitle: 'starlight-llm-actions/overrides/PageTitle.astro',
          },
        });

        addIntegration(createAstroIntegration(resolved));
      },
    },
  };
}
