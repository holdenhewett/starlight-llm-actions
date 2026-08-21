import {
  StarlightLlmActionsConfigSchema,
  type ActionsConfig,
  type LinkAlternateConfig,
  type LlmsTxtConfig,
  type OpenInConfig,
  type PrintNoticeBranding,
  type PrintNoticeConfig,
  type PrintNoticeWarning,
  type ProviderConfig,
  type ProviderId,
  type RenderMarkdownConfig,
  type StarlightLlmActionsConfig,
  type Strategy,
} from './schema.js';
import { BUILTIN_PROVIDERS, PROVIDER_IDS } from '../providers/builtin.js';
import { FULL_BUNDLE_SLUG } from '../internal/llms-txt.js';

/**
 * Fully-resolved provider entry. JSON-serializable: all values are strings,
 * numbers, or booleans. Built-in defaults are filled in; user overrides layer on top.
 */
export interface ResolvedProvider {
  id: ProviderId;
  label: string;
  description: string;
  prompt: string;
  strategy: Strategy;
  urlTemplate: string;
  maxBytes?: number;
  fallbackStrategy?: Strategy;
  /** Bundled SVG filename, an absolute URL, a site-relative path, or `false` to hide. */
  icon: string | false;
}

export interface ResolvedOpenIn {
  label: string;
  providers: ResolvedProvider[];
}

export interface ResolvedPrintNoticeLogo {
  src: string;
  alt: string;
  height: string;
}

export interface ResolvedPrintNoticeBranding {
  logo: ResolvedPrintNoticeLogo | null;
  siteName: string | null;
}

export interface ResolvedPrintNoticeWarning {
  title: string;
  message: string[];
  showUrl: boolean;
  showDate: boolean;
  urlLabel: string;
  dateLabel: string;
}

export interface ResolvedPrintNotice {
  branding: ResolvedPrintNoticeBranding | null;
  warning: ResolvedPrintNoticeWarning | null;
}

/**
 * Fully-resolved `renderMarkdown`. Discriminated on `mode` so the route can
 * branch without re-deriving the union from the user-facing shape.
 */
export type ResolvedRenderMarkdown =
  | { mode: 'raw' }
  | { mode: 'simple' }
  | { mode: 'module'; module: string };

export interface ResolvedLinkAlternate {
  /** `type` attribute value for the emitted `<link>`. */
  type: string;
  /** Emit an absolute URL (requires Astro `site`) rather than a root-relative one. */
  absolute: boolean;
}

/** One named subset, emitted at `/llms-{slug}.txt`. */
export interface ResolvedLlmsTxtSubset {
  label: string;
  /** Blurb for the subset's line in `llms.txt`. `null` when none was given. */
  description: string | null;
  /** Globs matching the entry ids this subset includes. */
  paths: string[];
  /** File-name stem, slugified from `label`. */
  slug: string;
}

export interface ResolvedLlmsTxt {
  promote: string[];
  demote: string[];
  exclude: string[];
  subsets: ResolvedLlmsTxtSubset[];
}

export interface ResolvedConfig {
  actions: {
    copyMarkdown: boolean;
    viewMarkdown: boolean;
    printPdf: boolean;
    openIn: false | ResolvedOpenIn;
  };
  prompt: string;
  triggerLabel: string;
  pageOptOut: string | false;
  /**
   * URL template for the per-page markdown route. Always begins with `/` and
   * contains `{slug}` exactly once.
   */
  markdownUrl: string;
  /** Whether the plugin should inject its own markdown route. */
  injectRoute: boolean;
  /** How the injected route renders each page body. */
  renderMarkdown: ResolvedRenderMarkdown;
  /** Per-page `<link rel="alternate">` tag config. `null` when disabled. */
  linkAlternate: ResolvedLinkAlternate | null;
  /** Site-level index generation. `null` when disabled. */
  llmsTxt: ResolvedLlmsTxt | null;
  /** Snapshot disclaimer for printed/PDF output. `null` when disabled. */
  printNotice: ResolvedPrintNotice | null;
  /** How the dropdown opens. `'click'` is the default. */
  trigger: 'click' | 'hover';
  /** Whether the dropdown closes after an action click. Defaults to `true`. */
  closeOnAction: boolean;
  /** Milliseconds the toast notification stays visible. Defaults to `3000`. */
  toastDuration: number;
  /** Milliseconds before opening a new tab in clipboard-open actions. Defaults to `300`. */
  preOpenDelay: number;
}

const DEFAULT_PROMPT = 'Read {md_url}. I want to ask questions about it.';
const DEFAULT_TRIGGER_LABEL = 'Copy page';
const DEFAULT_OPEN_IN_LABEL = 'Open in…';
const DEFAULT_PAGE_OPT_OUT = 'llmActions';
const DEFAULT_MARKDOWN_URL = '/{slug}.md';
const DEFAULT_LINK_ALTERNATE_TYPE = 'text/markdown';
const DEFAULT_LLMS_TXT_PROMOTE = ['index*'];
const DEFAULT_PRINT_NOTICE_TITLE = 'Documentation Snapshot';
const DEFAULT_PRINT_NOTICE_MESSAGE = [
  'This is a point-in-time export and may be outdated.',
];
const DEFAULT_PRINT_NOTICE_URL_LABEL = 'Live version: ';
const DEFAULT_PRINT_NOTICE_DATE_LABEL = 'Exported: ';
const DEFAULT_PRINT_NOTICE_LOGO_HEIGHT = '1.5rem';

/**
 * Validate a user config against the Zod schema and return the parsed shape.
 * Exposed so that per-page code can layer a page override on top of the
 * validated user config and re-run `resolveConfig` to produce a per-page
 * `ResolvedConfig` — without re-parsing the global config from scratch.
 */
export function parseConfig(
  userConfig: StarlightLlmActionsConfig = {},
): StarlightLlmActionsConfig {
  return StarlightLlmActionsConfigSchema.parse(userConfig);
}

export function resolveConfig(
  userConfig: StarlightLlmActionsConfig = {},
): ResolvedConfig {
  const parsed = parseConfig(userConfig);

  const prompt = parsed.prompt ?? DEFAULT_PROMPT;
  const triggerLabel = parsed.triggerLabel ?? DEFAULT_TRIGGER_LABEL;
  const pageOptOut =
    parsed.pageOptOut === undefined ? DEFAULT_PAGE_OPT_OUT : parsed.pageOptOut;
  const markdownUrl = parsed.markdownUrl ?? DEFAULT_MARKDOWN_URL;

  if (!markdownUrl.includes('{slug}')) {
    throw new Error(
      `starlight-llm-actions: \`markdownUrl\` must contain "{slug}". Got: "${markdownUrl}"`,
    );
  }

  // Every consumer treats the template as site-absolute and concatenates it onto
  // a `base` with its trailing slash stripped, so a relative template silently
  // produces `/docsslug.md`. Astro's `injectRoute` pattern needs the leading
  // slash too. Rejecting it here beats four subtly wrong URLs downstream.
  if (!markdownUrl.startsWith('/')) {
    throw new Error(
      `starlight-llm-actions: \`markdownUrl\` must start with "/". Got: "${markdownUrl}"`,
    );
  }

  return {
    actions: resolveActions(parsed.actions, prompt),
    prompt,
    triggerLabel,
    pageOptOut,
    markdownUrl,
    injectRoute: parsed.injectRoute ?? true,
    renderMarkdown: resolveRenderMarkdown(parsed.renderMarkdown),
    linkAlternate: resolveLinkAlternate(parsed.linkAlternate),
    llmsTxt: resolveLlmsTxt(parsed.llmsTxt),
    printNotice: resolvePrintNotice(parsed.printNotice),
    trigger: parsed.trigger ?? 'click',
    closeOnAction: parsed.closeOnAction ?? true,
    toastDuration: parsed.toastDuration ?? 3000,
    preOpenDelay: parsed.preOpenDelay ?? 300,
  };
}

function resolveActions(
  actions: ActionsConfig | undefined,
  globalPrompt: string,
): ResolvedConfig['actions'] {
  const config = actions ?? {};
  return {
    copyMarkdown: config.copyMarkdown ?? true,
    viewMarkdown: config.viewMarkdown ?? true,
    printPdf: config.printPdf ?? false,
    openIn: resolveOpenIn(config.openIn, globalPrompt),
  };
}

function resolveRenderMarkdown(
  value: RenderMarkdownConfig | undefined,
): ResolvedRenderMarkdown {
  if (value === undefined || value === 'raw') return { mode: 'raw' };
  if (value === 'simple') return { mode: 'simple' };
  return { mode: 'module', module: value.module };
}

function resolveLinkAlternate(
  value: boolean | LinkAlternateConfig | undefined,
): ResolvedLinkAlternate | null {
  if (value === undefined || value === false) return null;

  const config: LinkAlternateConfig = value === true ? {} : value;

  return {
    type: config.type ?? DEFAULT_LINK_ALTERNATE_TYPE,
    absolute: config.absolute ?? false,
  };
}

/**
 * Turn `'REST API v2'` into `'rest-api-v2'` — the stem of the file the subset is
 * emitted at.
 *
 * ASCII-only on purpose: the result becomes a URL path segment that agents are
 * expected to guess from the label, and percent-encoded bytes defeat that. A
 * label with nothing usable left is a config error rather than a silent
 * fallback, because the alternative is two subsets quietly overwriting each
 * other's file.
 */
function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveLlmsTxt(
  value: boolean | LlmsTxtConfig | undefined,
): ResolvedLlmsTxt | null {
  if (value === undefined || value === false) return null;

  const config: LlmsTxtConfig = value === true ? {} : value;

  /** slug -> the label that claimed it, for the collision message. */
  const claimed = new Map<string, string>();
  const subsets = (config.subsets ?? []).map((subset) => {
    const slug = slugifyLabel(subset.label);
    if (!slug) {
      throw new Error(
        `starlight-llm-actions: \`llmsTxt.subsets\` label "${subset.label}" leaves nothing a file name can use. ` +
          'Give it a label containing at least one ASCII letter or digit.',
      );
    }

    // The whole-corpus bundle already lives at this path, and both come out of
    // the same dynamic route, so this is a duplicate path rather than an
    // override of it.
    if (slug === FULL_BUNDLE_SLUG) {
      throw new Error(
        `starlight-llm-actions: \`llmsTxt.subsets\` label "${subset.label}" resolves to /llms-${FULL_BUNDLE_SLUG}.txt, ` +
          'which is where the whole-corpus bundle is served. Rename it.',
      );
    }

    const clash = claimed.get(slug);
    if (clash !== undefined) {
      throw new Error(
        `starlight-llm-actions: \`llmsTxt.subsets\` labels "${clash}" and "${subset.label}" both resolve to ` +
          `/llms-${slug}.txt. Rename one of them.`,
      );
    }
    claimed.set(slug, subset.label);

    return {
      label: subset.label,
      description: subset.description ?? null,
      paths: subset.paths,
      slug,
    };
  });

  return {
    // `index*` matches the home page on a stock Starlight site, and an index
    // page is the one document an agent reading top-down should see first.
    promote: config.promote ?? DEFAULT_LLMS_TXT_PROMOTE,
    demote: config.demote ?? [],
    exclude: config.exclude ?? [],
    subsets,
  };
}

function resolvePrintNotice(
  notice: boolean | PrintNoticeConfig | undefined,
): ResolvedPrintNotice | null {
  if (notice === undefined || notice === false) return null;

  const config: PrintNoticeConfig = notice === true ? {} : notice;

  return {
    branding: resolvePrintNoticeBranding(config.branding),
    warning: resolvePrintNoticeWarning(config.warning),
  };
}

function resolvePrintNoticeBranding(
  branding: false | PrintNoticeBranding | undefined,
): ResolvedPrintNoticeBranding | null {
  // Branding stays opt-in even when printNotice is enabled — there's no
  // sensible default for someone else's logo or site name.
  if (branding === undefined || branding === false) return null;

  const logo = branding.logo
    ? {
        src: branding.logo.src,
        alt: branding.logo.alt ?? '',
        height: branding.logo.height ?? DEFAULT_PRINT_NOTICE_LOGO_HEIGHT,
      }
    : null;

  return {
    logo,
    siteName: branding.siteName ?? null,
  };
}

function resolvePrintNoticeWarning(
  warning: false | PrintNoticeWarning | undefined,
): ResolvedPrintNoticeWarning | null {
  if (warning === false) return null;

  // The warning IS on by default whenever printNotice is enabled — that's the
  // primary thing this feature does.
  const config: PrintNoticeWarning = warning ?? {};

  return {
    title: config.title ?? DEFAULT_PRINT_NOTICE_TITLE,
    message: config.message ?? DEFAULT_PRINT_NOTICE_MESSAGE,
    showUrl: config.showUrl ?? true,
    showDate: config.showDate ?? true,
    urlLabel: config.urlLabel ?? DEFAULT_PRINT_NOTICE_URL_LABEL,
    dateLabel: config.dateLabel ?? DEFAULT_PRINT_NOTICE_DATE_LABEL,
  };
}

function resolveOpenIn(
  openIn: ActionsConfig['openIn'],
  globalPrompt: string,
): false | ResolvedOpenIn {
  if (openIn === false) return false;

  const config: OpenInConfig =
    openIn === true || openIn === undefined ? {} : openIn;
  if (config.enabled === false) return false;

  const label = config.label ?? DEFAULT_OPEN_IN_LABEL;
  const userProviders = config.providers ?? {};

  const providers = PROVIDER_IDS.flatMap((id) => {
    const resolved = resolveProvider(id, userProviders[id], globalPrompt);
    return resolved ? [resolved] : [];
  });

  return { label, providers };
}

function resolveProvider(
  id: ProviderId,
  userValue: ProviderConfig | undefined,
  globalPrompt: string,
): ResolvedProvider | null {
  if (userValue === false) return null;

  const builtin = BUILTIN_PROVIDERS[id];

  // Default-off providers must be explicitly opted into (true, or any object).
  if (userValue === undefined && !builtin.enabledByDefault) return null;

  const override =
    userValue === undefined || userValue === true ? {} : userValue;
  if (override.enabled === false) return null;

  return {
    id,
    label: override.label ?? builtin.label,
    description: override.description ?? builtin.description,
    prompt: override.prompt ?? globalPrompt,
    strategy: override.strategy ?? builtin.strategy,
    urlTemplate: override.url ?? builtin.urlTemplate,
    maxBytes: override.maxBytes ?? builtin.maxBytes,
    fallbackStrategy: override.fallbackStrategy ?? builtin.fallbackStrategy,
    icon: override.icon ?? builtin.iconFile,
  };
}

/**
 * Convert a `markdownUrl` template into the Astro route pattern Astro expects.
 * `{slug}` becomes `[...slug]`. Example: `/{slug}.md` → `/[...slug].md`.
 */
export function markdownUrlToRoutePattern(template: string): string {
  return template.replace('{slug}', '[...slug]');
}

/**
 * Substitute `{slug}` in the template with the entry slug.
 */
export function markdownUrlForSlug(template: string, slug: string): string {
  return template.replace('{slug}', slug);
}
