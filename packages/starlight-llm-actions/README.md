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

## License

Licensed under the MIT License, Copyright © Holden Hewett.

Icons sourced from [Simple Icons](https://simpleicons.org/) under CC0. Brand
names and marks remain trademarks of their respective owners and appear
nominatively here only to identify the linked services. No endorsement is
implied. To use official brand assets, override `providers.<name>.icon` in
your plugin config.

See [LICENSE](https://github.com/holdenhewett/starlight-llm-actions/blob/main/LICENSE) for more information.
