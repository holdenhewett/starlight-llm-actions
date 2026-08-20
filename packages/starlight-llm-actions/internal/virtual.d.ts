declare module 'virtual:starlight-llm-actions/config' {
  import type { ResolvedConfig } from '../config/resolve.js';
  import type { StarlightLlmActionsConfig } from '../config/schema.js';
  import type { MarkdownRenderer } from './renderer.js';
  import type { SiteMeta } from './llms-txt.js';
  const config: ResolvedConfig;
  export default config;
  export const parsed: StarlightLlmActionsConfig;
  /** Starlight's site title and summary, for the `llms.txt` header. */
  export const starlight: SiteMeta;
  /**
   * Loads the configured Markdown renderer, or `null` when `renderMarkdown` is
   * `'raw'` and the injected route should emit the entry source unchanged.
   */
  export const renderer:
    | (() => Promise<{ default: MarkdownRenderer }>)
    | null;
}
