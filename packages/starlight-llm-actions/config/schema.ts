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

/**
 * How the injected Markdown route renders each page body.
 *
 * - `'raw'` (default) — emit the unprocessed entry source. MDX `import`
 *   statements and component tags pass through verbatim.
 * - `'simple'` — render the page and flatten it to plain Markdown. Needs the
 *   optional rendering dependencies installed (see README).
 * - `{ module }` — specifier of a module whose default export renders the body.
 *
 * Config reaches the route through a JSON-serialized virtual module, so an
 * inline function cannot survive the trip — a module specifier is the escape
 * hatch. Relative specifiers resolve against the Astro project root.
 */
const RenderMarkdownSchema = z.union([
  z.enum(['raw', 'simple']),
  z.object({ module: z.string().min(1) }).strict(),
]);

/**
 * `<link rel="alternate" type="text/markdown">` head tag pointing at the page's
 * Markdown URL. Signposts the Markdown alternate to agents that don't send an
 * `Accept: text/markdown` header.
 */
const LinkAlternateConfigSchema = z
  .object({
    /** `type` attribute value. Default `'text/markdown'`. */
    type: z.string().optional(),
    /**
     * Emit an absolute URL instead of a root-relative one. Requires `site` to
     * be set in the Astro config. Default `false`.
     */
    absolute: z.boolean().optional(),
  })
  .strict();

const LinkAlternateSchema = z.union([z.boolean(), LinkAlternateConfigSchema]);

/**
 * One content collection the plugin should publish Markdown for.
 *
 * The string form names a collection whose entry ids already are its site paths,
 * which is the case for Starlight's own `docs`. The object form is for a
 * collection served by its own route file, where the two differ.
 */
const CollectionConfigSchema = z
  .object({
    /** Collection name, as declared in `src/content.config.ts`. */
    name: z.string().min(1),
    /**
     * Site path template for one entry, with `{id}` standing for the entry id
     * and no leading slash — e.g. `'changelog/entry/{id}'`. Default `'{id}'`.
     */
    path: z.string().min(1).optional(),
  })
  .strict();

const CollectionsSchema = z
  .array(z.union([z.string().min(1), CollectionConfigSchema]))
  .min(1);

/**
 * One named subset of the docs, emitted as its own `/llms-{slug}.txt` bundle and
 * listed in `llms.txt`.
 */
const LlmsTxtSubsetSchema = z
  .object({
    /** Human-readable name, e.g. `'API'`. Slugified to build the file name. */
    label: z.string().min(1),
    /** Blurb appended after the subset's link in `llms.txt`. */
    description: z.string().optional(),
    /**
     * Globs matching the site paths to include, e.g. `['api/**']`. Takes
     * precedence over `exclude`. Matching nothing is a build error.
     */
    paths: z.array(z.string().min(1)).min(1),
  })
  .strict();

/**
 * Site-level index generation: `/llms.txt`, `/llms-full.txt`, and one
 * `/llms-{slug}.txt` per named subset.
 *
 * Patterns match a page's site path (e.g. `guides/example`) through picomatch —
 * the same glob dialect `starlight-llms-txt` uses, so an existing pattern list
 * ports over unchanged. For a `docs` page the path is the entry id; for any
 * other collection it is the id run through that collection's `path` template.
 */
const LlmsTxtConfigSchema = z
  .object({
    /** Site paths sorted to the top of every index. Default `['index*']`. */
    promote: z.array(z.string().min(1)).optional(),
    /** Site paths sorted to the end. Wins over `promote` when a page matches both. */
    demote: z.array(z.string().min(1)).optional(),
    /**
     * Site paths dropped from `llms.txt` and the full bundle. A `subsets` entry
     * naming a page in its `paths` overrides this, so an excluded page can
     * still ship as part of a targeted bundle. Per-page Markdown routes are
     * unaffected either way — an excluded page still serves its own `.md`.
     */
    exclude: z.array(z.string().min(1)).optional(),
    /** Named subsets, one extra bundle each. A subset's `paths` beat `exclude`. */
    subsets: z.array(LlmsTxtSubsetSchema).optional(),
  })
  .strict();

const LlmsTxtSchema = z.union([z.boolean(), LlmsTxtConfigSchema]);

export const StarlightLlmActionsConfigSchema = z
  .object({
    actions: ActionsConfigSchema.optional(),
    /**
     * URL template for per-page markdown. Use `{slug}` as the page-path placeholder.
     * Default: `/{slug}.md`. Sites that publish raw text under `.txt` can set
     * this to `/{slug}.txt`.
     */
    markdownUrl: z.string().optional(),
    /**
     * Content collections to publish Markdown for. Default `['docs']`.
     * An entry's site path defaults to its id; give the object form a `path`
     * template when the collection is served from a route of its own.
     */
    collections: CollectionsSchema.optional(),
    /**
     * Whether the plugin should inject its own markdown route at the pattern
     * derived from `markdownUrl`. Default `true`. Set to `false` if your site
     * already publishes per-page markdown (e.g. via a custom HTML→markdown
     * pipeline) and you only want the dropdown UI.
     */
    injectRoute: z.boolean().optional(),
    /**
     * How the injected route renders each page body. Default `'raw'`, which
     * preserves the behavior of every release before this option existed.
     */
    renderMarkdown: RenderMarkdownSchema.optional(),
    /**
     * Inject a per-page `<link rel="alternate" type="text/markdown">` tag
     * pointing at the page's Markdown URL. Default `false` (opt-in).
     */
    linkAlternate: LinkAlternateSchema.optional(),
    /**
     * Generate site-level indexes: `/llms.txt`, `/llms-full.txt`, and one
     * `/llms-{slug}.txt` per named subset. Default `false` (opt-in).
     *
     * The bundles run the same renderer the per-page Markdown route does, so
     * every Markdown surface on the site carries identical output. Needs `site`
     * set in the Astro config, because `llms.txt` links have to be absolute.
     */
    llmsTxt: LlmsTxtSchema.optional(),
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
    /**
     * How the actions dropdown opens.
     * - `'click'` (default): button click toggles the menu open/closed.
     * - `'hover'`: CSS `:hover` / `:focus-within` opens the menu; clicking
     *   "pins" it open so it stays visible after the cursor moves away.
     */
    trigger: z.enum(['click', 'hover']).optional(),
    /**
     * Whether to close the Page Actions dropdown after an action is clicked.
     * Defaults to `true`. Set to `false` to keep the menu open (useful when
     * chaining multiple actions). Has no effect when `trigger` is `'hover'`.
     */
    closeOnAction: z.boolean().optional(),
    /**
     * Milliseconds to wait after showing the toast before opening a new tab
     * in `clipboard-open` strategy actions. Allows the toast to render before
     * focus shifts away. Must be a non-negative integer. Defaults to `300`.
     */
    preOpenDelay: z.number().int().min(0).optional(),
    /**
     * How long (in milliseconds) the toast notification stays visible after an
     * action completes. Must be a positive integer. Defaults to `3000`.
     */
    toastDuration: z.number().int().positive().optional(),
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

/** Module specifier form of `renderMarkdown`. */
export interface RenderMarkdownModule {
  module: string;
}

export type RenderMarkdownConfig = 'raw' | 'simple' | RenderMarkdownModule;

export interface LinkAlternateConfig {
  type?: string;
  absolute?: boolean;
}

/** Object form of a `collections` entry, for a collection with its own route. */
export interface CollectionObjectConfig {
  name: string;
  path?: string;
}

export type CollectionConfig = string | CollectionObjectConfig;

export interface LlmsTxtSubset {
  label: string;
  description?: string;
  paths: string[];
}

export interface LlmsTxtConfig {
  promote?: string[];
  demote?: string[];
  exclude?: string[];
  subsets?: LlmsTxtSubset[];
}
