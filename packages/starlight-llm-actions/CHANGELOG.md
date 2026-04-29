# Changelog

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
