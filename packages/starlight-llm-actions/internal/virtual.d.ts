/**
 * Types for the module `internal/virtual-module.ts` generates at build time.
 *
 * Every type is referenced through an inline `import('...')` rather than an
 * `import type { X } from '...'` statement at the top of the block. That is not
 * a style choice: TypeScript rejects a relative import *declaration* inside an
 * ambient module declaration (TS2439) and then resolves the named types to
 * `any`. With `skipLibCheck` on — as the root tsconfig has it — that error is
 * suppressed, so the whole config silently becomes `any` at every import site
 * and nothing reports it. Inline `import()` types are legal here and resolve
 * relative to this file, in `dist/` exactly as in source.
 */
declare module 'virtual:starlight-llm-actions/config' {
  const config: import('../config/resolve.js').ResolvedConfig;
  export default config;
  export const parsed: import('../config/schema.js').StarlightLlmActionsConfig;
  /** Starlight's site title and summary, for the `llms.txt` header. */
  export const starlight: import('./llms-txt.js').SiteMeta;
  /**
   * Loads the configured Markdown renderer, or `null` when `renderMarkdown` is
   * `'raw'` and the injected route should emit the entry source unchanged.
   */
  export const renderer:
    | (() => Promise<{ default: import('./renderer.js').MarkdownRenderer }>)
    | null;
}
