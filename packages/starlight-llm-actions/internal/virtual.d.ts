declare module 'virtual:starlight-llm-actions/config' {
  import type { ResolvedConfig } from '../config/resolve.js';
  import type { StarlightLlmActionsConfig } from '../config/schema.js';
  const config: ResolvedConfig;
  export default config;
  export const parsed: StarlightLlmActionsConfig;
}
