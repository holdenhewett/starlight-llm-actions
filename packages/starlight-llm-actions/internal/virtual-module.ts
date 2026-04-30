import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../config/resolve.js';
import type { StarlightLlmActionsConfig } from '../config/schema.js';

const MODULE_ID = 'virtual:starlight-llm-actions/config';
const RESOLVED_ID = `\0${MODULE_ID}`;

/**
 * Vite plugin that exposes plugin config to Astro components and routes via
 * `virtual:starlight-llm-actions/config`. The default export is the
 * fully-resolved config; the `parsed` named export is the validated user
 * config (pre-resolve), which per-page code uses to re-resolve with a page
 * override layered on top.
 *
 * Uses Vite's standard "virtual module" convention: the resolved id is prefixed
 * with `\0` to opt out of file-system resolution and other plugins.
 */
export function virtualConfigPlugin(
  resolved: ResolvedConfig,
  parsed: StarlightLlmActionsConfig,
): Plugin {
  const moduleSource =
    `export default ${JSON.stringify(resolved)};\n` +
    `export const parsed = ${JSON.stringify(parsed)};\n`;

  return {
    name: 'starlight-llm-actions:virtual-config',
    enforce: 'pre',
    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_ID) return moduleSource;
      return null;
    },
  };
}
