/*
 * Design Studio template engine — the data model behind the Minted-style
 * WYSIWYG customizer.
 *
 * Three concepts:
 *   • StudioFormat  — a physical product format (A2 notecard, notepad sheet,
 *     wine tag, gift tag) with real-world dimensions and named text zones.
 *     1 SVG unit = 0.01 inch, so an A2 card (4.25" × 5.5") is 425 × 550.
 *     This means the same template scales losslessly from the on-screen
 *     preview to a 300-DPI print export later.
 *   • StudioDesign  — an illustration arrangement (motifs + framing) that
 *     can be applied to a format. Equivalent to a Minted "design".
 *   • StudioConfig  — the customer's live choices (design, text, font, ink,
 *     monogram, format options, quantity).
 */
import {
  FONTS,
  INK_COLORS,
  MONOGRAM_STYLES,
  NOTECARD_SIZE_AXIS,
  NOTEPAD_SIZE_AXIS,
  NOTEPAD_SHEETS_AXIS,
  WINE_TAG_THEME_AXIS,
  WINE_TAG_LENGTH_AXIS,
  GIFT_TAG_FORMAT_AXIS,
  NOTECARD_QUANTITY_LADDER,
  WINE_TAG_QUANTITY_LADDER,
  GIFT_TAG_QUANTITY_LADDER,
  type VariantAxis,
  type QuantityTier,
  type FontOption,
  type InkColorOption,
  type MonogramStyle,
} from "~/lib/variants";
import {
  getIllustration,
  type IllustrationStyleKey,
} from "~/lib/illustrations";

// ───── Formats ───────────────────────────────────────────────────────

export type StudioFormatKey =
  | "notecard"
  | "notepad"
  | "wine-tag"
  | "gift-tag"
  | "place-card";

export interface TextZone {
  key: "primary" | "secondary";
  /** Center x/y as fraction of format width/height */
  cx: number;
  cy: number;
  /** Max text width as fraction of format width */
  maxWidth: number;
  /** Base font size in format units (1 unit = 0.01") */
  fontSize: number;
}

/** A photographed product mockup used as the canvas backdrop. The format's
 *  printed layer (motifs + text) is mapped onto `face` — the blank product
 *  surface within the photo, expressed as fractions of the image dims. */
export interface StudioScene {
  /** Selects this scene when config.options[axis] === value. Scenes without
   *  a match are the default. */
  match?: { axis: string; value: string };
  image: string;
  face: { x: number; y: number; w: number; h: number; rotate?: number };
}

export interface StudioFormat {
  key: StudioFormatKey;
  label: string;
  /** Physical size note shown in the editor */
  sizeNote: string;
  /** SVG viewBox dims — 1 unit = 0.01 inch */
  width: number;
  height: number;
  /** Hang-tag hole — drawn in flat mode only (scenes photograph the real
   *  die-cut). Kept for design thumbnails. */
  hole?: { cx: number; cy: number; r: number };
  zones: TextZone[];
  /** Where the customer's chosen illustration sits on the paper (fractions). */
  artSlot: { cx: number; cy: number; maxW: number };
  /** Variant axes shown under "Options" in the editor */
  axes: VariantAxis[];
  quantityLadder?: QuantityTier[];
  /** Ruled writing lines (notepads) */
  ruledLines?: { startY: number; endY: number; gap: number; inset: number };
  /** A brand-provided vector template of the actual print surface (the paper
   *  shape itself). When set, the live preview renders THIS as the paper —
   *  what you see is literally what prints — instead of a synthetic sheet. */
  paperSvg?: string;
  /** Real product mockup photography (provided by the brand). */
  scenes?: StudioScene[];
}

export const STUDIO_FORMATS: Record<StudioFormatKey, StudioFormat> = {
  notecard: {
    key: "notecard",
    label: "Notecard",
    // Real Winsome flat cards are landscape.
    sizeNote: 'A2 flat · 5.5" × 4.25" · premium cotton',
    width: 550,
    height: 425,
    // A flat correspondence card is a WRITING surface: the motif + name sit as
    // a compact header across the top ~30%, and the lower ~60% stays blank so
    // there is real room to write a note.
    zones: [
      { key: "primary", cx: 0.5, cy: 0.29, maxWidth: 0.72, fontSize: 36 },
      { key: "secondary", cx: 0.5, cy: 0.4, maxWidth: 0.56, fontSize: 13 },
    ],
    artSlot: { cx: 0.5, cy: 0.145, maxW: 0.17 },
    axes: [NOTECARD_SIZE_AXIS],
    quantityLadder: NOTECARD_QUANTITY_LADDER,
    scenes: [
      {
        image: "/studio/notecard-a2.jpg",
        face: { x: 0.154, y: 0.229, w: 0.701, h: 0.542 },
      },
      {
        match: { axis: "card-size", value: "A7" },
        image: "/studio/notecard-a7.jpg",
        face: { x: 0.14, y: 0.225, w: 0.72, h: 0.552 },
      },
    ],
  },
  notepad: {
    key: "notepad",
    label: "Notepad",
    sizeNote: '5" × 7" · 40 or 80 sheets',
    // 5×7 to match the brand-provided print template (paperSvg below).
    width: 500,
    height: 700,
    // Motif + name print as a masthead across the top; the rest of the pad is
    // the blank writing surface exactly as the template prints.
    zones: [
      { key: "primary", cx: 0.5, cy: 0.17, maxWidth: 0.78, fontSize: 30 },
      { key: "secondary", cx: 0.5, cy: 0.218, maxWidth: 0.6, fontSize: 12 },
    ],
    artSlot: { cx: 0.5, cy: 0.088, maxW: 0.16 },
    axes: [NOTEPAD_SIZE_AXIS, NOTEPAD_SHEETS_AXIS],
    // The actual print surface, provided by the brand (blank white 5×7 pad).
    paperSvg: "/studio/notepad-5x7-template.svg",
    scenes: [
      {
        image: "/studio/notepad-4x5.jpg",
        face: { x: 0.258, y: 0.179, w: 0.48, h: 0.64 },
      },
      {
        match: { axis: "notepad-size", value: "5x7" },
        image: "/studio/notepad-5x7.jpg",
        face: { x: 0.26, y: 0.17, w: 0.48, h: 0.66 },
      },
      {
        match: { axis: "notepad-size", value: "large" },
        image: "/studio/notepad-8x11.jpg",
        face: { x: 0.259, y: 0.137, w: 0.478, h: 0.633 },
      },
    ],
  },
  "wine-tag": {
    key: "wine-tag",
    label: "Wine Tag",
    // Real product: fold-over bottle-neck tag (die-cut circle slips over
    // the neck). Personalization prints below the fold.
    sizeNote: '2.5" × 6.5" fold-over bottle tag',
    width: 250,
    height: 650,
    hole: { cx: 125, cy: 100, r: 72 },
    zones: [
      { key: "primary", cx: 0.5, cy: 0.58, maxWidth: 0.82, fontSize: 36 },
      { key: "secondary", cx: 0.5, cy: 0.77, maxWidth: 0.78, fontSize: 15 },
    ],
    artSlot: { cx: 0.5, cy: 0.4, maxW: 0.52 },
    axes: [WINE_TAG_THEME_AXIS, WINE_TAG_LENGTH_AXIS],
    quantityLadder: WINE_TAG_QUANTITY_LADDER,
    scenes: [
      {
        image: "/studio/wine-tag.jpg",
        face: { x: 0.358, y: 0.142, w: 0.287, h: 0.72 },
      },
    ],
  },
  "gift-tag": {
    key: "gift-tag",
    label: "Gift Tag",
    sizeNote: '2" × 3.5" · tag + string or enclosure card',
    width: 200,
    height: 360,
    hole: { cx: 100, cy: 30, r: 13 },
    zones: [
      { key: "primary", cx: 0.5, cy: 0.56, maxWidth: 0.8, fontSize: 26 },
      { key: "secondary", cx: 0.5, cy: 0.73, maxWidth: 0.74, fontSize: 11 },
    ],
    artSlot: { cx: 0.5, cy: 0.33, maxW: 0.5 },
    axes: [GIFT_TAG_FORMAT_AXIS],
    quantityLadder: GIFT_TAG_QUANTITY_LADDER,
    scenes: [
      {
        image: "/studio/gift-tag-angled.jpg",
        face: { x: 0.325, y: 0.215, w: 0.365, h: 0.66 },
      },
      {
        match: { axis: "format", value: "sticker" },
        image: "/studio/gift-tag-square.jpg",
        face: { x: 0.26, y: 0.245, w: 0.49, h: 0.49 },
      },
    ],
  },
  "place-card": {
    key: "place-card",
    label: "Place Card",
    sizeNote: '3.5" × 2" folded tent card',
    width: 525,
    height: 300,
    zones: [
      { key: "primary", cx: 0.5, cy: 0.52, maxWidth: 0.8, fontSize: 50 },
      { key: "secondary", cx: 0.5, cy: 0.74, maxWidth: 0.7, fontSize: 17 },
    ],
    artSlot: { cx: 0.5, cy: 0.25, maxW: 0.16 },
    axes: [],
    scenes: [
      {
        image: "/studio/place-card.jpg",
        face: { x: 0.15, y: 0.19, w: 0.69, h: 0.43, rotate: -3.5 },
      },
    ],
  },
};

/** Pick the scene matching the customer's current option selections. */
export function pickStudioScene(
  format: StudioFormat,
  config: StudioConfig,
): StudioScene | null {
  if (!format.scenes?.length) return null;
  const matched = format.scenes.find(
    (s) => s.match && config.options[s.match.axis] === s.match.value,
  );
  return matched ?? format.scenes.find((s) => !s.match) ?? format.scenes[0];
}

// ───── Borders ───────────────────────────────────────────────────────

/** Border styles a customer can frame the whole piece with. Rendered as an
 *  inset frame around the paper edge in StudioCanvas (and later in print). */
export interface BorderStyle {
  key: string;
  label: string;
}
export const BORDER_STYLES: BorderStyle[] = [
  { key: "none", label: "None" },
  { key: "thin", label: "Thin Line" },
  { key: "classic", label: "Classic" },
  { key: "double", label: "Double" },
  { key: "thick-thin", label: "Thick & Thin" },
  { key: "dashed", label: "Dashed" },
  { key: "dotted", label: "Dotted" },
  { key: "corners", label: "Corner Frame" },
  { key: "deco", label: "Deco Inset" },
  { key: "stitch", label: "Stitched" },
  { key: "rounded", label: "Rounded" },
  // Full-bleed styles — the color runs all the way OFF the edge of the paper
  // (like the Après Ski pad). In print export these auto-extend into the bleed.
  { key: "edge-band", label: "Edge Band" },
  { key: "edge-duo", label: "Edge + Line" },
];

/** 0.125" printer's bleed, in format units (1 unit = 0.01"). */
export const PRINT_BLEED = 12.5;

export interface BorderColor {
  key: string;
  label: string;
  hex: string;
}
export const BORDER_COLORS: BorderColor[] = [
  { key: "charcoal", label: "Charcoal", hex: "#2D2D2D" },
  { key: "gold", label: "Gold", hex: "#C9A96E" },
  { key: "navy", label: "Navy", hex: "#1F3A5F" },
  { key: "french-blue", label: "French Blue", hex: "#5F7A99" },
  { key: "powder", label: "Powder Blue", hex: "#A8C3DC" },
  { key: "sage", label: "Sage", hex: "#8AAA88" },
  { key: "forest", label: "Forest", hex: "#3E5C46" },
  { key: "eucalyptus", label: "Eucalyptus", hex: "#9CB89A" },
  { key: "blush", label: "Blush", hex: "#E8B4B8" },
  { key: "rose", label: "Rose", hex: "#C77E92" },
  { key: "wine", label: "Wine", hex: "#7C3244" },
  { key: "terracotta", label: "Terracotta", hex: "#C9765E" },
  { key: "coral", label: "Coral", hex: "#E2907C" },
  { key: "butter", label: "Butter", hex: "#E9D9A8" },
  { key: "ochre", label: "Ochre", hex: "#B0894A" },
  { key: "lavender", label: "Lavender", hex: "#A99BC4" },
  { key: "plum", label: "Plum", hex: "#5E4463" },
  { key: "taupe", label: "Taupe", hex: "#A79B8B" },
  { key: "dove", label: "Dove Grey", hex: "#B4B2A9" },
  { key: "ivory", label: "Ivory", hex: "#EFE9DC" },
];
export function getBorderColor(key: string): BorderColor {
  return BORDER_COLORS.find((c) => c.key === key) ?? BORDER_COLORS[0];
}

// ───── Config (live customer state) ──────────────────────────────────

export interface StudioConfig {
  /** Chosen illustration id ("sports/pickleball"), null for text-only, or the
   *  literal "custom" when the customer uploaded their own art. */
  illustrationId: string | null;
  /** Customer-uploaded illustration (data URL) when illustrationId === "custom". */
  customIllustration?: string;
  /** Frame around the whole piece. styleKey "none" = no border. */
  border?: { styleKey: string; colorKey: string };
  illustrationStyle: IllustrationStyleKey;
  mode: "name" | "monogram";
  name: string;
  secondary: string;
  monogramLetters: string;
  monogramStyleKey: string;
  fontKey: string;
  inkKey: string;
  /** axis key → selected option value */
  options: Record<string, string>;
  /** quantity ladder selection (qty number as string) */
  quantity?: string;
}

export function defaultStudioConfig(format: StudioFormat): StudioConfig {
  const options: Record<string, string> = {};
  for (const axis of format.axes) {
    if (axis.defaultValue) options[axis.key] = axis.defaultValue;
  }
  return {
    // Land on a placed illustration so the paper is never empty on arrival.
    illustrationId: "floral/hydrangea",
    illustrationStyle: "watercolor",
    // Text defaults to full name (initials optional).
    mode: "name",
    border: { styleKey: "none", colorKey: "charcoal" },
    name: "The Hamilton Family",
    secondary: "",
    monogramLetters: "ABC",
    monogramStyleKey: "three-letter-classic",
    fontKey: "parisian-script",
    inkKey: "charcoal",
    options,
    quantity: format.quantityLadder
      ? String(format.quantityLadder[0].qty)
      : undefined,
  };
}

// ───── Pricing ───────────────────────────────────────────────────────

export function computeStudioPrice(
  format: StudioFormat,
  config: StudioConfig,
  productBasePrice: number,
): number {
  let price: number;
  if (format.quantityLadder && config.quantity) {
    const tier =
      format.quantityLadder.find((t) => String(t.qty) === config.quantity) ??
      format.quantityLadder[0];
    price = tier.price;
  } else {
    price = productBasePrice;
  }
  for (const axis of format.axes) {
    const selected = config.options[axis.key];
    const opt = axis.options.find((o) => o.value === selected);
    if (opt?.priceDelta) price += opt.priceDelta;
  }
  return price;
}

// ───── Cart serialization ────────────────────────────────────────────

/** Serialize the studio config into Shopify cart line attributes.
 *  "_"-prefixed keys are hidden from the buyer in standard cart UIs but
 *  flow through checkout onto the order for the production team. */
export function studioLineAttributes(
  format: StudioFormat,
  config: StudioConfig,
): Array<{ key: string; value: string }> {
  const illustration = getIllustration(config.illustrationId);
  const attrs: Array<{ key: string; value: string }> = [
    { key: "_Studio Format", value: format.label },
    { key: "_Illustration", value: illustration?.subject ?? "None" },
    { key: "_Illustration Style", value: config.illustrationStyle },
    { key: "_Personalization Mode", value: config.mode },
    { key: "_Font", value: config.fontKey },
    { key: "_Ink Color", value: config.inkKey },
  ];
  if (config.border && config.border.styleKey !== "none") {
    const bs = BORDER_STYLES.find((s) => s.key === config.border!.styleKey);
    attrs.push({ key: "_Border", value: bs?.label ?? config.border.styleKey });
    attrs.push({ key: "_Border Color", value: getBorderColor(config.border.colorKey).label });
  }
  if (config.illustrationId === "custom") {
    attrs.push({ key: "_Custom Artwork", value: "Customer upload — see design file" });
  }
  if (config.mode === "name") {
    if (config.name) attrs.push({ key: "Name", value: config.name });
  } else {
    attrs.push({ key: "Monogram", value: config.monogramLetters });
    attrs.push({ key: "_Monogram Style", value: config.monogramStyleKey });
  }
  if (config.secondary)
    attrs.push({ key: "Second Line", value: config.secondary });
  for (const axis of format.axes) {
    const v = config.options[axis.key];
    if (v) {
      const opt = axis.options.find((o) => o.value === v);
      attrs.push({ key: `_${axis.label}`, value: opt?.label ?? v });
    }
  }
  if (config.quantity)
    attrs.push({ key: "_Set Size", value: `Set of ${config.quantity}` });
  // Compact machine-readable config — lets the cart render a live SVG
  // thumbnail of the exact design, and later drives the print export.
  // The uploaded image data URL is far too large for a cart attribute, so it
  // is stripped here; production pulls the customer file from the design flow.
  const { customIllustration: _omit, ...compact } = config;
  attrs.push({
    key: "_Studio Config",
    value: JSON.stringify({ f: format.key, ...compact }),
  });
  // Zero-touch production: a ready link that renders this exact design with
  // 0.125" bleed for the print vendor (open → print → PDF at 100%).
  attrs.push({
    key: "_Print File",
    value: `/print/${format.key}?c=${encodeURIComponent(JSON.stringify(compact))}`,
  });
  return attrs;
}

/** Parse the `_Studio Config` cart attribute back into renderable state.
 *  Returns null when the line wasn't created by the Design Studio. */
export function parseStudioConfigAttribute(
  attributes: Array<{ key: string; value?: string | null }> | undefined | null,
): { format: StudioFormat; config: StudioConfig } | null {
  const raw = attributes?.find((a) => a.key === "_Studio Config")?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { f: StudioFormatKey } & StudioConfig;
    const format = STUDIO_FORMATS[parsed.f];
    if (!format) return null;
    const { f: _f, ...config } = parsed;
    return { format, config: config as StudioConfig };
  } catch {
    return null;
  }
}

// ───── Shared re-exports for the editor UI ───────────────────────────

export { FONTS, INK_COLORS, MONOGRAM_STYLES };
export type { FontOption, InkColorOption, MonogramStyle };

export function getFont(key: string): FontOption {
  return FONTS.find((f) => f.key === key) ?? FONTS[0];
}
export function getInk(key: string): InkColorOption {
  return INK_COLORS.find((c) => c.key === key) ?? INK_COLORS[0];
}

/** Map a catalog product type to its studio format, if customizable. */
export function studioFormatForProductType(
  type: string,
): StudioFormatKey | null {
  if (type === "notecard") return "notecard";
  if (type === "notepad") return "notepad";
  if (type === "wine-tag") return "wine-tag";
  if (type === "gift-tag") return "gift-tag";
  return null;
}

/** Default collection per format — used to resolve a real product/variant
 *  when the studio is opened without product context. */
export const STUDIO_DEFAULT_COLLECTION: Record<StudioFormatKey, string> = {
  notecard: "notecards",
  notepad: "notepads",
  "wine-tag": "wine-tags-1",
  "gift-tag": "gift-tags-stickers",
  "place-card": "place-cards",
};
