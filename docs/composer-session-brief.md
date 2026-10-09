# Brief to paste into the back-end Product Composer session

---

We're building two halves of one product engine and I need you to design the
back-end **product composer** so it shares an ecosystem with our existing
customer-facing front end. Read this fully before proposing a data model.

## What already exists (the front end)

We have a live customer-facing **Design Studio** — a Minted-style WYSIWYG
personalizer — running on Shopify Hydrogen (React Router 7). A customer opens a
product, sees the **real product mockup photo**, and types their name/monogram;
it renders live onto the product, then serializes into the Shopify cart as
line-item properties. It already supports notecards, notepads, wine tags, gift
tags, and place cards, with selectable designs, 6 fonts, 10 ink colors, and 11
monogram styles.

That studio is the **renderer + personalizer**. What you're building — the
composer — is the **authoring tool + production source of truth**. They are the
same engine from opposite ends:

> **The composer AUTHORS a `ProductTemplate`. The studio RENDERS + personalizes it.**

The goal: design the composer so **its output format equals the studio's input
format**. Then every product we compose internally is automatically
customer-customizable, with no translation layer between the two systems. Do not
invent a parallel model — extend the one below.

## The shared rendering invariant (non-negotiable)

Everything printable is authored in **format space where 1 unit = 0.01 inch**
(an A2 card = `550 × 425`). The same coordinates drive both the on-screen
preview AND a 300-DPI print rasterization — so nothing is re-measured between
screen and press. Author all zone/layer coordinates in this space (or 0..1
fractions of it).

## The two objects that cross the wire

```ts
// What YOU (the composer) produce — one per sellable design, static:
interface ProductTemplate {
  key: string;            // "notecard" | "wine-tag" | "place-card" | …
  label: string;
  width: number;          // format units (1 = 0.01")
  height: number;
  printDpi: number;       // e.g. 300
  bleed?: number;         // print bleed (format units)
  safeArea?: number;      // text/art keep-out margin

  zones: TextZone[];      // named text slots
  hole?: { cx; cy; r };   // die-cut (tags)

  designs: Design[];      // selectable artwork arrangements
  scenes: Scene[];        // real mockup photo + mapped product "face" rect
  axes: OptionAxis[];     // size/format/theme choices w/ price deltas
  quantityLadder?: { qty; label; price }[];
  shopifyProductMap?: unknown; // which variant/SKU each config resolves to
}

interface TextZone {
  key: string;            // "primary" | "secondary"
  cx; cy;                 // center, fraction of W/H
  maxWidth;               // fraction of W
  fontSize;               // format units
  maxChars?: number;
  allowedFonts?: string[];
}

interface Design {        // a colorway/arrangement the customer picks
  key; label; description;
  motifs: Record<string, MotifPlacement[]>; // artwork layers, keyed by format
  rawArtworkUrl?: string; // ⟵ flat, print-res, un-staged source file PER FORMAT
}

interface Scene {         // photographed mockup = the live canvas backdrop
  match?: { axis; value };       // which option selection shows this photo
  image: string;
  face: { x; y; w; h; rotate? }; // blank product surface, fractions of the photo
}

interface OptionAxis {
  key; label; helpText?;
  options: { value; label; sublabel?; priceDelta? }[];
  defaultValue?;
}

// What the CUSTOMER produces — one per order line, dynamic:
interface Personalization {
  designKey: string;
  mode: "name" | "monogram";
  name: string; secondary: string;
  monogramLetters: string; monogramStyleKey: string;
  fontKey: string; inkKey: string;
  options: Record<string, string>; // axis key → chosen value
  quantity?: string;
}
```

Shared token libraries (FONTS, INK_COLORS, MONOGRAM_STYLES) must be **identical
on both ends** — same keys. The front end has them; you add the print-side data
(font license/file, Pantone/CMYK per ink).

## Your net-new scope (what the studio does NOT have)

1. **Authoring UI** — drag text zones onto artwork, set fonts/inks/limits,
   define option axes, attach mockup scenes + map each scene's face rect.
   (The studio hand-codes these; you turn them into data.)
2. **Raw print-resolution artwork** per design/format — the flat, un-staged
   source file. This is the gating dependency for real print output.
3. **Print export** — `(ProductTemplate, Personalization) → 300-DPI PDF/PNG`
   with bleed + crop marks, in the same coordinate space as the preview.
4. **Template versioning** — orders pin the template version they were composed
   against.
5. **Runtime storage** — where templates live so the studio can FETCH them
   (Shopify metafields / DB / CDN JSON) instead of hard-coding.

## What I want back from you (first response)

1. Confirm you'll **emit this `ProductTemplate` shape**, or make the case for an
   adapter boundary and show the exact mapping.
2. Propose **where templates are stored** at runtime and how the front end
   fetches them (this is our first integration milestone).
3. Propose the **composer's own authoring data model** + UI shape.
4. Propose the **print-export approach** (server-render the SVG vs. composite
   onto raw artwork) and therefore what "raw artwork" files must contain.
5. Flag anything in the contract that won't survive contact with real
   production.

Full contract + rationale lives at `docs/product-composition-contract.md` in
the `winsome-life-hydrogen` repo; the authoritative rendering model is
`app/lib/studio.ts` + `app/components/studio/StudioCanvas.tsx`. If you can
access that repo, read those before designing. If you can't, this brief is
self-contained — build to it.
