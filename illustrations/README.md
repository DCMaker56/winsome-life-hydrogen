# The Winsome Life — Illustration Library Pipeline

Owner: **Iris** (illustration lead). Single source of truth: `taxonomy.json`.

## The plan (validated)

**18 niches · 207 subjects · 3 styles = 621 illustrations** in the first pass.
Greek Life is deliberately excluded (licensed/trademarked — stays in its
existing lane).

Every illustration is `{niche}/{subjectSlug}-{styleKey}` —
e.g. `sports/pickleball-paddle-with-a-ball-heritage-sketch`.

## The three styles (locked — see the style-guide memory)

| Key | Customer name | Feel |
|---|---|---|
| `watercolor` | Watercolor | Soft, artistic, classic |
| `heritage-sketch` | Heritage Sketch | Timeless, sophisticated, heirloom |
| `modern-graphic` | Modern Graphic | Clean, fresh, contemporary |

Prompts are FIXED. Only `[SUBJECT]` changes. Every prompt = style prompt +
`universalSuffix`; `negativePrompt` applied where supported.

## The one blocker

`RECRAFT_API_KEY` in the repo `.env` (or the remote Recraft MCP connected).
Claude cannot generate images in-environment. Build a Recraft **custom style**
from ~20 existing Winsome illustrations first, so every generation is brand-locked.

## The loop (built the moment the key lands)

1. **Generate** — a runner reads `taxonomy.json`, expands every
   subject × style, calls Recraft with the locked style + composed prompt,
   writes results to `illustrations/generated/{niche}/{slug}-{style}.svg`
   (Recraft outputs true SVG) plus a `manifest.json`.
2. **Curate** — a lightweight review page shows each generation with
   Approve / Reject (and a Regenerate button that re-rolls that one cell).
   Sydney's taste is the gate; approvals flip a flag in the manifest.
3. **Ingest** — approved assets move to the studio's design library with
   metadata (`niche`, `subject`, `style`, `tags`), and the Winsome Studio's
   "Design" step becomes the real illustration browser (pick subject → pick style).

## Pilot first

**Sports (60 illustrations)** is flagged `"pilot": true`. Run it end-to-end —
generate → Sydney curates → live in the studio — to validate style-lock quality
and curation throughput before scaling to the full 621.

## Cost

~$0.01–0.08 per image via Recraft → the full 621 is roughly **$6–$50**. The
pilot is a few dollars.

Strategy context: `../docs/illustration-scaling-strategy.md`.
