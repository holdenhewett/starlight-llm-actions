<div align="center">
  <h1>starlight-llm-actions 🤖</h1>
  <p>Starlight plugin adding a Page Actions dropdown — copy/view as Markdown, save as PDF, and "open in" ChatGPT, Claude, Gemini, GitHub Copilot, Perplexity, T3 Chat, or Cursor.</p>
</div>

<div align="center">
  <a href="https://github.com/holdenhewett/starlight-llm-actions/actions/workflows/ci.yml">
    <img alt="CI Status" src="https://github.com/holdenhewett/starlight-llm-actions/actions/workflows/ci.yml/badge.svg" />
  </a>
  <a href="https://www.npmjs.com/package/starlight-llm-actions">
    <img alt="npm version" src="https://img.shields.io/npm/v/starlight-llm-actions" />
  </a>
  <a href="https://github.com/holdenhewett/starlight-llm-actions/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/holdenhewett/starlight-llm-actions" />
  </a>
  <br />
</div>

## Getting Started

Want to get started immediately? Check out the
[getting started guide](https://holdenhewett.github.io/starlight-llm-actions/getting-started/install/)
on the documentation site.

## Features

A [Starlight](https://starlight.astro.build) plugin that adds a Page Actions dropdown to every doc page.

- **Copy as Markdown** — fetches the page's markdown source and writes to clipboard
- **View as Markdown** — opens the markdown source in a new tab
- **Save as PDF** — triggers the browser print dialog (off by default)
- **Open in `<provider>`** — opens the current page in ChatGPT, Claude, Gemini,
  GitHub Copilot, Perplexity, T3 Chat, or Cursor using the most reliable
  per-provider strategy (URL fetch / inline content / clipboard + open)
- Per-page opt-out via frontmatter
- Optional print/PDF snapshot disclaimer with branding row

## Install

```sh
npm install starlight-llm-actions
```

## Usage

Add the plugin to your Starlight config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmActions from 'starlight-llm-actions';

export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      plugins: [starlightLlmActions()],
    }),
  ],
});
```

### Per-page opt-out

Add `llmActions: false` to a page's frontmatter to hide the dropdown there:

```mdx
---
title: This page disables the actions
llmActions: false
---
```

### Enable the "Save as PDF" action

The PDF action is **off by default** — the print dialog can still be reached via
Cmd/Ctrl+P, and many sites prefer not to advertise PDF as a primary artifact.
To show the in-menu button:

```js
starlightLlmActions({
  actions: { printPdf: true },
})
```

## Configuration

For the full configuration reference — including per-provider overrides, the
print/PDF snapshot disclaimer, and the markdown URL template — see the
[configuration docs](https://holdenhewett.github.io/starlight-llm-actions/configuration/reference/).

## Customization

### Using a custom `PageTitle` override

If your Starlight config already has a custom `PageTitle` component, the plugin skips its automatic injection and logs a dev-mode warning. Import `PageActions` directly inside your override instead:

```astro
---
import Default from '@astrojs/starlight/components/PageTitle.astro';
import PageActions from 'starlight-llm-actions/components/PageActions.astro';
---

<div style="display: flex; align-items: flex-start; gap: 0.75rem;">
  <Default {...Astro.props}><slot /></Default>
  <PageActions />
</div>
```

The plugin integration still handles route injection and config resolution — only the UI placement is up to you.

### CSS variables

The plugin scopes its styles with a set of `--llm-*` custom properties declared on the `.sl-llm-actions` root element. These default to the equivalent Starlight design tokens, so the plugin looks native on any theme without extra configuration.

| Variable | Default |
|---|---|
| `--llm-bg` | `var(--sl-color-bg-nav)` |
| `--llm-text` | `var(--sl-color-text)` |
| `--llm-text-muted` | `var(--sl-color-gray-3)` |
| `--llm-border` | `var(--sl-color-hairline)` |
| `--llm-accent` | `var(--sl-color-accent)` |
| `--llm-font` | `var(--sl-font-system)` |
| `--llm-text-sm` | `var(--sl-text-sm)` |
| `--llm-text-xs` | `var(--sl-text-xs)` |
| `--llm-radius` | `0.375rem` |
| `--llm-shadow` | `none` |

Override any of these in your site's custom CSS to retheme the plugin without touching internal selectors:

```css
.sl-llm-actions {
  --llm-bg:     var(--my-surface-card);
  --llm-border: var(--my-border-default);
  --llm-shadow: var(--my-shadow-dropdown);
}
```

## License

Licensed under the MIT License, Copyright © Holden Hewett.

Icons sourced from [Simple Icons](https://simpleicons.org/) under CC0. Brand
names and marks remain trademarks of their respective owners and appear
nominatively here only to identify the linked services. No endorsement is
implied. To use official brand assets, override `providers.<name>.icon` in
your plugin config.

See [LICENSE](https://github.com/holdenhewett/starlight-llm-actions/blob/main/LICENSE) for more information.
