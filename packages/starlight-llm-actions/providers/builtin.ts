import type { ProviderId, Strategy } from '../config/schema.js';

export interface BuiltinProvider {
  /** Display label shown in the dropdown. */
  label: string;
  /** Short description shown under the label in the menu. */
  description: string;
  /** Default strategy for this provider. */
  strategy: Strategy;
  /**
   * URL template. Placeholders (URL-encoded at click-time):
   *   {prompt}                — resolved prompt (with {url} / {md_url} substituted)
   *   {prompt_with_markdown}  — prompt + "\n\n" + page markdown
   * For `clipboard-open` providers this is the static URL opened after copy.
   */
  urlTemplate: string;
  /**
   * Maximum bytes the URL may grow to when using `inline-content`. When over
   * budget the provider falls back to {@link fallbackStrategy}.
   */
  maxBytes?: number;
  /** Strategy used when over the `maxBytes` budget. */
  fallbackStrategy?: Strategy;
  /** Filename of the bundled icon SVG (under `../icons/`). */
  iconFile: string;
  /**
   * Whether the provider appears in the dropdown when the user has not
   * explicitly configured it. Default-off providers must be opted into by
   * setting `actions.openIn.providers.<id>: true` (or an override object).
   */
  enabledByDefault: boolean;
}

/**
 * Verified provider URL schemes (2025-2026):
 * - chatgpt:    chatgpt.com/?q=                    (community-confirmed, auto-submits)
 * - copilot:    github.com/copilot?prompt=         (officially documented Dec 17 2025)
 * - perplexity: perplexity.ai/?q=                  (community-confirmed)
 * - t3chat:     t3.chat/new?q=                     (path must be /new)
 * - cursor:     cursor.com/link/prompt?text=       (official deeplinks docs, 8KB cap)
 * - aistudio:   ai.studio/prompts/new_chat?prompt= (announced Nov 2025)
 * - youcom:     you.com/search?q=                  (community-confirmed)
 * - duckduckgo: duckduckgo.com/?q=...&ia=chat&duckai=1
 * - kagi:       kagi.com/assistant?q=              (officially documented)
 * - grok:       grok.com/?q=                       (third-party generators confirm)
 *
 * Clipboard-open fallback (no reliable URL prefill):
 * - claude:      web ?q= broken since Oct 2025
 * - gemini:      no native prefill
 * - mistral:     no documented prefill
 * - deepseek:    open feature request, no prefill
 * - huggingchat: no URL prefill
 * - phind:       no documented prefill
 */
export const BUILTIN_PROVIDERS: Record<ProviderId, BuiltinProvider> = {
  chatgpt: {
    label: 'ChatGPT',
    description: 'Open this page in ChatGPT',
    strategy: 'url-prompt',
    urlTemplate: 'https://chatgpt.com/?q={prompt}',
    iconFile: 'chat-bubble.svg',
    enabledByDefault: true,
  },
  claude: {
    label: 'Claude',
    description: 'Copies page, opens Claude',
    strategy: 'clipboard-open',
    urlTemplate: 'https://claude.ai/new',
    iconFile: 'claude.svg',
    enabledByDefault: true,
  },
  cursor: {
    label: 'Cursor',
    description: 'Open this page in Cursor',
    strategy: 'inline-content',
    urlTemplate: 'https://cursor.com/link/prompt?text={prompt_with_markdown}',
    maxBytes: 8000,
    fallbackStrategy: 'url-prompt',
    iconFile: 'cursor.svg',
    enabledByDefault: false,
  },
  deepseek: {
    label: 'DeepSeek',
    description: 'Copies page, opens DeepSeek',
    strategy: 'clipboard-open',
    urlTemplate: 'https://chat.deepseek.com/',
    iconFile: 'deepseek.svg',
    enabledByDefault: false,
  },
  duckduckgo: {
    label: 'DuckDuckGo',
    description: 'Open this page in DuckDuckGo AI Chat',
    strategy: 'url-prompt',
    urlTemplate: 'https://duckduckgo.com/?q={prompt}&ia=chat&duckai=1',
    iconFile: 'duckduckgo.svg',
    enabledByDefault: false,
  },
  gemini: {
    label: 'Gemini',
    description: 'Copies page, opens Gemini',
    strategy: 'clipboard-open',
    urlTemplate: 'https://gemini.google.com/app',
    iconFile: 'googlegemini.svg',
    enabledByDefault: true,
  },
  copilot: {
    label: 'GitHub Copilot',
    description: 'Open this page in GitHub Copilot',
    strategy: 'url-prompt',
    urlTemplate: 'https://github.com/copilot?prompt={prompt}',
    iconFile: 'githubcopilot.svg',
    enabledByDefault: true,
  },
  aistudio: {
    label: 'Google AI Studio',
    description: 'Open this page in Google AI Studio',
    strategy: 'url-prompt',
    urlTemplate: 'https://ai.studio/prompts/new_chat?prompt={prompt}',
    iconFile: 'chat-bubble.svg',
    enabledByDefault: false,
  },
  grok: {
    label: 'Grok',
    description: 'Open this page in Grok',
    strategy: 'url-prompt',
    urlTemplate: 'https://grok.com/?q={prompt}',
    iconFile: 'chat-bubble.svg',
    enabledByDefault: false,
  },
  huggingchat: {
    label: 'HuggingChat',
    description: 'Copies page, opens HuggingChat',
    strategy: 'clipboard-open',
    urlTemplate: 'https://huggingface.co/chat/',
    iconFile: 'huggingface.svg',
    enabledByDefault: false,
  },
  kagi: {
    label: 'Kagi Assistant',
    description: 'Open this page in Kagi Assistant',
    strategy: 'url-prompt',
    urlTemplate: 'https://kagi.com/assistant?q={prompt}',
    iconFile: 'kagi.svg',
    enabledByDefault: false,
  },
  mistral: {
    label: 'Mistral Le Chat',
    description: 'Copies page, opens Mistral Le Chat',
    strategy: 'clipboard-open',
    urlTemplate: 'https://chat.mistral.ai/chat',
    iconFile: 'mistral.svg',
    enabledByDefault: false,
  },
  perplexity: {
    label: 'Perplexity',
    description: 'Open this page in Perplexity',
    strategy: 'url-prompt',
    urlTemplate: 'https://www.perplexity.ai/?q={prompt}',
    iconFile: 'perplexity.svg',
    enabledByDefault: true,
  },
  phind: {
    label: 'Phind',
    description: 'Copies page, opens Phind',
    strategy: 'clipboard-open',
    urlTemplate: 'https://www.phind.com/agent',
    iconFile: 'chat-bubble.svg',
    enabledByDefault: false,
  },
  t3chat: {
    label: 'T3 Chat',
    description: 'Open this page in T3 Chat',
    strategy: 'url-prompt',
    urlTemplate: 'https://t3.chat/new?q={prompt}',
    iconFile: 'chat-bubble.svg',
    enabledByDefault: false,
  },
  youcom: {
    label: 'You.com',
    description: 'Open this page in You.com',
    strategy: 'url-prompt',
    urlTemplate: 'https://you.com/search?q={prompt}',
    iconFile: 'chat-bubble.svg',
    enabledByDefault: false,
  },
};

/**
 * Render order in the dropdown. Sorted alphabetically by display label so the
 * order users see matches the order they read.
 */
export const PROVIDER_IDS: readonly ProviderId[] = [
  'chatgpt',
  'claude',
  'cursor',
  'deepseek',
  'duckduckgo',
  'gemini',
  'copilot',
  'aistudio',
  'grok',
  'huggingchat',
  'kagi',
  'mistral',
  'perplexity',
  'phind',
  't3chat',
  'youcom',
];
