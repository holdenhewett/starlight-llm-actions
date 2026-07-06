# Astro 6 → 7 Migration Plan

**Status:** ready to implement
**Created:** 2026-07-06
**Branch:** `feat/astro-7` (off `origin/main` @ 0.8.0)

## Summary

Migrate the docs playground from **Astro 6.2.2 / Starlight 0.39.2** to
**Astro 7.0.6 / Starlight 0.41.3**. The gate is Starlight **0.41.0**, the release
that adds Astro 7 support and drops Astro 6 (peer `astro: ^7.0.2`).

The docs workspace needs only version bumps. The published plugin needs exactly
**one backward-compatible code change** (a Vite 8 / Rolldown requirement). The
rest of the effort is verification, because the risky v7 changes affect
*rendered output*, not APIs.

## Current state

| Package | Now | Target |
|---|---|---|
| `astro` (docs) | 6.2.2 | ^7.0.6 |
| `@astrojs/starlight` (docs) | 0.39.2 | ^0.41.3 |
| `vite` | 7.x | 8.x (transitive via Astro 7) |
| `@astrojs/mdx` | 5.x | 7.x (transitive via Starlight 0.41) |

Node floor is unchanged in v7 (`>=22.12.0`), so `engines`, the CI matrix
(Node 22/24), and pnpm 9.12 all stay as they are.

Plugin peer ranges are already open-ended (`astro >=5.6.0`,
`@astrojs/starlight >=0.36.0`, `vite >=5.0.0`) and stay that way — see
[Decision: keep open peer ranges](#decision-keep-open-peer-ranges).

## What Astro 7 changes, mapped to our exposure

| v7 change | Our exposure | Action |
|---|---|---|
| **Vite 8** (Rolldown, not Rollup/esbuild) | Our virtual-module Vite plugin returns raw source from `load()` with no extension on the resolved id | **Required fix** (below) |
| **Rust compiler** — unclosed non-void tags are now build errors; invalid nesting passes through uncorrected | Both shipped `.astro` components audited as strictly valid | Build will catch regressions deterministically |
| **`compressHTML` default `true` → `'jsx'`** — newline-separated inline elements lose their separating space | Cosmetic only (flex layouts). One print-banner edge case for consumer custom labels | Optional hardening (below) |
| **Sätteri** replaces remark/rehype as default markdown pipeline | Starlight 0.41 bundles its own Sätteri pipeline; we add zero custom remark/rehype plugins. Our `/route.ts` serves raw `entry.body`, untouched by any processor | None — verify only |
| Experimental flags stabilized, `@astrojs/db` removed, Container API moved, `src/fetch.ts` reserved | None apply — no experimental flags, no db, no Container API, no `src/fetch.ts` | None |
| Starlight 0.39 sidebar `autogenerate` must be wrapped in `items` | Sidebar is fully explicit | None |

## Plugin dev-time peer resolution (typecheck fix)

The plugin declared its peers (`@astrojs/starlight`, `astro`) but had **no
devDependency** on them, so pnpm resolved them for the plugin's own build/typecheck
to a stale **Starlight 0.38.4 / astro 6.1.10** — versions the rest of the repo left
behind. That made `pnpm -r typecheck` fail (7 errors, all inside Starlight's source)
and meant the published package was still developed against Astro 6. Two changes fix
it:

1. **`packages/starlight-llm-actions/package.json`** — add devDependencies
   `@astrojs/starlight ^0.41.3` and `astro ^7.0.6` so the plugin builds and
   typechecks against the same stack the repo now targets. (devDeps aren't shipped
   to consumers, so peer ranges stay open — see the decision below.)

2. **`packages/starlight-llm-actions/internal/starlight-env.d.ts`** (new) — ambient
   shim. `index.ts` imports `StarlightPlugin` from `@astrojs/starlight/types`, which
   Starlight ships as raw `.ts` source (not `.d.ts`), so `skipLibCheck` can't skip
   it and importing it drags Starlight's internals into our program. Those internals
   reference build-time virtual modules (`virtual:starlight/*`) and the
   `StarlightApp` namespace that only exist inside a running Astro build — Starlight
   itself flags this in a TODO in its `virtual.d.ts`, and doesn't export the
   declarations. The shim references `astro/client` and stubs those virtual modules
   so the plugin typechecks in isolation. It's types-only and stays out of `dist/`.

## Required code change

**`packages/starlight-llm-actions/internal/virtual-module.ts`** — Rolldown (Vite 8)
infers a module's type from the resolved id's file extension. Our resolved id is
`\0virtual:starlight-llm-actions/config` — no extension — so `load()` must declare
the type explicitly:

```ts
load(id) {
  if (id === RESOLVED_ID) return { code: moduleSource, moduleType: 'js' };
  return null;
},
```

Backward-compatible: the object form has always been valid and Vite 5–7 ignore the
extra field, so one change serves consumers on every Astro version we support.

## Optional hardening (direct consequence of the compressHTML change)

**`packages/starlight-llm-actions/overrides/PageTitle.astro`** (lines ~68–78) — insert
an explicit `{' '}` between `{warning.urlLabel}` / `{warning.dateLabel}` and their
`<span>`s. Default labels ship with a trailing space so defaults are safe, but a
consumer's custom label without one would render `Live version:https://…` in the
print banner under `compressHTML: 'jsx'`. HTML collapses the doubled space, so this
is harmless for defaults.

## Execution phases

### Phase 0 — Baseline
- Branch `feat/astro-7` off `origin/main`.
- Build on the **current** stack; snapshot the generated `/…​.md` endpoint outputs
  under `docs/dist/` as a regression baseline. These serve raw `entry.body` and
  must be **byte-identical** after the migration — a free correctness check.

### Phase 1 — Bump docs workspace
- `docs/package.json`: `astro ^7.0.6`, `@astrojs/starlight ^0.41.3`. MDX 7, Vite 8,
  and Sätteri arrive transitively.
- `pnpm install`. No changes to `astro.config.mjs`, `content.config.ts`, or
  `tsconfig.json` — verified nothing in them is touched by v7.

### Phase 2 — Plugin change
- Apply the required `moduleType: 'js'` fix.
- Apply the optional `PageTitle.astro` whitespace hardening.

### Phase 3 — Verify (the bulk of "safely")
- `pnpm -r typecheck` — now green (exit 0) after the peer-resolution fix above; also
  exercises TS 6.0.3 against Astro 7 types.
- Plugin: `build` + `vitest run`, then `publint` + `attw --pack` (matches CI).
- `pnpm build` for docs — the Rust-compiler gauntlet for both components and all
  24 MDX pages.
- **Regression diff:** new `/…​.md` endpoints vs the Phase 0 baseline → expect
  identical. HTML *will* differ (Sätteri + `'jsx'`), so instead spot-check in the
  dev server: asides / code blocks / tables on a few MDX pages, the dropdown
  (copy / view / PDF / open-in), print preview for the banner, and menu re-init
  after client-side nav (`astro:page-load`).

### Phase 4 — Release (deferred; requires explicit approval)
- Commit as `feat: support Astro 7 / Starlight 0.41` so release-please surfaces it
  (base is already 0.8.0, so target 0.9.0 — consumers scan changelogs for
  "Astro 7 support").
- Merge → GitHub Pages redeploys the playground on Astro 7.
- **Rollback is a plain PR revert** — lockfile-pinned, static site, no data or
  integration state.

## Decision: keep open peer ranges

Keep the plugin's `>=` peer ranges rather than raising minimums to Astro 7 /
Starlight 0.41. The code uses only APIs stable across Astro 5.6 → 7, and the one
change is compatible everywhere, so raising minimums would force every consumer to
upgrade Astro for our next release with zero benefit to us. Honest cost: CI now only
*exercises* Astro 7, so old-stack support becomes "believed to work" rather than
"tested" — acceptable for a plugin this small.

## Out of scope (per simplicity)

- No dual-version (Astro 6 + 7) test matrix.
- No dependabot changes (its major-bump ignore covers only the plugin peers, which
  we are not bumping).
