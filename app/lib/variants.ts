/**
 * Variants, options, and personalization schema.
 *
 * Maps to what the live Shopify catalog offers:
 *   - Notecards:  Card Size × Quantity × Return Address (toggle)
 *   - Notepads:   Size × Number of Sheets
 *   - Gift Tags:  Quantity × Hole Punch & Twine (Y/N = tag or sticker)
 *   - Wine Tags:  Quantity × Tag Theme
 *   - Artwork:    Size of Print
 *   - Calendars:  Style (With Stand / With Verses)
 *
 * Personalization (monogram style, name, ink color, font) is a separate
 * structured schema — everything the print shop needs arrives as fielded
 * data rather than free-text comments.
 */

export type ProductType =
  | "notecard"
  | "notepad"
  | "gift-tag"
  | "wine-tag"
  | "artwork"
  | "calendar";

// ───── Variant axes ──────────────────────────────────────────────────

export interface VariantOption {
  value: string;
  label: string;
  sublabel?: string;
  priceDelta?: number; // flat delta over base
  swatchColor?: string; // for color swatches
  disabled?: boolean;
}

export type VariantAxisKind =
  | "radio" // small option set, shown as button chips
  | "select" // long option set, shown as a dropdown
  | "swatch" // color swatches
  | "toggle"; // yes/no

export interface VariantAxis {
  key: string; // stable identifier
  label: string;
  kind: VariantAxisKind;
  helpText?: string;
  options: VariantOption[];
  defaultValue?: string;
  required?: boolean;
}

// ───── Quantity ladder (non-linear pricing) ──────────────────────────

export interface QuantityTier {
  qty: number;
  label: string;
  price: number;
  returnAddressUpcharge?: number; // flat add-on when RA toggle is on
}

// ───── Personalization schema ────────────────────────────────────────

export interface MonogramStyle {
  key: string;
  label: string;
  description: string;
  letterCount: 1 | 2 | 3;
  /** An SVG/image preview of the monogram layout, optional */
  preview?: string;
}

export interface FontOption {
  key: string;
  label: string;
  fontFamily: string;
  fontWeight?: number;
  previewText?: string;
}

export interface InkColorOption {
  key: string;
  label: string;
  hex: string;
}

export interface PersonalizationField {
  key: string;
  label: string;
  type: "text" | "monogram-letters" | "longtext";
  maxLength: number;
  placeholder: string;
  helpText?: string;
  required?: boolean;
  /** Which monogram styles use this field (by key). If omitted, always shown. */
  onlyForMonogramStyles?: string[];
}

export interface PersonalizationSchema {
  enabled: boolean;
  required: boolean;
  /** Copy shown above the personalization UI */
  intro: string;
  monogramStyles?: MonogramStyle[];
  fields: PersonalizationField[];
  fonts: FontOption[];
  inkColors: InkColorOption[];
  characterPreviewNote?: string;
}

// ───── Shared option libraries ───────────────────────────────────────

// The Winsome Life ink palette (from Sydney's "Color Options" chart). Hexes are
// approximations of the printed inks — the chart notes colors vary by monitor.
export const INK_COLORS: InkColorOption[] = [
  { key: "red", label: "Red", hex: "#EE1C25" },
  { key: "dark-red", label: "Dark Red", hex: "#B23A3A" },
  { key: "maroon", label: "Maroon", hex: "#6B0E13" },
  { key: "pink", label: "Pink", hex: "#E94FA8" },
  { key: "coral", label: "Coral", hex: "#F26B58" },
  { key: "island-pink", label: "Island Pink", hex: "#F0C3CE" },
  { key: "blue", label: "Blue", hex: "#1450A0" },
  { key: "light-blue", label: "Light Blue", hex: "#86B5E5" },
  { key: "island-blue", label: "Island Blue", hex: "#5FAAE9" },
  { key: "baby-blue", label: "Baby Blue", hex: "#A9D4DE" },
  { key: "sea-blue", label: "Sea Blue", hex: "#2C79A5" },
  { key: "navy-blue", label: "Navy Blue", hex: "#0B0B63" },
  { key: "green", label: "Green", hex: "#178A3E" },
  { key: "pine", label: "Pine", hex: "#0E9E6E" },
  { key: "sea-green", label: "Sea Green", hex: "#93CDB2" },
  { key: "teal", label: "Teal", hex: "#1B7B8B" },
  { key: "aqua", label: "Aqua", hex: "#62D8E0" },
  { key: "lime-green", label: "Lime Green", hex: "#42D583" },
  { key: "lavender", label: "Lavender", hex: "#8FA2EF" },
  { key: "purple", label: "Purple", hex: "#8E15A8" },
  { key: "soft-purple", label: "Soft Purple", hex: "#8A82B2" },
  { key: "orange", label: "Orange", hex: "#F5910D" },
  { key: "yellow", label: "Yellow", hex: "#F7E24A" },
  { key: "dandelion", label: "Dandelion", hex: "#E1B52E" },
  { key: "black", label: "Black", hex: "#0A0A0A" },
  { key: "grey", label: "Grey", hex: "#6F7377" },
  { key: "brown", label: "Brown", hex: "#95654B" },
  { key: "sand", label: "Sand", hex: "#E7D1B7" },
  { key: "tan", label: "Tan", hex: "#B59C79" },
  { key: "golden", label: "Golden", hex: "#B49422" },
];

export const FONTS: FontOption[] = [
  // The 10 personalization fonts (Sydney's "Font Options" chart). Option 1 is
  // the default. 5 load now (Google Fonts / our Parisian file); 5 are commercial
  // and fall back to a close script/serif until the font files are added to
  // public/fonts (see @font-face stubs in app.css). previewText kept as a name.
  { key: "cormorant-sc", label: "Cormorant SC", fontFamily: "'Cormorant SC', Georgia, serif", fontWeight: 700, previewText: "Amelia" },
  { key: "cormorant-garamond", label: "Cormorant Garamond", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, previewText: "Amelia" },
  { key: "pinyon-script", label: "Pinyon Script", fontFamily: "'Pinyon Script', 'Great Vibes', cursive", previewText: "Amelia" },
  { key: "buffalo", label: "Buffalo", fontFamily: "'Buffalo', 'Pinyon Script', cursive", previewText: "Amelia" },
  { key: "jimmy-script", label: "Jimmy Script", fontFamily: "'Jimmy Script', 'Sacramento', cursive", previewText: "Amelia" },
  { key: "bebas-neue", label: "Bebas Neue", fontFamily: "'Bebas Neue', 'Oswald', sans-serif", previewText: "Amelia" },
  { key: "chloe", label: "Chloe", fontFamily: "'Chloe', 'Great Vibes', cursive", previewText: "Amelia" },
  { key: "windslow", label: "Windslow", fontFamily: "'Windslow', 'Cormorant Garamond', serif", previewText: "Amelia" },
  { key: "eyesome-script", label: "Eyesome Script", fontFamily: "'Eyesome Script', 'Sacramento', cursive", previewText: "Amelia" },
  { key: "parisian-script", label: "Parisian Script", fontFamily: "'Parisian Script', 'Great Vibes', cursive", previewText: "Amelia" },
];

/** 12 monogram styles to match "Choose from 12 monogram options" copy on live site. */
export const MONOGRAM_STYLES: MonogramStyle[] = [
  {
    key: "single-letter",
    label: "Single Letter",
    description: "One initial, timeless.",
    letterCount: 1,
  },
  {
    key: "two-letter-stacked",
    label: "Two-Letter Stacked",
    description: "Couple monograms or first-and-last.",
    letterCount: 2,
  },
  {
    key: "interlocking",
    label: "Interlocking Script",
    description: "Flowing ligature between two letters.",
    letterCount: 2,
  },
  {
    key: "three-letter-classic",
    label: "Three-Letter Classic",
    description: "Traditional FLM layout (first · last · middle).",
    letterCount: 3,
  },
  {
    key: "three-letter-oval",
    label: "Three-Letter Oval",
    description: "Three letters inside an oval frame.",
    letterCount: 3,
  },
  {
    key: "three-letter-circle",
    label: "Three-Letter Circle",
    description: "Classic FLM inside a circular border.",
    letterCount: 3,
  },
  {
    key: "three-letter-diamond",
    label: "Three-Letter Diamond",
    description: "Three letters inside a diamond frame.",
    letterCount: 3,
  },
  {
    key: "wreath",
    label: "Botanical Wreath",
    description: "Single initial inside a watercolor wreath.",
    letterCount: 1,
  },
  {
    key: "vine",
    label: "Vine Monogram",
    description: "Single letter with trailing vine accents.",
    letterCount: 1,
  },
  {
    key: "scallop",
    label: "Scalloped Border",
    description: "Initial inside a scalloped watercolor border.",
    letterCount: 1,
  },
  {
    key: "modern-block",
    label: "Modern Block",
    description: "Clean, geometric single initial.",
    letterCount: 1,
  },
  {
    key: "floral-crest",
    label: "Floral Crest",
    description: "Initial atop a watercolor floral spray.",
    letterCount: 1,
  },
];

// ───── Default schemas per product type ──────────────────────────────

const STANDARD_PERSONALIZATION: PersonalizationSchema = {
  enabled: true,
  required: true,
  intro:
    "Personalize your stationery with your name, monogram, or a short message. Every piece is custom-printed just for you.",
  monogramStyles: MONOGRAM_STYLES,
  fields: [
    {
      key: "text",
      label: "Text",
      type: "text",
      maxLength: 32,
      placeholder: "Amelia Whitmore",
      helpText: "Your name, a phrase, or any text to print on the design.",
      required: true,
    },
    {
      key: "monogram-letters",
      label: "Monogram Letters",
      type: "monogram-letters",
      maxLength: 3,
      placeholder: "AEW",
      helpText: "Up to 3 letters. Traditional order: First · Last · Middle.",
    },
  ],
  fonts: FONTS,
  inkColors: INK_COLORS,
  characterPreviewNote:
    "Preview uses placeholder letters. Final print uses archival ink on cotton paper.",
};

const NOTEPAD_PERSONALIZATION: PersonalizationSchema = {
  ...STANDARD_PERSONALIZATION,
  intro:
    "Add your name or monogram to the top of every sheet. Choose a font and ink color to match your style.",
  required: true,
};

const WINE_TAG_PERSONALIZATION: PersonalizationSchema = {
  enabled: true,
  required: false,
  intro:
    "Add a custom host name, date, or short message — or choose one of our pre-written sentiments.",
  fields: [
    {
      key: "custom-message",
      label: "Custom Message",
      type: "longtext",
      maxLength: 40,
      placeholder: "For the Thompsons",
      helpText: "Only used when Tag Theme is set to Custom.",
    },
    {
      key: "text",
      label: "Text",
      type: "text",
      maxLength: 30,
      placeholder: "The Winsomes",
      helpText: "Host name — appears on the back of every tag.",
    },
  ],
  fonts: FONTS,
  inkColors: INK_COLORS,
};

const GIFT_TAG_PERSONALIZATION: PersonalizationSchema = {
  enabled: true,
  required: false,
  intro:
    "The default text is \"a gift from [your name]\". Customize below.",
  monogramStyles: MONOGRAM_STYLES.filter((s) => s.letterCount <= 2),
  fields: [
    {
      key: "text",
      label: "Text",
      type: "text",
      maxLength: 30,
      placeholder: "The Winsomes",
      helpText: "Appears under \"a gift from\" on the tag.",
    },
    {
      key: "monogram-letters",
      label: "Monogram",
      type: "monogram-letters",
      maxLength: 2,
      placeholder: "W",
    },
  ],
  fonts: FONTS,
  inkColors: INK_COLORS,
};

const ARTWORK_PERSONALIZATION: PersonalizationSchema = {
  enabled: true,
  required: false,
  intro:
    "Add a dedication to be printed discreetly at the bottom of your print — a name, a date, or a meaningful phrase. Leave blank for a classic print.",
  fields: [
    {
      key: "text",
      label: "Text",
      type: "text",
      maxLength: 60,
      placeholder: "For the Thompsons · June 2026",
      helpText: "Prints in small type at the bottom margin of the artwork.",
    },
  ],
  fonts: FONTS,
  inkColors: INK_COLORS,
  characterPreviewNote:
    "Dedications are printed in ~10pt type; leave extra whitespace around content for framing.",
};

const CALENDAR_PERSONALIZATION: PersonalizationSchema = {
  enabled: true,
  required: false,
  intro:
    "Personalize your calendar with a family name or inscription on the cover. Perfect for gifting.",
  monogramStyles: MONOGRAM_STYLES.filter((s) => s.letterCount <= 3),
  fields: [
    {
      key: "text",
      label: "Text",
      type: "text",
      maxLength: 30,
      placeholder: "The Winsome Family",
      helpText: "Appears under the year on the cover page.",
    },
    {
      key: "monogram-letters",
      label: "Monogram Letters",
      type: "monogram-letters",
      maxLength: 3,
      placeholder: "TWL",
      helpText: "Optional — adds a subtle monogram beside the year.",
    },
  ],
  fonts: FONTS,
  inkColors: INK_COLORS,
};

// ───── Variant axis presets ──────────────────────────────────────────

export const NOTECARD_SIZE_AXIS: VariantAxis = {
  key: "card-size",
  label: "Card Size",
  kind: "radio",
  helpText: "A7 is slightly larger — great for longer notes.",
  defaultValue: "A2",
  required: true,
  options: [
    { value: "A2", label: "A2", sublabel: "4.25\" × 5.5\"", priceDelta: 0 },
    { value: "A7", label: "A7", sublabel: "5\" × 7\"", priceDelta: 4 },
  ],
};

export const RETURN_ADDRESS_AXIS: VariantAxis = {
  key: "return-address",
  label: "Return Address Printing",
  kind: "toggle",
  helpText:
    "We'll print your return address on the back flap of every envelope.",
  defaultValue: "none",
  options: [
    { value: "none", label: "Skip", priceDelta: 0 },
    { value: "add", label: "Add", priceDelta: 6.5 },
  ],
};

/** Live-site labels verbatim: "4.25 x 5.5 Inch", "5 x 7 Inch", "8.5 x 11 Inch". */
export const NOTEPAD_SIZE_AXIS: VariantAxis = {
  key: "notepad-size",
  label: "Size",
  kind: "radio",
  defaultValue: "small",
  required: true,
  options: [
    { value: "small", label: "4.25 x 5.5 Inch", priceDelta: 0 },
    { value: "5x7", label: "5 x 7 Inch", priceDelta: 4.5 },
    { value: "large", label: "8.5 x 11 Inch", priceDelta: 16.5 },
  ],
};

export const NOTEPAD_SHEETS_AXIS: VariantAxis = {
  key: "sheets",
  label: "Number of Sheets",
  kind: "radio",
  defaultValue: "40",
  required: true,
  options: [
    { value: "40", label: "40 Sheets", priceDelta: 0 },
    { value: "80", label: "80 Sheets", priceDelta: 5.5 },
  ],
};

export const GIFT_TAG_FORMAT_AXIS: VariantAxis = {
  key: "format",
  label: "Format",
  kind: "radio",
  helpText: "Hole-punch & twine turns these into hanging tags; leave off for stickers.",
  defaultValue: "tag",
  required: true,
  options: [
    { value: "tag", label: "Tag + twine", sublabel: "Hole-punched, gold string", priceDelta: 2 },
    { value: "sticker", label: "Sticker", sublabel: "Peel-and-stick", priceDelta: 0 },
  ],
};

export const WINE_TAG_THEME_AXIS: VariantAxis = {
  key: "theme",
  label: "Tag Theme",
  kind: "radio",
  helpText: "Pre-printed sentiment on the front — or choose Custom to write your own.",
  defaultValue: "many-thanks",
  required: true,
  options: [
    { value: "many-thanks", label: "Many Thanks" },
    { value: "cheers", label: "Cheers to You" },
    { value: "toast-host", label: "A Toast to the Host" },
    { value: "custom", label: "Custom" },
  ],
};

export const WINE_TAG_LENGTH_AXIS: VariantAxis = {
  key: "length",
  label: "Bottle Style",
  kind: "radio",
  helpText: "Short tags are sized for mini prosecco & champagne splits.",
  defaultValue: "long",
  required: true,
  options: [
    { value: "long", label: "Full Bottle", sublabel: "3\" × 9\"", priceDelta: 0 },
    { value: "short", label: "Mini Bottle", sublabel: "3\" × 5.5\"", priceDelta: -3 },
  ],
};

export const ARTWORK_SIZE_AXIS: VariantAxis = {
  key: "print-size",
  label: "Print Size",
  kind: "radio",
  helpText: "Prints ship unframed.",
  defaultValue: "8x10",
  required: true,
  options: [
    { value: "5x7", label: "5\" × 7\"", priceDelta: 0 },
    { value: "8x10", label: "8\" × 10\"", priceDelta: 15 },
    { value: "11x14", label: "11\" × 14\"", priceDelta: 40 },
    { value: "12x16", label: "12\" × 16\"", priceDelta: 55 },
  ],
};

export const CALENDAR_STYLE_AXIS: VariantAxis = {
  key: "calendar-style",
  label: "Style",
  kind: "radio",
  defaultValue: "with-stand",
  required: true,
  options: [
    { value: "with-stand", label: "With Easel Stand", priceDelta: 0 },
    { value: "with-verses", label: "With Bible Verses", priceDelta: 4 },
  ],
};

// ───── Quantity ladders ──────────────────────────────────────────────

/** Notecard pricing curve — non-linear bulk discount. */
export const NOTECARD_QUANTITY_LADDER: QuantityTier[] = [
  { qty: 5, label: "Set of 5", price: 15.5, returnAddressUpcharge: 6.5 },
  { qty: 10, label: "Set of 10", price: 26, returnAddressUpcharge: 7.5 },
  { qty: 20, label: "Set of 20", price: 44, returnAddressUpcharge: 9 },
  { qty: 30, label: "Set of 30", price: 62, returnAddressUpcharge: 10 },
  { qty: 50, label: "Set of 50", price: 92, returnAddressUpcharge: 12 },
  { qty: 75, label: "Set of 75", price: 128, returnAddressUpcharge: 14 },
  { qty: 100, label: "Set of 100", price: 156, returnAddressUpcharge: 16 },
  { qty: 150, label: "Set of 150", price: 208, returnAddressUpcharge: 20 },
  { qty: 200, label: "Set of 200", price: 252, returnAddressUpcharge: 24 },
  { qty: 250, label: "Set of 250", price: 288, returnAddressUpcharge: 28 },
  { qty: 300, label: "Set of 300", price: 318, returnAddressUpcharge: 30 },
];

export const GIFT_TAG_QUANTITY_LADDER: QuantityTier[] = [
  { qty: 12, label: "Set of 12", price: 20 },
  { qty: 24, label: "Set of 24", price: 36 },
  { qty: 48, label: "Set of 48", price: 64 },
  { qty: 72, label: "Set of 72", price: 88 },
  { qty: 120, label: "Set of 120", price: 132 },
  { qty: 192, label: "Set of 192", price: 184 },
  { qty: 288, label: "Set of 288", price: 240 },
];

export const WINE_TAG_QUANTITY_LADDER: QuantityTier[] = [
  { qty: 10, label: "Set of 10", price: 20 },
  { qty: 20, label: "Set of 20", price: 38 },
  { qty: 30, label: "Set of 30", price: 54 },
  { qty: 50, label: "Set of 50", price: 82 },
  { qty: 75, label: "Set of 75", price: 112 },
  { qty: 100, label: "Set of 100", price: 138 },
  { qty: 150, label: "Set of 150", price: 188 },
  { qty: 200, label: "Set of 200", price: 228 },
  { qty: 300, label: "Set of 300", price: 275 },
];

// ───── Exports keyed by product type ─────────────────────────────────

export const VARIANT_PRESETS: Record<
  ProductType,
  {
    axes: VariantAxis[];
    quantityLadder?: QuantityTier[];
    personalization: PersonalizationSchema | null;
  }
> = {
  notecard: {
    axes: [NOTECARD_SIZE_AXIS, RETURN_ADDRESS_AXIS],
    quantityLadder: NOTECARD_QUANTITY_LADDER,
    personalization: STANDARD_PERSONALIZATION,
  },
  notepad: {
    axes: [NOTEPAD_SIZE_AXIS, NOTEPAD_SHEETS_AXIS],
    personalization: NOTEPAD_PERSONALIZATION,
  },
  "gift-tag": {
    axes: [GIFT_TAG_FORMAT_AXIS],
    quantityLadder: GIFT_TAG_QUANTITY_LADDER,
    personalization: GIFT_TAG_PERSONALIZATION,
  },
  "wine-tag": {
    axes: [WINE_TAG_THEME_AXIS, WINE_TAG_LENGTH_AXIS],
    quantityLadder: WINE_TAG_QUANTITY_LADDER,
    personalization: WINE_TAG_PERSONALIZATION,
  },
  artwork: {
    axes: [ARTWORK_SIZE_AXIS],
    personalization: ARTWORK_PERSONALIZATION,
  },
  calendar: {
    axes: [CALENDAR_STYLE_AXIS],
    personalization: CALENDAR_PERSONALIZATION,
  },
};

/** Is the personalization payload valid? Used to gate Add to Cart. */
export function isPersonalizationValid(
  schema: PersonalizationSchema,
  value: { mode?: string; fields: Record<string, string> } | null,
): boolean {
  if (!schema.enabled) return true;
  if (!value) return !schema.required;
  if (!schema.required) return true;

  const mode = (value as { mode?: string }).mode ?? "name";

  // In "name" mode, the text field must be filled (if required)
  if (mode === "name") {
    const textField = schema.fields.find((f) => f.key === "text");
    if (textField?.required) {
      const v = (value.fields["text"] ?? "").trim();
      if (!v) return false;
    }
  }

  // In "monogram" mode, the monogram-letters field must be filled
  if (mode === "monogram") {
    const monoField = schema.fields.find((f) => f.type === "monogram-letters");
    if (monoField) {
      const v = (value.fields["monogram-letters"] ?? "").trim();
      if (!v) return false;
    }
  }

  return true;
}

/** Shallow label for use on product cards: "Customizable · 2 sizes". */
export function summarizeVariants(type: ProductType): string[] {
  const preset = VARIANT_PRESETS[type];
  const tags: string[] = [];

  if (preset.personalization?.enabled) {
    tags.push("Customizable");
  }

  // Find a "size" axis
  const sizeAxis = preset.axes.find(
    (a) =>
      a.key.endsWith("size") ||
      a.key === "length" ||
      a.key === "print-size",
  );
  if (sizeAxis) {
    tags.push(`${sizeAxis.options.length} sizes`);
  }

  if (preset.quantityLadder) {
    const min = preset.quantityLadder[0].qty;
    const max = preset.quantityLadder[preset.quantityLadder.length - 1].qty;
    tags.push(`Sets of ${min}–${max}`);
  }

  const formatAxis = preset.axes.find((a) => a.key === "format");
  if (formatAxis) {
    tags.push("Tag or sticker");
  }

  const themeAxis = preset.axes.find((a) => a.key === "theme");
  if (themeAxis) {
    tags.push(`${themeAxis.options.length} themes`);
  }

  return tags;
}

// ─── Hydrogen skeleton helpers (variant URL builder) ─────────────────
import {useLocation} from 'react-router';
import {useMemo} from 'react';

export function useVariantUrl(
  handle: string,
  selectedOptions?: Array<{name: string; value: string}>,
) {
  const {pathname} = useLocation();
  return useMemo(() => {
    return getVariantUrl({handle, pathname, searchParams: new URLSearchParams(), selectedOptions});
  }, [handle, selectedOptions, pathname]);
}

export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
}: {
  handle: string;
  pathname: string;
  searchParams: URLSearchParams;
  selectedOptions?: Array<{name: string; value: string}>;
}) {
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match?.length;
  const path = isLocalePathname
    ? `${match![0]}products/${handle}`
    : `/products/${handle}`;
  selectedOptions?.forEach((option) => {
    searchParams.set(option.name, option.value);
  });
  const searchString = searchParams.toString();
  return path + (searchString ? '?' + searchString : '');
}
