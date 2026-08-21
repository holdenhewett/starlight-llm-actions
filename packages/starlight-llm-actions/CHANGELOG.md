# Changelog

## [0.13.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.12.1...v0.13.0) (2026-08-21)


### ⚠ Home page's Markdown URL moves on some templates

The root-page fix below changes where the home page's Markdown is emitted, but only for a `markdownUrl` template that puts a separator after `{slug}`. On `markdownUrl: '/{slug}/index.md'` the home page moved from `/index/index.md` to `/index.md`, and every reference to it moved with it — the dropdown link, the `rel="alternate"` tag, and the `llms.txt` entry. The default `/{slug}.md` is unaffected, and no other page changes on any template. Add a redirect if you had published the old URL.

### Deployment note: serve `.md` with `charset=utf-8`

Not a change in this release, but newly documented. Static hosts derive `Content-Type` from the file extension and some derive it without a charset; a browser handed a bare `text/markdown` decodes the body as windows-1252, turning every smart quote and em dash into mojibake. `aws s3 sync` does this by default, and `astro preview` reproduces it, so a local check will not warn you. See [Make sure your host sends `charset=utf-8`](https://github.com/holdenhewett/starlight-llm-actions/blob/main/packages/starlight-llm-actions/README.md#make-sure-your-host-sends-charsetutf-8).

### Features

* add llmsTxt title and description overrides ([#100](https://github.com/holdenhewett/starlight-llm-actions/issues/100)) ([5a837ef](https://github.com/holdenhewett/starlight-llm-actions/commit/5a837efdcf1b176046cbf753e184521d1e3a34d2)), closes [#95](https://github.com/holdenhewett/starlight-llm-actions/issues/95)
* publish Markdown for collections beyond docs ([#104](https://github.com/holdenhewett/starlight-llm-actions/issues/104)) ([dd668c0](https://github.com/holdenhewett/starlight-llm-actions/commit/dd668c07b923ca049235e98d56fb51688e49b1b8)), closes [#96](https://github.com/holdenhewett/starlight-llm-actions/issues/96)


### Bug Fixes

* resolve the root page's markdown URL to zero path segments ([#99](https://github.com/holdenhewett/starlight-llm-actions/issues/99)) ([fe87106](https://github.com/holdenhewett/starlight-llm-actions/commit/fe87106e1b5f07882a13d18f835f877abbc7fcac)), closes [#97](https://github.com/holdenhewett/starlight-llm-actions/issues/97)

## [0.12.1](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.12.0...v0.12.1) (2026-08-21)


### ⚠ Behavior change in 0.12.0

`llmsTxt.exclude` stopped applying to `llmsTxt.subsets` in 0.12.0. A subset's `paths` now override a corpus-wide `exclude`, so a subset whose globs name excluded pages ships those pages rather than resolving to an empty bundle. If you configured that pairing expecting the exclusion to win, the bundle now carries more pages than it did on 0.11.x. That change went out as a minor with no breaking marker — this is the warning its entry lacked. See [Subsets beat exclude](https://holdenhewett.github.io/starlight-llm-actions/guides/llms-txt/#subsets-beat-exclude).

### Bug Fixes

* type the generated config module instead of widening it to any ([#93](https://github.com/holdenhewett/starlight-llm-actions/issues/93)) ([7a80bfa](https://github.com/holdenhewett/starlight-llm-actions/commit/7a80bfae2ebf95c99ce9c1f3b4b28675c1b5a6c5))

## [0.12.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.11.0...v0.12.0) (2026-08-21)


### Features

* let a subset's paths override exclude ([#91](https://github.com/holdenhewett/starlight-llm-actions/issues/91)) ([e79be18](https://github.com/holdenhewett/starlight-llm-actions/commit/e79be180a04175c681bd2fb36170e25acca0b1d4))

## [0.11.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.10.1...v0.11.0) (2026-08-21)


### Features

* generate llms.txt and llms-full.txt from the Markdown pipeline ([#90](https://github.com/holdenhewett/starlight-llm-actions/issues/90)) ([f658590](https://github.com/holdenhewett/starlight-llm-actions/commit/f658590f767a9e67ba811ec798314f2bacc68c60))


### Bug Fixes

* escape brackets and backslashes in generated link labels ([#90](https://github.com/holdenhewett/starlight-llm-actions/issues/90)) ([f658590](https://github.com/holdenhewett/starlight-llm-actions/commit/f658590f767a9e67ba811ec798314f2bacc68c60))
* escape characters JSON.stringify leaves unsafe in generated source ([#88](https://github.com/holdenhewett/starlight-llm-actions/issues/88)) ([574a809](https://github.com/holdenhewett/starlight-llm-actions/commit/574a8094e26485ecbb9d10358c6f733253b5ccd5))
* keep a real 404 page out of llms.txt and every bundle ([#90](https://github.com/holdenhewett/starlight-llm-actions/issues/90)) ([f658590](https://github.com/holdenhewett/starlight-llm-actions/commit/f658590f767a9e67ba811ec798314f2bacc68c60))
* reject a markdownUrl template that is not site-absolute ([#90](https://github.com/holdenhewett/starlight-llm-actions/issues/90)) ([f658590](https://github.com/holdenhewett/starlight-llm-actions/commit/f658590f767a9e67ba811ec798314f2bacc68c60))
* resolve the default language from the locales key, as Starlight does ([#90](https://github.com/holdenhewett/starlight-llm-actions/issues/90)) ([f658590](https://github.com/holdenhewett/starlight-llm-actions/commit/f658590f767a9e67ba811ec798314f2bacc68c60))

## [0.10.1](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.10.0...v0.10.1) (2026-08-19)


### Bug Fixes

* preserve hero content and label structure in generated Markdown ([#84](https://github.com/holdenhewett/starlight-llm-actions/issues/84)) ([5bf8f85](https://github.com/holdenhewett/starlight-llm-actions/commit/5bf8f85d4d6988c04ae5f2ff3c3fe569d033188e))

## [0.10.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.9.0...v0.10.0) (2026-08-18)


### Features

* add renderMarkdown and linkAlternate options ([#76](https://github.com/holdenhewett/starlight-llm-actions/issues/76)) ([587c8c1](https://github.com/holdenhewett/starlight-llm-actions/commit/587c8c17dbaaab1922e8f467d667f2a4a12284ec))


### Bug Fixes

* render icons for every provider in the dropdown ([#77](https://github.com/holdenhewett/starlight-llm-actions/issues/77)) ([b36b5c1](https://github.com/holdenhewett/starlight-llm-actions/commit/b36b5c10e3efaf92ff04caf5ed5cd4201b668855))

## [0.9.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.8.0...v0.9.0) (2026-07-06)


### Features

* support Astro 7 and Starlight 0.41 ([#60](https://github.com/holdenhewett/starlight-llm-actions/issues/60)) ([0e2e010](https://github.com/holdenhewett/starlight-llm-actions/commit/0e2e010c852bf7b08cba1128d34d8bf3458b40db))

## [0.8.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.7.0...v0.8.0) (2026-05-08)


### Features

* add closeOnAction, toastDuration, and preOpenDelay options ([#44](https://github.com/holdenhewett/starlight-llm-actions/issues/44)) ([0fc9d14](https://github.com/holdenhewett/starlight-llm-actions/commit/0fc9d149d089614072a78710347b0202aeb606fb))

## [0.7.0](https://github.com/holdenhewett/starlight-llm-actions/compare/v0.6.0...v0.7.0) (2026-05-02)


### Features

* trigger option, CSS custom properties, and docs ([#37](https://github.com/holdenhewett/starlight-llm-actions/issues/37)) ([d076acb](https://github.com/holdenhewett/starlight-llm-actions/commit/d076acbba339fc4309afd64053d5005a4e85e6a4))

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
