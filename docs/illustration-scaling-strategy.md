# Scaling the Illustration Library — Strategy

The catalog formula: **Niche → Subject → Variants** (Sports → Pickleball →
3–5 styles). Target: hundreds of illustrations feeding three consumers:

1. Rifle-style PDP designs (curated, per-product)
2. The Winsome Studio's illustration picker ("blank canvas + any icon")
3. The product composer's raw-artwork inputs (print pipeline)

## Recommended path: AI generation with a locked house style + human curation

**Pipeline**

1. **Style lock.** Assemble 20–40 exemplar images of the Winsome watercolor
   look. Use as style reference (Midjourney sref) or fine-tune (Flux LoRA).
   Evaluate **Recraft** first — it outputs true **SVG vectors**, ideal for
   both the studio engine and infinite-resolution print.
2. **Taxonomy-driven generation.** A spreadsheet of Niche → Subject → variant
   prompts, batch-generated. 30 niches × 10 subjects × 3 variants ≈ 900.
3. **Curation gate.** Human approve/reject (seconds each). Sydney or a brand
   owner does this pass — taste is the moat.
4. **QA + ingest.** Transparent background, consistent bounding/margins,
   print test at 300 DPI, then ingest with metadata: `niche`, `subject`,
   `variant`, `tags`, `palette`, `format-fitness`.

**Pilot before scaling:** one niche end-to-end (Sports ≈ 30 illustrations)
to validate style-lock quality and curation throughput.

## Decisions required before generating at scale

- **Brand-story tension (Sydney decision).** Site copy says "original
  hand-painted watercolor illustrations" (Darlene). Pure AI breaks that claim.
  Recommended resolution: hybrid — fine-tune on Darlene's art *with her
  involvement/compensation*, she art-directs and touches up hero pieces, copy
  softens to "original artwork in our signature style."
- **IP rails per niche.** Breeds, sports, hobbies: safe. Trademarked marks,
  team logos, characters: never generate. Greek life stays in the existing
  licensed lane.
- **Commercial rights.** Use paid tiers (Midjourney Pro / Recraft paid /
  self-hosted Flux) that grant commercial use.

## Alternatives considered

| Path | Speed | Cost | Verdict |
|---|---|---|---|
| AI + style lock + curation | days–weeks | ~pennies/image | **Recommended** |
| Stock/clipart bundles | weeks | $10–50/bundle | Gap-filler only; style drift + POD license landmines |
| Commissioned artists | months | $10–30k for hundreds | Best story; use for hero/flagship art |
| Generic icon libraries | instant | free | Wrong aesthetic |

## Asset spec (for whoever generates)

- Vector SVG preferred (Recraft), else PNG w/ alpha ≥ 2000px
- Consistent composition: subject centered, ~10% margin, no baked-in text
- Naming: `{niche}/{subject}-{variant}.svg` (e.g. `sports/pickleball-2.svg`)
- Sidecar metadata JSON per asset (niche, subject, tags, dominant colors)

This library's schema should be co-designed with the **product composer**
session — illustrations are the composer's raw artwork inputs, and the studio's
`Design[]` model is the runtime consumer.
