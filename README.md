# starlight-llm-actions

A [Starlight](https://starlight.astro.build) plugin that adds a Page Actions
dropdown to every doc page with:

- **Copy as Markdown** — fetches the page's markdown source and writes to clipboard
- **View as Markdown** — opens the markdown source in a new tab
- **Save as PDF** — triggers the browser print dialog
- **Open with `<provider>`** — opens the current page in an LLM (ChatGPT,
  Claude, Gemini, GitHub Copilot, Perplexity, T3 Chat, Cursor) using the most
  reliable per-provider strategy (URL fetch / inline content / clipboard + open).

> **Status:** v0.1.0 in active development. Not yet published to npm.

## Repository layout

```
docs/                         # Starlight playground site (uses the plugin)
packages/starlight-llm-actions/   # The publishable plugin package
PLAN.md                       # Roadmap and decision log
```

## Getting started (development)

```sh
pnpm install
pnpm dev   # boots the docs playground at http://localhost:4321
```

## Documentation

The plugin's published documentation will live in `packages/starlight-llm-actions/README.md`
once we're ready to publish. For now, see [PLAN.md](./PLAN.md) for the design,
configuration shape, and roadmap.

## License

MIT &copy; 2026 Holden Hewett. Icons sourced from [Simple Icons](https://simpleicons.org/)
under CC0. Brand names and marks remain trademarks of their respective owners
and appear nominatively to identify the linked services. No endorsement is
implied.
