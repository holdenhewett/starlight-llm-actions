# `starlight-llm-actions`

A [Starlight](https://starlight.astro.build) plugin that adds a Page Actions
dropdown to every doc page — copy as Markdown, view as Markdown, save as PDF,
and "open in" ChatGPT, Claude, Gemini, GitHub Copilot, Perplexity, T3 Chat,
or Cursor.

## Documentation

Full documentation is available at
**[holdenhewett.github.io/starlight-llm-actions](https://holdenhewett.github.io/starlight-llm-actions/)**.

## Package

If you are looking for the Starlight plugin package, you can find it in the
[`packages/starlight-llm-actions/`](./packages/starlight-llm-actions/) directory.

## Project structure

This project uses pnpm workspaces:

- [`packages/starlight-llm-actions/`](./packages/starlight-llm-actions/) — the
  publishable Starlight plugin
- [`docs/`](./docs/) — the Starlight documentation site (deployed to GitHub Pages)

## Development

```sh
pnpm install
pnpm dev   # builds the plugin and boots the docs site at http://localhost:4321
```

## License

[MIT](./LICENSE) © Holden Hewett.
