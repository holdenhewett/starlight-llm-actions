# starlight-llm-actions — Roadmap & Decision Log

> The full implementation plan lives in
> [`syllago-docs/docs/plans/2026-04-28-starlight-llm-actions.md`](https://github.com/OpenScribbler/syllago-docs/blob/main/docs/plans/2026-04-28-starlight-llm-actions.md).
> This file tracks day-to-day progress and any roadmap changes specific to
> the plugin repo.

## v0.1.0 — Initial release

Goal: feature-parity with `syllago-docs`'s existing `PageActions.astro`
component, plus correct per-provider URL strategies and configurable
markdown URL.

### Scope

| Area | Status |
|---|---|
| Repo scaffolded (Phase A) | In progress |
| Config schema + resolution (Phase B) | Not started |
| Per-provider strategy implementation (Phase B) | Not started |
| `[...slug].md` route injection (Phase B) | Not started |
| Component override (Phase B) | Not started |
| Playground validation (Phase C) | Not started |
| Consumer migration in syllago-docs (Phase D) | Not started |
| Publish to npm + community plugins page (Phase E) | Not started |

### Locked decisions

See `syllago-docs/docs/plans/2026-04-28-starlight-llm-actions.md` §3.
Summary:

- pnpm monorepo, MIT license, peer-dep `@astrojs/starlight >=0.36.0`
- All 7 providers enabled by default
- Per-provider config: `boolean | object` form with full overrides
- Frontmatter opt-out: `llmActions: false`
- Configurable markdown URL: string suffix or function
- Override slot: `PageTitle`
- Icons: Simple Icons (CC0) for 5 providers, generic chat-bubble for ChatGPT
  and T3 Chat, single `currentColor` SVG per provider, `icon` consumer override
  available.
- Do NOT bundle official brand assets.

## v0.2 — Candidates

- i18n via the `i18n:setup` hook (architecture already accommodates `locales`)
- Custom user-defined actions (extending `OpenInConfig.providers` with
  arbitrary keys)
- Build-time HEAD check for the markdown URL (auto-disable View-as-Markdown
  when the route 404s)
- Frontmatter schema augmentation for `llmActions` field
- Provider verification matrix (CI job that checks each provider URL still
  prefills correctly)

## Open questions

- Should we publish under a scope (e.g. `@openscribbler/starlight-llm-actions`)
  or as a bare name? Bare name for ecosystem discoverability; scope for
  organizational namespace.
- Do we want changesets, release-please, or manual versioning for v0.x?
- License header in source files: optional; consider adding once stable.
