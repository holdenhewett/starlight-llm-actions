# Icon assets

Provider icons live here. They are inlined directly into the dropdown markup
at build time.

## Provenance

| File | Source | Slug | License |
|---|---|---|---|
| `claude.svg` | [Simple Icons](https://simpleicons.org/?q=claude) | `claude` | CC0 1.0 |
| `googlegemini.svg` | [Simple Icons](https://simpleicons.org/?q=gemini) | `googlegemini` | CC0 1.0 |
| `githubcopilot.svg` | [Simple Icons](https://simpleicons.org/?q=copilot) | `githubcopilot` | CC0 1.0 |
| `perplexity.svg` | [Simple Icons](https://simpleicons.org/?q=perplexity) | `perplexity` | CC0 1.0 |
| `cursor.svg` | [Simple Icons](https://simpleicons.org/?q=cursor) | `cursor` | CC0 1.0 |
| `deepseek.svg` | [Simple Icons](https://simpleicons.org/?q=deepseek) | `deepseek` | CC0 1.0 |
| `duckduckgo.svg` | [Simple Icons](https://simpleicons.org/?q=duckduckgo) | `duckduckgo` | CC0 1.0 |
| `huggingface.svg` | [Simple Icons](https://simpleicons.org/?q=huggingface) | `huggingface` | CC0 1.0 |
| `kagi.svg` | [Simple Icons](https://simpleicons.org/?q=kagi) | `kagi` | CC0 1.0 |
| `mistral.svg` | [Simple Icons](https://simpleicons.org/?q=mistral) | `mistralai` | CC0 1.0 |
| `chat-bubble.svg` | Original (generic glyph; fallback for ChatGPT, T3 Chat, Phind, Grok, Google AI Studio, You.com) | — | MIT (this repo) |

All Simple Icons SVGs are post-processed:

1. `<title>` element removed.
2. `<svg>` root rewritten to use `fill="currentColor"` (drop any explicit
   `fill` attribute on the path).
3. `width`/`height` attributes removed; size is controlled by CSS.
4. `role="img"` and `aria-label` added at the consumer level (in the
   component), not in the SVG file itself.

## Sourcing & refreshing

```sh
# In packages/starlight-llm-actions/icons/
for slug in claude googlegemini githubcopilot perplexity cursor deepseek duckduckgo huggingface kagi mistralai; do
  # Save `mistralai` as `mistral.svg`; everything else uses the slug verbatim.
  out="${slug}.svg"
  [ "$slug" = "mistralai" ] && out="mistral.svg"
  # The CDN already includes `fill="currentColor"`, so strip any existing
  # fill on `<svg>` first, then add ours back. Idempotent on re-runs even
  # if the CDN's default attributes change.
  curl -s "https://cdn.simpleicons.org/$slug" \
    | sed -e 's/<title>[^<]*<\/title>//' \
          -e 's/<svg [^>]*fill="[^"]*"/<svg/' \
          -e 's/<svg /<svg fill="currentColor" /' \
          -e 's/ width="[0-9]*"//' \
          -e 's/ height="[0-9]*"//' \
    > "$out"
done
```

Re-run periodically to pick up upstream brand updates.

## Trademark notice

Brand names and marks remain trademarks of their respective owners and appear
nominatively here only to identify the linked services. No endorsement is
implied. To use official brand assets in your own deployment, override the
`providers.<name>.icon` field in your plugin config.
