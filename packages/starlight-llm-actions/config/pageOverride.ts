import { z } from 'zod';
import {
  StarlightLlmActionsConfigSchema,
  type ActionsConfig,
  type OpenInConfig,
  type PrintNoticeConfig,
  type ProviderConfig,
  type ProviderId,
  type ProvidersConfig,
  type StarlightLlmActionsConfig,
} from './schema.js';

/**
 * Frontmatter shape for per-page configuration overrides. Mirrors a subset of
 * the global plugin config — fields tied to build-time concerns
 * (`markdownUrl`, `injectRoute`, `pageOptOut`) are intentionally not
 * page-overridable.
 *
 * The frontmatter key itself is configurable via the plugin's `pageOptOut`
 * option (default `llmActions`).
 *
 *   llmActions: false             → hide the dropdown entirely
 *   llmActions: true              → explicit "inherit global"
 *   llmActions: { prompt: '...' } → partial override
 */
export const PageOverrideSchema = z.union([
  z.boolean(),
  StarlightLlmActionsConfigSchema.pick({
    prompt: true,
    triggerLabel: true,
    actions: true,
    printNotice: true,
  }),
]);

export type PageOverride = z.input<typeof PageOverrideSchema>;
export type PageOverrideObject = Exclude<PageOverride, boolean>;

/**
 * Layer a page-level override on top of the validated global user config.
 * Returns input-shape config ready to feed back into `resolveConfig` to
 * produce a per-page `ResolvedConfig`.
 *
 * Precedence rules:
 *   - Top-level fields (`prompt`, `triggerLabel`): page > global
 *   - `actions.{copyMarkdown, viewMarkdown, printPdf}`: page > global
 *   - `actions.openIn`: page entry overrides global entry; deep-merged when
 *     both are objects
 *   - `actions.openIn.providers`: page-mentioned ids overlay global; unmentioned
 *     ids inherit from global (partial overlay, not replacement)
 *   - Per-provider entries: deep-merge field-by-field when both are objects
 *   - `printNotice`: page entry overrides global entry; deep-merged when both
 *     are objects
 */
export function mergePageOverride(
  parsedGlobal: StarlightLlmActionsConfig,
  pageOverride: PageOverrideObject,
): StarlightLlmActionsConfig {
  return {
    ...parsedGlobal,
    prompt: pageOverride.prompt ?? parsedGlobal.prompt,
    triggerLabel: pageOverride.triggerLabel ?? parsedGlobal.triggerLabel,
    actions: mergeActions(parsedGlobal.actions, pageOverride.actions),
    printNotice: mergePrintNotice(
      parsedGlobal.printNotice,
      pageOverride.printNotice,
    ),
  };
}

function mergeActions(
  globalActions: ActionsConfig | undefined,
  pageActions: ActionsConfig | undefined,
): ActionsConfig | undefined {
  if (!pageActions) return globalActions;
  const base: ActionsConfig = globalActions ?? {};
  return {
    copyMarkdown: pageActions.copyMarkdown ?? base.copyMarkdown,
    viewMarkdown: pageActions.viewMarkdown ?? base.viewMarkdown,
    printPdf: pageActions.printPdf ?? base.printPdf,
    openIn: mergeOpenIn(base.openIn, pageActions.openIn),
  };
}

function mergeOpenIn(
  globalOpenIn: ActionsConfig['openIn'],
  pageOpenIn: ActionsConfig['openIn'],
): ActionsConfig['openIn'] {
  if (pageOpenIn === undefined) return globalOpenIn;
  if (pageOpenIn === false) return false;

  // Page set `openIn: true` → preserve any global object (so users keep their
  // custom providers / label) but force-enable. If global was already an
  // object, just keep it.
  if (pageOpenIn === true) {
    if (typeof globalOpenIn === 'object') return { ...globalOpenIn, enabled: true };
    return true;
  }

  // Page set an OpenInConfig object → deep-merge onto global object form.
  const base: OpenInConfig =
    globalOpenIn === undefined || globalOpenIn === true
      ? {}
      : globalOpenIn === false
        ? { enabled: false }
        : globalOpenIn;

  const merged: OpenInConfig = {
    enabled: pageOpenIn.enabled ?? base.enabled,
    label: pageOpenIn.label ?? base.label,
    providers: mergeProviders(base.providers, pageOpenIn.providers),
  };

  // Drop undefined keys to keep round-tripped config minimal.
  if (merged.enabled === undefined) delete merged.enabled;
  if (merged.label === undefined) delete merged.label;
  if (merged.providers === undefined) delete merged.providers;
  return merged;
}

function mergeProviders(
  globalProviders: ProvidersConfig | undefined,
  pageProviders: ProvidersConfig | undefined,
): ProvidersConfig | undefined {
  if (!pageProviders) return globalProviders;
  const base: ProvidersConfig = globalProviders ?? {};
  const merged: ProvidersConfig = { ...base };

  for (const id of Object.keys(pageProviders) as ProviderId[]) {
    const pageEntry = pageProviders[id];
    if (pageEntry === undefined) continue;
    merged[id] = mergeProvider(base[id], pageEntry);
  }
  return merged;
}

function mergeProvider(
  globalEntry: ProviderConfig | undefined,
  pageEntry: ProviderConfig,
): ProviderConfig {
  if (pageEntry === false) return false;

  // Page set `<id>: true` → enable the provider, preserving any global
  // object override so per-provider settings (label, url, prompt, …) survive.
  if (pageEntry === true) {
    if (typeof globalEntry === 'object') return { ...globalEntry, enabled: true };
    return true;
  }

  // Page set an object override. If global was an object, deep-merge
  // field-by-field with page winning. Otherwise, the page object replaces.
  if (typeof globalEntry === 'object') {
    return { ...globalEntry, ...pageEntry };
  }
  return pageEntry;
}

function mergePrintNotice(
  globalNotice: StarlightLlmActionsConfig['printNotice'],
  pageNotice: StarlightLlmActionsConfig['printNotice'],
): StarlightLlmActionsConfig['printNotice'] {
  if (pageNotice === undefined) return globalNotice;
  if (pageNotice === false) return false;

  if (pageNotice === true) {
    if (typeof globalNotice === 'object') return globalNotice;
    return true;
  }

  // Page provided a partial PrintNoticeConfig.
  const base: PrintNoticeConfig =
    globalNotice === undefined || globalNotice === true || globalNotice === false
      ? {}
      : globalNotice;

  const merged: PrintNoticeConfig = {
    branding: pageNotice.branding ?? base.branding,
    warning: pageNotice.warning ?? base.warning,
  };
  if (merged.branding === undefined) delete merged.branding;
  if (merged.warning === undefined) delete merged.warning;
  return merged;
}
