# starlight-llm-actions

> Add a Page Actions dropdown to your [Starlight](https://starlight.astro.build)
> docs site: copy as Markdown, view as Markdown, optionally save as PDF, and open
> the current page in ChatGPT, Claude, Gemini, GitHub Copilot, Perplexity,
> T3 Chat, or Cursor — using the most reliable per-provider strategy.

> **Status:** v0.1 in active development. Not yet published to npm.
> See [PLAN.md](https://github.com/hhewett/starlight-llm-actions/blob/main/PLAN.md).

## Install

```sh
npm install starlight-llm-actions
```

## Use

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

## Per-page opt-out

Add `llmActions: false` to a page's frontmatter to hide the dropdown there.

```mdx
---
title: This page disables the actions
llmActions: false
---
```

## Enabling the PDF action

The "Download as PDF" item is **off by default** — the print dialog can still be
reached via Cmd/Ctrl+P, and many sites prefer not to advertise PDF as a primary
artifact. To show the in-menu button:

```js
starlightLlmActions({
  actions: { printPdf: true },
})
```

## Print/PDF snapshot notice

For sites where printed or PDF copies tend to circulate, you can render a
snapshot disclaimer that's hidden on screen and visible only in `@media print`.
The notice prints regardless of how the user reaches the print dialog (Cmd/Ctrl+P,
the dropdown's PDF button, or browser menu).

```js
starlightLlmActions({
  printNotice: {
    branding: {
      logo: { src: '/logo.svg', alt: 'Acme', height: '1.5rem' },
      siteName: 'Acme DOCS',
    },
    warning: {
      title: 'Documentation Snapshot',
      message: [
        'This is a point-in-time export and may be outdated.',
        'Internal use only — do not redistribute.',
      ],
      // Live URL and export date are appended automatically.
      // Set to false to suppress either:
      // showUrl: false,
      // showDate: false,
    },
  },
})
```

Pass `printNotice: true` to enable the warning admonition with all defaults
(no branding row, no custom message). Pass `printNotice: false` (or omit) to
disable. Set either `branding: false` or `warning: false` inside the object
to render only one half.

## Configuration

Full reference to land in v0.1.0. See
[PLAN.md §4](https://github.com/hhewett/starlight-llm-actions/blob/main/PLAN.md)
for the public API surface during development.

## License

MIT &copy; 2026 Holden Hewett.

Icons sourced from [Simple Icons](https://simpleicons.org/) under CC0. Brand
names and marks remain trademarks of their respective owners and appear
nominatively here only to identify the linked services. No endorsement is
implied. To use official brand assets, override `providers.<name>.icon` in
your plugin config.
