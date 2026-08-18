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
| `openai.svg` | [Lobe Icons](https://lobehub.com/icons?q=openai) | `openai` | MIT |
| `grok.svg` | [Lobe Icons](https://lobehub.com/icons?q=grok) | `grok` | MIT |
| `aistudio.svg` | [Lobe Icons](https://lobehub.com/icons?q=aistudio) | `aistudio` | MIT |
| `phind.svg` | [Lobe Icons](https://lobehub.com/icons?q=phind) | `phind` | MIT |
| `chat-bubble.svg` | Original (generic glyph; fallback for T3 Chat and You.com) | — | MIT (this repo) |

All third-party SVGs are post-processed to a common house format:

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

Lobe Icons covers AI-product marks that Simple Icons does not. It publishes no
per-icon CDN, so pull the monochrome variant from the repo and apply the same
post-processing:

```sh
# In packages/starlight-llm-actions/icons/
base="https://raw.githubusercontent.com/lobehub/lobe-icons/master/packages/static-svg/icons"
for slug in openai grok aistudio phind; do
  # Already ships fill="currentColor"; strip the <title> and the 1em
  # width/height/style so CSS controls the size, as above.
  curl -s "$base/$slug.svg" \
    | sed -e 's/<title>[^<]*<\/title>//' \
          -e 's/ width="1em"//' \
          -e 's/ height="1em"//' \
          -e 's/ style="[^"]*"//' \
    > "$slug.svg"
done
```

Lobe Icons has no mark for T3 Chat or You.com, so those keep the generic
`chat-bubble.svg`.

Re-run periodically to pick up upstream brand updates.

## Trademark notice

Brand names and marks remain trademarks of their respective owners and appear
nominatively here only to identify the linked services. No endorsement is
implied. To use official brand assets in your own deployment, override the
`providers.<name>.icon` field in your plugin config.
