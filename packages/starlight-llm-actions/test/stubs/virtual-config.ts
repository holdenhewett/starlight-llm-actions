import { parseConfig, resolveConfig } from '../../config/resolve.js';
import type { StarlightLlmActionsConfig } from '../../config/schema.js';
import { siteMeta } from '../../internal/llms-txt.js';

/**
 * Stand-in for `virtual:starlight-llm-actions/config`, aliased in by
 * `vitest.config.ts`. Exports the same four names the real generated module
 * does, so a module under test cannot tell the difference.
 *
 * Built by running the real `resolveConfig`, not by hand-writing a
 * `ResolvedConfig`. A hand-written one would drift from resolution and let a
 * route pass its tests against a shape the plugin never produces.
 *
 * `exclude` and the `Reference` subset overlap on purpose: that overlap is the
 * precedence `subsetEntries` implements, and it is what the bundle route's
 * tests assert against.
 */
const USER_CONFIG: StarlightLlmActionsConfig = {
  llmsTxt: {
    exclude: ['reference/**'],
    subsets: [{ label: 'Reference', paths: ['reference/**'] }],
  },
};

const config = resolveConfig(USER_CONFIG);
export default config;

export const parsed = parseConfig(USER_CONFIG);

export const starlight = siteMeta({ title: 'Test Docs' });

/**
 * `null` is what the generator emits for `renderMarkdown: 'raw'`, the resolved
 * default above. It keeps `pageDocument` on its raw-source path, so these tests
 * never construct an Astro container.
 */
export const renderer = null;
