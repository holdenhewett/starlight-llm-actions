# Per-page configuration overrides

**Status:** Designed; not yet implemented. Tracked in
[issue #26](https://github.com/holdenhewett/starlight-llm-actions/issues/26).

**Target release:** 0.4.0 (after the 0.3.0 catalog expansion ships).

## Motivation

The plugin is currently configured globally per Starlight site. Two real-world
use cases are impossible today:

1. **Multi-product documentation.** A site that documents several products
   (e.g. *Acme Cloud Auth* and *Acme Edge*) can't give each product a
   different "Open in LLM" prompt. Today every page sends the same prompt,
   so the LLM has no idea which product the user is asking about.
2. **Section-specific provider sets.** Internal-only sections may want to
   hide third-party providers; SDK reference pages may want Cursor enabled
   while the rest of the site doesn't.

The fix is to let frontmatter override a subset of the plugin config on a
per-page basis. This keeps the global default short and recognisable while
giving authors fine-grained control where it matters.

## Frontmatter shape

```ts
// Frontmatter key configurable via plugin's `pageOptOut` option.
// Default key: `llmActions`.
type PageOverrideFrontmatter =
  | false           // hide dropdown entirely (existing — unchanged)
  | true            // explicit "inherit global" (new, equivalent to omitting key)
  | PageOverride;   // partial override (new)

interface PageOverride {
  /**
   * Page-specific prompt. Layered precedence (highest first):
   *   1. per-page + per-provider prompt
   *   2. per-page top-level prompt        ← this field
   *   3. per-provider prompt (global config)
   *   4. global prompt (global config)
   * Same `{url}` / `{md_url}` placeholders apply.
   */
  prompt?: string;

  /** Override the dropdown trigger label on this page. */
  triggerLabel?: string;

  /** Per-page action toggles. `undefined` inherits; `false` hides. */
  actions?: {
    copyMarkdown?: boolean;
    viewMarkdown?: boolean;
    printPdf?: boolean;
    openIn?: boolean | OpenInPageOverride;
  };

  /** Per-page print notice (boolean or partial PrintNoticeConfig). */
  printNotice?: boolean | PrintNoticeOverride;
}

interface OpenInPageOverride {
  enabled?: boolean;
  label?: string;
  /** Overlay onto globally resolved providers. Same shape as plugin config. */
  providers?: Partial<Record<ProviderId, boolean | ProviderOverride>>;
}
```

## What's intentionally NOT page-overridable

| Field | Why |
|---|---|
| `markdownUrl` | Route is registered once at build; can't vary per page. |
| `injectRoute` | Build-time only. |
| `pageOptOut` | It *is* the frontmatter key — circular. |

## Worked examples

### The prime use case — multi-product prompt

```mdx
---
title: Acme Cloud authentication
llmActions:
  prompt: |
    You are reading Acme Cloud (Auth product) documentation.
    Treat questions as scoped to Acme Cloud Auth unless told otherwise.
    Page: {md_url}
---
```

```mdx
---
title: Acme Edge networking
llmActions:
  prompt: 'You are reading Acme Edge docs. Page: {md_url}'
---
```

### Section-specific provider override

```mdx
---
title: Internal-only API reference
llmActions:
  actions:
    openIn:
      providers:
        # Disable third-party providers on internal pages
        chatgpt: false
        gemini: false
        perplexity: false
        # Keep Copilot for code completion
---
```

### Per-page-per-provider prompt (the deepest case)

```mdx
---
title: SDK integration guide
llmActions:
  prompt: 'General context for this page: {md_url}'
  actions:
    openIn:
      providers:
        cursor:
          prompt: 'Use this docs page to scaffold an Acme SDK integration.'
---
```

## Design decisions (locked)

1. **Layered precedence for `prompt`:** page+provider > page > provider >
   global. Most expressive without forcing users into deep YAML when they
   don't need it.
2. **Provider merging is a partial overlay**, not replacement. A page that
   sets `cursor: true` adds Cursor on top of whatever the global config
   resolves to. Consistent with the global `providers` config semantics.
3. **`true` is allowed at the top level** as an explicit "inherit" so users
   can document intent (`llmActions: true # AI tools enabled here`).
4. **No `only:` / whitelist shorthand in v1.** Users who want "exactly these
   and nothing else" pass `<id>: false` for the ones they want hidden. Keeps
   the schema flat; can add shorthand later if real users ask.
5. **Frontmatter validation via Starlight's schema-extension API**
   (Zod-based), so missing/unknown keys surface at build time, not at
   runtime in the browser.

## Implementation plan

- New file: `packages/starlight-llm-actions/config/pageOverride.ts` with
  `PageOverrideSchema` (Zod) and `mergePageOverride(globalResolved, pageOverride): ResolvedConfig`.
- Document the Zod fragment users add to their content collections to enable
  type-checked frontmatter, and ship that fragment as a named export
  (e.g. `import { pageOverrideSchema } from 'starlight-llm-actions/schema'`).
- In `overrides/PageTitle.astro`, read frontmatter via
  `Astro.props.entry.data[pageOptOut]`, run merge, pass merged config to
  `<PageActions>`.
- Vitest: merge unit tests covering each precedence rule + round-trip from
  frontmatter → resolved config.
- Docs: new "Per-page overrides" guide page; cross-link from
  `configuration/reference.mdx` and `guides/per-page-opt-out.mdx`.

## Backwards compatibility

- `llmActions: false` continues to work as today (full opt-out).
- Pages with no `llmActions` key continue to inherit the global config.
- New: `llmActions: true` and `llmActions: { ... }` are additive.
- No plugin config option needs to change.

## Out of scope for v1

- Section-level (directory-level) overrides without per-page frontmatter.
  Astro/Starlight has no native "default frontmatter for all pages in a
  directory" — would require a remark plugin or a content-collection
  schema-default pattern. Punt to v2 if user demand exists.
- Whitelist shorthand (`providers: { only: [...] }`).
- Page-level `markdownUrl` overrides.
