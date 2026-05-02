# Changelog

## [0.6.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.5.1...v0.6.0) (2026-05-02)


### Features

* add trigger option and three new CSS custom properties ([#35](https://github.com/holdenhewett/starlight-llm-actions/issues/35)) ([ff066bc](https://github.com/holdenhewett/starlight-llm-actions/commit/ff066bcfa8499660b6a75ea0a83f7e81a6da6e91))

## [0.5.1](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.5.0...v0.5.1) (2026-05-01)


### Bug Fixes

* exclude components/PageActions.astro from attw entrypoint checks ([#32](https://github.com/holdenhewett/starlight-llm-actions/issues/32)) ([6cb5b8e](https://github.com/holdenhewett/starlight-llm-actions/commit/6cb5b8e6ae42cc1f7d3c4a55f7a5872fc2079c82))

## [0.5.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.4.0...v0.5.0) (2026-05-01)


### Features

* export standalone PageActions component and CSS variable system ([#30](https://github.com/holdenhewett/starlight-llm-actions/issues/30)) ([688a82f](https://github.com/holdenhewett/starlight-llm-actions/commit/688a82fa6571a26aa6e03b6157b18b93e24349f9))

## [0.4.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.3.0...v0.4.0) (2026-04-30)


### ⚠ BREAKING CHANGES

* **config:** Consumers must extend their content collection schema with `pageOverrideSchema` from `starlight-llm-actions/schema` for frontmatter overrides to type-check. Sites that don't use frontmatter overrides are unaffected at runtime.

### Features

* **config:** per-page overrides via frontmatter (closes [#26](https://github.com/holdenhewett/starlight-llm-actions/issues/26)) ([#27](https://github.com/holdenhewett/starlight-llm-actions/issues/27)) ([92bb3e4](https://github.com/holdenhewett/starlight-llm-actions/commit/92bb3e4832248fe4d06fc042daf7ed03c3186a32))

## [0.3.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.2.1...v0.3.0) (2026-04-30)


### ⚠ BREAKING CHANGES

* **providers:** Cursor and T3 Chat are now default-off. Sites relying on them appearing automatically must opt in:

### Features

* **deps:** upgrade zod to v4 ([#23](https://github.com/holdenhewett/starlight-llm-actions/issues/23)) ([cbd7931](https://github.com/holdenhewett/starlight-llm-actions/commit/cbd7931a121d76bf68ced4b31d67fbf02eec6787))
* **providers:** expand catalog to 16 LLM chat providers ([#25](https://github.com/holdenhewett/starlight-llm-actions/issues/25)) ([698fae8](https://github.com/holdenhewett/starlight-llm-actions/commit/698fae89f857351b4d34d2064fab4b8c7f6ce1da))

## [0.2.1](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.2.0...v0.2.1) (2026-04-29)


### Bug Fixes

* **plugin:** preserve user component overrides when injecting PageTitle ([#20](https://github.com/holdenhewett/starlight-llm-actions/issues/20)) ([afb0094](https://github.com/holdenhewett/starlight-llm-actions/commit/afb00943ce90b667c8c15a868a11c29aab1fab83))

## [0.2.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.1.1...v0.2.0) (2026-04-29)


### Features

* **actions:** add {md_url} placeholder and make it the default ([#16](https://github.com/holdenhewett/starlight-llm-actions/issues/16)) ([a402f52](https://github.com/holdenhewett/starlight-llm-actions/commit/a402f521b3c738497ae5efdc9ae04a5db4fab89e))

## 0.1.1 (2026-04-29)

### Bug Fixes

* **actions:** make `markdownHref` base-aware so the menu works on subpath deploys (e.g. GitHub Pages project sites). ([#15](https://github.com/holdenhewett/starlight-llm-actions/pull/15))

## 0.1.0 (2026-04-29)

Initial public release of `starlight-llm-actions` — a [Starlight](https://starlight.astro.build) plugin that adds a Page Actions dropdown to your docs site.

### Features

* Page Actions dropdown next to the page title with **Copy as Markdown**, **View as Markdown**, and optional **Download as PDF** actions.
* "Open in…" submenu for ChatGPT, Claude, Gemini, GitHub Copilot, Perplexity, T3 Chat, and Cursor — each using the most reliable per-provider strategy (`url-prompt`, `inline-content`, or `clipboard-open`).
* Configurable prompt template with a `{url}` placeholder, customisable globally or per provider.
* Per-page opt-out via frontmatter (`llmActions: false`).
* Optional print/PDF snapshot notice with branding row (logo + site name) and warning admonition, hidden on screen and visible only in `@media print`.
* Per-page Markdown route auto-injected at `/[...slug].md`; configurable via `markdownUrl` and `injectRoute`.
* Bundled provider icons (Simple Icons, CC0); icons can be overridden per provider.
* Strict TypeScript types, validated package metadata via `publint` and `arethetypeswrong`.
* Published to npm with [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) via OIDC.
