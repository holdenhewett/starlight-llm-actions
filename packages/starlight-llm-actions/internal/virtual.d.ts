declare module 'virtual:starlight-llm-actions/config' {
  import type { ResolvedConfig } from '../config/resolve.js';
  import type { StarlightLlmActionsConfig } from '../config/schema.js';
  import type { MarkdownRenderer } from './renderer.js';
  const config: ResolvedConfig;
  export default config;
  export const parsed: StarlightLlmActionsConfig;
  /**
   * Loads the configured Markdown renderer, or `null` when `renderMarkdown` is
   * `'raw'` and the injected route should emit the entry source unchanged.
   */
  export const renderer:
    | (() => Promise<{ default: MarkdownRenderer }>)
    | null;
}
