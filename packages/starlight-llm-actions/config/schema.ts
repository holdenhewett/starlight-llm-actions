import { z } from 'zod';

const StrategyEnum = z.enum(['url-prompt', 'inline-content', 'clipboard-open']);

const ProviderOverrideSchema = z
  .object({
    enabled: z.boolean().optional(),
    label: z.string().optional(),
    description: z.string().optional(),
    prompt: z.string().optional(),
    /**
     * URL template. Placeholders are substituted client-side and URL-encoded:
     *   {prompt}                — resolved prompt with {url} / {md_url} substituted
     *   {prompt_with_markdown}  — prompt + "\n\n" + page markdown body
     */
    url: z.string().optional(),
    strategy: StrategyEnum.optional(),
    maxBytes: z.number().int().positive().optional(),
    fallbackStrategy: StrategyEnum.optional(),
    /** SVG filename under the package's `icons/` folder, an absolute URL, or `false` to hide. */
    icon: z.union([z.string(), z.literal(false)]).optional(),
  })
  .strict();

const ProviderConfigSchema = z.union([z.boolean(), ProviderOverrideSchema]);

const ProvidersConfigSchema = z
  .object({
    aistudio: ProviderConfigSchema.optional(),
    chatgpt: ProviderConfigSchema.optional(),
    claude: ProviderConfigSchema.optional(),
    copilot: ProviderConfigSchema.optional(),
    cursor: ProviderConfigSchema.optional(),
    deepseek: ProviderConfigSchema.optional(),
    duckduckgo: ProviderConfigSchema.optional(),
    gemini: ProviderConfigSchema.optional(),
    grok: ProviderConfigSchema.optional(),
    huggingchat: ProviderConfigSchema.optional(),
    kagi: ProviderConfigSchema.optional(),
    mistral: ProviderConfigSchema.optional(),
    perplexity: ProviderConfigSchema.optional(),
    phind: ProviderConfigSchema.optional(),
    t3chat: ProviderConfigSchema.optional(),
    youcom: ProviderConfigSchema.optional(),
  })
  .strict();

const OpenInConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    label: z.string().optional(),
    providers: ProvidersConfigSchema.optional(),
  })
  .strict();

const ActionsConfigSchema = z
  .object({
    copyMarkdown: z.boolean().optional(),
    viewMarkdown: z.boolean().optional(),
    printPdf: z.boolean().optional(),
    openIn: z.union([z.boolean(), OpenInConfigSchema]).optional(),
  })
  .strict();

/** Logo image inside the print-notice branding row. */
const PrintNoticeLogoSchema = z
  .object({
    /** URL or site-relative path to the image (e.g. `/logo.svg`). */
    src: z.string(),
    alt: z.string().optional(),
    /** CSS height value, e.g. `"1.5rem"`. Default `"1.5rem"`. */
    height: z.string().optional(),
  })
  .strict();

/**
 * Branding row rendered above the page H1 in print/PDF.
 * Hidden on screen; visible only in `@media print`.
 */
const PrintNoticeBrandingSchema = z
  .object({
    logo: PrintNoticeLogoSchema.optional(),
    /** Text rendered alongside the logo, e.g. `"Acme Docs"`. */
    siteName: z.string().optional(),
  })
  .strict();

/**
 * Warning admonition rendered below the page H1 in print/PDF.
 * Hidden on screen; visible only in `@media print`.
 */
const PrintNoticeWarningSchema = z
  .object({
    /** Bold heading inside the admonition. Default: `"Documentation Snapshot"`. */
    title: z.string().optional(),
    /** Body paragraphs. Each entry renders as a `<p>`. */
    message: z.array(z.string()).optional(),
    /** Append a paragraph showing the live page URL. Default `true`. */
    showUrl: z.boolean().optional(),
    /** Append a paragraph showing the export date. Default `true`. */
    showDate: z.boolean().optional(),
    /** Prefix for the URL paragraph. Default `"Live version: "`. */
    urlLabel: z.string().optional(),
    /** Prefix for the date paragraph. Default `"Exported: "`. */
    dateLabel: z.string().optional(),
  })
  .strict();

const PrintNoticeConfigSchema = z
  .object({
    branding: z
      .union([z.literal(false), PrintNoticeBrandingSchema])
      .optional(),
    warning: z
      .union([z.literal(false), PrintNoticeWarningSchema])
      .optional(),
  })
  .strict();

const PrintNoticeSchema = z.union([z.boolean(), PrintNoticeConfigSchema]);

export const StarlightLlmActionsConfigSchema = z
  .object({
    actions: ActionsConfigSchema.optional(),
    /**
     * URL template for per-page markdown. Use `{slug}` as the entry id placeholder.
     * Default: `/{slug}.md`. Sites that publish raw text under `.txt` can set
     * this to `/{slug}.txt`.
     */
    markdownUrl: z.string().optional(),
    /**
     * Whether the plugin should inject its own markdown route at the pattern
     * derived from `markdownUrl`. Default `true`. Set to `false` if your site
     * already publishes per-page markdown (e.g. via a custom HTML→markdown
     * pipeline) and you only want the dropdown UI.
     */
    injectRoute: z.boolean().optional(),
    prompt: z.string().optional(),
    triggerLabel: z.string().optional(),
    pageOptOut: z.union([z.string(), z.literal(false)]).optional(),
    /**
     * Snapshot disclaimer shown when the page is printed (Cmd/Ctrl+P, print
     * dialog, or "Download as PDF" action). Hidden on screen; visible only
     * in `@media print`. Off by default.
     *
     * - `true` enables the warning admonition with built-in defaults.
     * - Pass an object to customise the warning, supply branding (logo + site name), or both.
     * - Pass `false` (or omit) to disable.
     */
    printNotice: PrintNoticeSchema.optional(),
  })
  .strict();

export type StarlightLlmActionsConfig = z.input<
  typeof StarlightLlmActionsConfigSchema
>;

export type ProviderId =
  | 'aistudio'
  | 'chatgpt'
  | 'claude'
  | 'copilot'
  | 'cursor'
  | 'deepseek'
  | 'duckduckgo'
  | 'gemini'
  | 'grok'
  | 'huggingchat'
  | 'kagi'
  | 'mistral'
  | 'perplexity'
  | 'phind'
  | 't3chat'
  | 'youcom';

export type Strategy = z.infer<typeof StrategyEnum>;

export interface ProviderOverride {
  enabled?: boolean;
  label?: string;
  description?: string;
  prompt?: string;
  url?: string;
  strategy?: Strategy;
  maxBytes?: number;
  fallbackStrategy?: Strategy;
  icon?: string | false;
}

export type ProviderConfig = boolean | ProviderOverride;

export interface ProvidersConfig {
  aistudio?: ProviderConfig;
  chatgpt?: ProviderConfig;
  claude?: ProviderConfig;
  copilot?: ProviderConfig;
  cursor?: ProviderConfig;
  deepseek?: ProviderConfig;
  duckduckgo?: ProviderConfig;
  gemini?: ProviderConfig;
  grok?: ProviderConfig;
  huggingchat?: ProviderConfig;
  kagi?: ProviderConfig;
  mistral?: ProviderConfig;
  perplexity?: ProviderConfig;
  phind?: ProviderConfig;
  t3chat?: ProviderConfig;
  youcom?: ProviderConfig;
}

export interface OpenInConfig {
  enabled?: boolean;
  label?: string;
  providers?: ProvidersConfig;
}

export interface ActionsConfig {
  copyMarkdown?: boolean;
  viewMarkdown?: boolean;
  printPdf?: boolean;
  openIn?: boolean | OpenInConfig;
}

export interface PrintNoticeLogo {
  src: string;
  alt?: string;
  height?: string;
}

export interface PrintNoticeBranding {
  logo?: PrintNoticeLogo;
  siteName?: string;
}

export interface PrintNoticeWarning {
  title?: string;
  message?: string[];
  showUrl?: boolean;
  showDate?: boolean;
  urlLabel?: string;
  dateLabel?: string;
}

export interface PrintNoticeConfig {
  branding?: false | PrintNoticeBranding;
  warning?: false | PrintNoticeWarning;
}
