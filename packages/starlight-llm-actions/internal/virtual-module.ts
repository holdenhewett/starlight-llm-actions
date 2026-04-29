import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../config/resolve.js';

const MODULE_ID = 'virtual:starlight-llm-actions/config';
const RESOLVED_ID = `\0${MODULE_ID}`;

/**
 * Vite plugin that exposes the resolved plugin config to Astro components and
 * routes via `import config from 'virtual:starlight-llm-actions/config'`.
 *
 * Uses Vite's standard "virtual module" convention: the resolved id is prefixed
 * with `\0` to opt out of file-system resolution and other plugins.
 */
export function virtualConfigPlugin(resolved: ResolvedConfig): Plugin {
  const moduleSource = `export default ${JSON.stringify(resolved)};`;

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
