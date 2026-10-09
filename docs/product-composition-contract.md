# Shared Product Composition Contract

> **Purpose.** This is the single source of truth that links the **internal
> back-end product composer** (how The Winsome Life builds products) and the
> **customer-facing Design Studio** (how customers personalize them).
>
> The two are the same engine viewed from opposite ends:
> **the composer AUTHORS a `ProductTemplate`; the studio RENDERS + personalizes it.**
> If the composer's output format equals the studio's input format, then every
> product the company builds is automatically customer-customizable, with zero
> translation layer.
>
> The front-end studio already implements a working version of this model
> (`app/lib/studio.ts` + `app/components/studio/StudioCanvas.tsx` in the
> Hydrogen repo). Treat the types below as the **starting contract** — extend,
> don't reinvent.

---

## The core seam

```
┌─────────────────────────┐        ProductTemplate (JSON)        ┌──────────────────────────┐
│  Back-end Composer       │  ───────────────────────────────▶  │  Front-end Design Studio  │
│  (internal authoring)    │   format + design + scenes +        │  (customer WYSIWYG)       │
│                          │   option axes + print specs         │                           │
│  • lay out text zones    │                                     │  • render template        │
│  • place artwork layers  │   ◀───────────────────────────────  │  • collect Personalization│
│  • upload mockup + print │        Personalization (JSON)        │  • serialize to cart      │
│    -res raw artwork      │     the customer's filled-in values  │  • (later) print export   │
└─────────────────────────┘                                      └──────────────────────────┘
```

**Two objects cross the wire:**
- `ProductTemplate` — what the composer produces, one per sellable design. Static.
- `Personalization` — what a customer fills in, per order line. Dynamic.

A renderer that takes `(ProductTemplate, Personalization)` produces both the
**live preview** and the **300-DPI print file** — same document, two resolutions.
That invariant is the whole reason this architecture pays off for in-house
production.

---

## The shared rendering invariant

Everything printable is authored in **format space where 1 unit = 0.01 inch**.
An A2 card (5.5"×4.25") is `550 × 425`. This means:
- the same coordinates drive the on-screen SVG preview AND a server-side
  300-DPI rasterization for the printer,
- nothing has to be re-measured or re-positioned between preview and press.

The composer must author zone/layer coordinates in this space (or in 0..1
fractions of it, as the studio currently does).

---

## `ProductTemplate` — the contract (current studio model)

```ts
interface ProductTemplate {
  // ── Physical format ──
  key: string;                 // "notecard" | "notepad" | "wine-tag" | "gift-tag" | "place-card" | …
  label: string;
  sizeNote: string;            // human copy, e.g. 'A2 flat · 5.5" × 4.25"'
  width: number;               // format-space units (1 = 0.01")
  height: number;
  printDpi: number;            // ⟵ COMPOSER ADDS. e.g. 300. width/printDpi*… → physical size
  bleed?: number;              // ⟵ COMPOSER ADDS. print bleed in format units
  safeArea?: number;           // ⟵ COMPOSER ADDS. keep-out margin for text/art

  // ── Where personalization prints ──
  zones: TextZone[];           // named text slots (primary / secondary / …)
  hole?: { cx; cy; r };        // die-cut (wine/gift tags)
  ruledLines?: { startY; endY; gap; inset };  // notepad rules

  // ── Authored artwork ──
  designs: Design[];           // selectable artwork arrangements (motif layers)

  // ── Real product photography (for the live canvas) ──
  scenes: Scene[];             // mockup photo + mapped product "face" rect

  // ── Commerce ──
  axes: OptionAxis[];          // size / format / theme choices, w/ price deltas
  quantityLadder?: QuantityTier[];
  shopifyProductMap?: …;       // ⟵ COMPOSER ADDS. which Shopify variant each config maps to
}

interface TextZone {
  key: string;                 // "primary" | "secondary"
  cx; cy;                      // center, as fraction of W/H
  maxWidth;                    // as fraction of W
  fontSize;                    // in format units
  maxChars?: number;           // ⟵ COMPOSER ADDS. hard cap
  allowedFonts?: string[];     // ⟵ COMPOSER ADDS. per-zone font restriction
}

interface Design {            // = "colorway/arrangement" the customer picks
  key; label; description;
  motifs: Record<formatKey | "default", MotifPlacement[]>;
  // ⟵ COMPOSER ADDS: rawArtworkUrl per format — the flat, print-res, un-staged
  //    source file (PNG/SVG/PDF). The studio uses drawn SVG motifs today;
  //    production needs the real artwork. This is the #1 gap.
}

interface Scene {              // photographed mockup used as the live backdrop
  match?: { axis; value };     // which option selection shows this photo
  image: string;               // web mockup
  face: { x; y; w; h; rotate? }; // blank product surface, as fractions of the photo
}

interface OptionAxis {
  key; label; helpText?;
  options: { value; label; sublabel?; priceDelta? }[];
  defaultValue?;
}
```

## `Personalization` — what the customer produces

```ts
interface Personalization {
  designKey: string;
  mode: "name" | "monogram";
  name: string;
  secondary: string;
  monogramLetters: string;
  monogramStyleKey: string;
  fontKey: string;
  inkKey: string;
  options: Record<string, string>;  // axis key → chosen value
  quantity?: string;
}
```

This is exactly today's `StudioConfig`. It already round-trips through Shopify
cart line-item attributes (`_Studio Config` JSON), so an order already carries
everything production needs.

## Shared token libraries (must be identical on both ends)

- **FONTS** — key, label, fontFamily (screen), **+ composer adds the print
  font file / foundry license ref**.
- **INK_COLORS** — key, label, hex (screen), **+ composer adds Pantone/CMYK
  for press**.
- **MONOGRAM_STYLES** — the 11 styles + letter counts.

These live in `app/lib/variants.ts` today. They should become a **shared
package / shared JSON** both systems import, not two copies.

---

## What the composer ADDS that the studio doesn't have yet

The studio is the *renderer/personalizer*. The composer is the *authoring
tool + production source of truth*. Its net-new responsibilities:

1. **An authoring UI** — drag text zones onto artwork, set fonts/inks/limits,
   define option axes, attach mockup scenes + map the face rect. (The studio
   hand-codes these today; the composer makes them data.)
2. **Raw print-resolution artwork** per design/format — the flat, un-staged
   source file. *This is the gating dependency for true print output and the
   thing to start collecting from the designer now.*
3. **Print export** — `(ProductTemplate, Personalization) → 300-DPI PDF/PNG`
   with bleed + crop marks. Same coordinate space as the preview SVG.
4. **Versioning** — templates change; orders must pin the template version
   they were composed against.
5. **Shopify mapping** — which variant/SKU each option combination resolves to.

---

## Integration options (pick based on repo topology)

- **Best (shared package):** extract the contract types + token libraries into
  a small shared package both repos depend on. One definition, compiler-enforced.
- **Good (schema file):** publish `ProductTemplate` as a versioned JSON Schema;
  composer validates output against it, studio validates input.
- **Minimum (this doc):** both sessions treat this file as the spec and
  reconcile by hand.

---

## Open questions for the composer session

1. Will the composer **emit this `ProductTemplate` shape** (recommended), or a
   different internal model we adapt at a boundary? Strong recommendation: emit
   this shape — the studio is proven against it.
2. Where do templates live at runtime — Shopify metafields, a DB, a CDN JSON?
   The studio needs to *fetch* templates instead of hard-coding them in
   `studio.ts`; that's the first integration milestone.
3. Print pipeline: server-render the SVG (resvg/sharp/Playwright) vs. composite
   onto the raw artwork? Determines what "raw artwork" must contain.
4. Versioning + migration strategy when a template changes after orders exist.

---

*Source of truth for the rendering model: `app/lib/studio.ts` and
`app/components/studio/StudioCanvas.tsx` in the winsome-life-hydrogen repo.
Read those before designing the composer's output format.*
