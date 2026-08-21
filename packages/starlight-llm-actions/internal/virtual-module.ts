import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../config/resolve.js';
import type { StarlightLlmActionsConfig } from '../config/schema.js';
import type { SiteMeta } from './llms-txt.js';

const MODULE_ID = 'virtual:starlight-llm-actions/config';
const RESOLVED_ID = `\0${MODULE_ID}`;

const UNSAFE_CHARS: Record<string, string> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * JSON as a JavaScript **string literal**, not just as JSON.
 *
 * `JSON.stringify` alone is not enough to embed a value in generated source.
 * It leaves `<` and `>` intact, so a value containing `</script>` can break out
 * of a script tag if the generated module is ever inlined; and it emits U+2028
 * and U+2029 raw, which are legal in JSON but were string terminators in
 * JavaScript before ES2019. Escaping them yields identical runtime values —
 * `<` in a string literal *is* `<` — with none of the ambiguity.
 */
function serialize(value: unknown): string {
  return JSON.stringify(value).replace(
    /[<>\u2028\u2029]/g,
    (char) => UNSAFE_CHARS[char]!,
  );
}

/**
 * Vite plugin that exposes plugin config to Astro components and routes via
 * `virtual:starlight-llm-actions/config`. The default export is the
 * fully-resolved config; the `parsed` named export is the validated user
 * config (pre-resolve), which per-page code uses to re-resolve with a page
 * override layered on top.
 *
 * Uses Vite's standard "virtual module" convention: the resolved id is prefixed
 * with `\0` to opt out of file-system resolution and other plugins.
 *
 * The `starlight` export carries the site title and summary the index routes
 * print in `llms.txt`. They come from Starlight's config rather than this
 * plugin's, and a route has no way to reach that config, so they ride across the
 * same boundary the rest of the data does.
 *
 * The `renderer` export is generated code rather than config data for two
 * reasons. Config crosses this boundary as JSON, so a function-valued option
 * could never survive the trip; and Vite only follows `import()` calls whose
 * argument is a string literal, so writing the specifier into the module source
 * is what lets the optional `'simple'` dependencies stay optional — a `'raw'`
 * build emits `null` and never references them at all.
 */
export function virtualConfigPlugin(
  resolved: ResolvedConfig,
  parsed: StarlightLlmActionsConfig,
  rendererSpecifier: string | null,
  starlight: SiteMeta,
): Plugin {
  const renderer =
    rendererSpecifier === null
      ? 'null'
      : `() => import(${serialize(rendererSpecifier)})`;

  const moduleSource =
    `export default ${serialize(resolved)};\n` +
    `export const parsed = ${serialize(parsed)};\n` +
    `export const starlight = ${serialize(starlight)};\n` +
    `export const renderer = ${renderer};\n`;

  return {
    name: 'starlight-llm-actions:virtual-config',
    enforce: 'pre',
    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_ID) return { code: moduleSource, moduleType: 'js' };
      return null;
    },
  };
}
