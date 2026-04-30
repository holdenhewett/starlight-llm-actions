# Changelog

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
