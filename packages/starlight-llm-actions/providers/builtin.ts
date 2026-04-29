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
   *   {prompt}                — resolved prompt (with {url} substituted)
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
}

/**
 * Verified provider URL schemes (2025-2026):
 * - chatgpt:    chatgpt.com/?q=          (community-confirmed, auto-submits)
 * - perplexity: perplexity.ai/?q=        (community-confirmed)
 * - t3chat:     t3.chat/new?q=           (path must be /new)
 * - cursor:     cursor.com/link/prompt?text=  (official deeplinks docs, 8KB cap)
 *
 * Clipboard-open fallback (no reliable URL prefill):
 * - claude:  web ?q= broken since Oct 2025; Desktop deep-link works but app-only
 * - gemini:  no native prefill; URL Context tool reads URLs once pasted
 * - copilot: ?prompt= undocumented; safer to copy + open
 */
export const BUILTIN_PROVIDERS: Record<ProviderId, BuiltinProvider> = {
  chatgpt: {
    label: 'ChatGPT',
    description: 'Open this page in ChatGPT',
    strategy: 'url-prompt',
    urlTemplate: 'https://chatgpt.com/?q={prompt}',
    iconFile: 'chat-bubble.svg',
  },
  claude: {
    label: 'Claude',
    description: 'Copies page, opens Claude',
    strategy: 'clipboard-open',
    urlTemplate: 'https://claude.ai/new',
    iconFile: 'claude.svg',
  },
  gemini: {
    label: 'Gemini',
    description: 'Copies page, opens Gemini',
    strategy: 'clipboard-open',
    urlTemplate: 'https://gemini.google.com/app',
    iconFile: 'googlegemini.svg',
  },
  copilot: {
    label: 'GitHub Copilot',
    description: 'Copies page, opens Copilot',
    strategy: 'clipboard-open',
    urlTemplate: 'https://github.com/copilot',
    iconFile: 'githubcopilot.svg',
  },
  perplexity: {
    label: 'Perplexity',
    description: 'Open this page in Perplexity',
    strategy: 'url-prompt',
    urlTemplate: 'https://www.perplexity.ai/?q={prompt}',
    iconFile: 'perplexity.svg',
  },
  t3chat: {
    label: 'T3 Chat',
    description: 'Open this page in T3 Chat',
    strategy: 'url-prompt',
    urlTemplate: 'https://t3.chat/new?q={prompt}',
    iconFile: 'chat-bubble.svg',
  },
  cursor: {
    label: 'Cursor',
    description: 'Open this page in Cursor',
    strategy: 'inline-content',
    urlTemplate: 'https://cursor.com/link/prompt?text={prompt_with_markdown}',
    maxBytes: 8000,
    fallbackStrategy: 'url-prompt',
    iconFile: 'cursor.svg',
  },
};

export const PROVIDER_IDS: readonly ProviderId[] = [
  'chatgpt',
  'claude',
  'gemini',
  'copilot',
  'perplexity',
  't3chat',
  'cursor',
];
