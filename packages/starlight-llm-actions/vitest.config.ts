import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const stub = (name: string) =>
  fileURLToPath(new URL(`./test/stubs/${name}.ts`, import.meta.url));

/**
 * Aliases for the two specifiers that only exist inside a running Astro build.
 *
 * `astro:content` is Astro's own virtual module, and
 * `virtual:starlight-llm-actions/config` is the one this plugin generates in
 * `internal/virtual-module.ts`. Everything the injected routes import reaches
 * one or both of them — `routes/llms-bundle.ts` imports the config directly and
 * again through `internal/index-routes.ts` and `internal/page-document.ts` — so
 * without these, a route cannot be imported outside a build at all.
 *
 * `resolve.alias` rather than `test.alias`: this package builds with `tsc`, so
 * Vite reads this file only when Vitest runs it, and the plain Vite option has
 * no Vitest-version churn.
 */
export default defineConfig({
  resolve: {
    alias: {
      'astro:content': stub('astro-content'),
      'virtual:starlight-llm-actions/config': stub('virtual-config'),
    },
  },
});
