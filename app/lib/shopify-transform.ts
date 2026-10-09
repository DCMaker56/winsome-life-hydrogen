/**
 * Map Shopify products → our app's `Product` shape.
 *
 * Personalization stays in client-side schema (VARIANT_PRESETS) keyed by
 * product type — Shopify's product data doesn't model monogram styles,
 * fonts, ink colors, etc. (those live in their Minimate app).
 */

// Minimal Shopify shape (matches both the public /products.json and the
// Storefront GraphQL `Product` after light normalization).
export interface ShopifyProduct {
  id: number | string;
  title: string;
  handle: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string | string[];
  variants?: Array<{
    price: string | number;
    compare_at_price?: string | number | null;
    available?: boolean;
  }>;
  images?: Array<{src: string}>;
}

export type ProductType =
  | "notecard"
  | "notepad"
  | "gift-tag"
  | "wine-tag"
  | "artwork"
  | "calendar";

export type CategorySlug =
  | "monogram"
  | "floral"
  | "seasonal"
  | "notecards"
  | "notepads"
  | "gift-tags"
  | "wine-tags"
  | "artwork"
  | "calendars"
  | "weddings"
  | "bestsellers";

export interface AppProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categories: CategorySlug[];
  badge?: "Bestseller" | "New" | "Sale" | "Limited";
  details: string[];
  inStock: boolean;
  shopifyUrl: string;
  type: ProductType;
}

const SHOPIFY_BASE = "https://www.thewinsomelife.com";

/** Pull plain text from HTML body. */
function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** First sentence or first 140 chars — used as the card description. */
function shortDescription(longText: string): string {
  if (!longText) return "";
  const m = longText.match(/^[^.!?]{20,200}[.!?]/);
  if (m) return m[0].trim();
  return longText.slice(0, 140).trim() + (longText.length > 140 ? "…" : "");
}

/** Pull bullet-style detail list from the body HTML's first <ul> or <p> chunks. */
function extractDetails(html: string | undefined | null): string[] {
  if (!html) return [];
  // Pull <li> items first
  const lis = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((m) => stripHtml(m[1]))
    .filter((s) => s.length > 4 && s.length < 200);
  if (lis.length >= 3) return lis.slice(0, 8);

  // Fall back to short paragraphs split into bullet-like lines
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripHtml(m[1]))
    .filter((s) => s.length > 0);
  const lines: string[] = [];
  for (const p of paragraphs) {
    for (const line of p.split(/[\n\r·•|]+/).map((l) => l.trim())) {
      if (line.length > 4 && line.length < 160 && !/^http/i.test(line)) {
        lines.push(line);
      }
      if (lines.length >= 8) return lines;
    }
  }
  return lines;
}

/** Normalize Shopify's `tags` field — Storefront returns an array, Admin returns CSV. */
function tagsAsArray(tags: ShopifyProduct["tags"]): string[] {
  if (Array.isArray(tags)) return tags.map((t) => String(t).toLowerCase());
  if (typeof tags === "string") return tags.toLowerCase().split(/,\s*/).map((t) => t.trim());
  return [];
}

/**
 * Clean SEO-keyword-stuffed product titles for display.
 * Winsome's Shopify titles use `|` to chain SEO variants like
 * "Personalized Dog Notepad | Choose from 50 Dog Breeds | Custom Canine Notepad".
 * For cards/PDPs we just want the first human-readable segment.
 */
export function cleanProductTitle(raw: string): string {
  if (!raw) return raw;
  const first = raw.split('|')[0].trim();
  // If the first segment is too short (likely just "Personalized") fall back
  // to first TWO segments joined by an em-dash.
  if (first.length < 18 && raw.includes('|')) {
    const second = raw.split('|')[1]?.trim();
    if (second) return `${first} — ${second}`;
  }
  return first;
}

/** Map Shopify product_type / tags to our internal type. */
export function inferProductType(p: ShopifyProduct): ProductType {
  const tagText = tagsAsArray(p.tags).join(" ");
  const text = (
    (p.product_type ?? "") +
    " " +
    tagText +
    " " +
    (p.title ?? "")
  ).toLowerCase();

  if (/wine\s*tag|prosecco|champagne\s*tag/.test(text)) return "wine-tag";
  if (/gift\s*tag|sticker|hang\s*tag|enclosure/.test(text)) return "gift-tag";
  if (/notepad|note\s*pad|memo\s*pad/.test(text)) return "notepad";
  if (/calendar/.test(text)) return "calendar";
  if (/art(work)?|print|wall\s*art|watercolor\s*print/.test(text)) return "artwork";
  // Default — anything with "notecard", "stationery", "card", "thank you", "save the date"
  return "notecard";
}

/** Map Shopify tags + product_type to category slugs. */
function inferCategories(p: ShopifyProduct, type: ProductType): CategorySlug[] {
  const tags = tagsAsArray(p.tags);
  const out = new Set<CategorySlug>();

  // Base category by type
  if (type === "notecard") out.add("notecards");
  if (type === "notepad") out.add("notepads");
  if (type === "gift-tag") out.add("gift-tags");
  if (type === "wine-tag") out.add("wine-tags");
  if (type === "artwork") out.add("artwork");
  if (type === "calendar") out.add("calendars");

  // Secondary categories from tags
  for (const t of tags) {
    if (/monogram/.test(t)) out.add("monogram");
    if (/floral|flower|peony|hydrangea|rose|magnolia|botanical/.test(t)) out.add("floral");
    if (/wedding|bride|bridal/.test(t)) out.add("weddings");
    if (/best\s*seller|bestseller/.test(t)) out.add("bestsellers");
    if (/christmas|holiday|easter|spring|summer|autumn|fall|winter/.test(t))
      out.add("seasonal");
  }
  return Array.from(out);
}

/** Map tags to our badge styling (Bestseller / New / Sale / Limited). */
function inferBadge(p: ShopifyProduct): AppProduct["badge"] | undefined {
  const tags = tagsAsArray(p.tags).join(" ");
  if (/best\s*seller|bestseller/.test(tags)) return "Bestseller";
  if (/\bnew\b/.test(tags)) return "New";
  if (/\bsale\b|\bclearance\b/.test(tags)) return "Sale";
  if (/limited(\s*edition)?/.test(tags)) return "Limited";
  return undefined;
}

/** Lowest-priced variant — used as the "from" price for the catalog. */
function lowestPrice(p: ShopifyProduct): { price: number; compareAt?: number } {
  if (!p.variants?.length) return { price: 0 };
  let lowest = Number.POSITIVE_INFINITY;
  let compare: number | undefined;
  for (const v of p.variants) {
    const price = parseFloat(String(v.price));
    if (Number.isFinite(price) && price < lowest) {
      lowest = price;
      if (v.compare_at_price != null) {
        const cap = parseFloat(String(v.compare_at_price));
        compare = cap > 0 && cap > price ? cap : undefined;
      } else {
        compare = undefined;
      }
    }
  }
  return {
    price: Number.isFinite(lowest) ? lowest : 0,
    compareAt: compare,
  };
}

/** Main mapper. */
export function shopifyToAppProduct(p: ShopifyProduct): AppProduct {
  const type = inferProductType(p);
  const longRaw = stripHtml(p.body_html);
  const { price, compareAt } = lowestPrice(p);

  return {
    id: String(p.id),
    slug: p.handle,
    title: cleanProductTitle(p.title),
    description: shortDescription(longRaw),
    longDescription: longRaw,
    price,
    compareAtPrice: compareAt,
    images: (p.images ?? []).map((img) => img.src),
    categories: inferCategories(p, type),
    badge: inferBadge(p),
    details: extractDetails(p.body_html),
    inStock: p.variants?.some((v) => v.available !== false) ?? true,
    shopifyUrl: `${SHOPIFY_BASE}/products/${p.handle}`,
    type,
  };
}

/** Built-in collection metadata (Shopify exposes these as collections; we map slugs). */
export interface AppCollection {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  categories: CategorySlug[];
}

export const COLLECTIONS: AppCollection[] = [
  {
    slug: "all",
    title: "All Collections",
    description: "Browse our full catalog of personalized stationery",
    longDescription:
      "Every notecard, notepad, gift tag, and watercolor design — all in one place.",
    image: "",
    categories: [],
  },
  {
    slug: "bestsellers",
    title: "Bestsellers",
    description: "Our most-loved designs, chosen by you",
    longDescription:
      "These are the designs our customers reach for again and again — from classic monograms to our signature floral watercolors.",
    image: "",
    categories: ["bestsellers"],
  },
  {
    slug: "notecards",
    title: "Notecards",
    description: "Premium personalized notecards for every occasion",
    longDescription:
      "Printed on heavyweight cotton paper with a soft velvety finish. Flat or folded. Custom-printed to order.",
    image: "",
    categories: ["notecards"],
  },
  {
    slug: "notepads",
    title: "Notepads",
    description: "Beautiful notepads for daily inspiration",
    longDescription:
      "Personalized notepads featuring elegant designs and your name or monogram. Perfect for to-do lists and quick notes.",
    image: "",
    categories: ["notepads"],
  },
  {
    slug: "gift-tags",
    title: "Gift Tags",
    description: "The finishing touch for every gift",
    longDescription:
      "Watercolor tags and stickers add a handcrafted touch to any present.",
    image: "",
    categories: ["gift-tags"],
  },
  {
    slug: "wine-tags",
    title: "Wine Tags",
    description: "Hostess-worthy wine bottle tags, personalized",
    longDescription:
      "Printed on 120lb card stock with hand-tied twine. Four pre-printed sentiments or write your own.",
    image: "",
    categories: ["wine-tags"],
  },
  {
    slug: "artwork",
    title: "Artwork & Prints",
    description: "Watercolor-style prints for your walls",
    longDescription:
      "Original artwork in our signature watercolor style, reproduced on archival paper at four sizes.",
    image: "",
    categories: ["artwork"],
  },
  {
    slug: "calendars",
    title: "Calendars",
    description: "Desk calendars for a beautifully planned year",
    longDescription:
      "Original floral art paired with clean typography and a sturdy easel stand.",
    image: "",
    categories: ["calendars"],
  },
  {
    slug: "monogram",
    title: "Monogram Collection",
    description: "Timeless personalized elegance",
    longDescription:
      "Classic scripts, modern initials, botanical wreaths — each one personalized just for you.",
    image: "",
    categories: ["monogram"],
  },
  {
    slug: "floral",
    title: "Floral Collection",
    description: "Watercolor florals on premium cotton paper",
    longDescription:
      "Watercolor peonies, hydrangeas, roses, and magnolias bring the garden to your correspondence.",
    image: "",
    categories: ["floral"],
  },
  {
    slug: "seasonal",
    title: "Seasonal Collection",
    description: "Celebrate every season with curated designs",
    longDescription:
      "Spring bouquets, summer citrus, autumn harvest, holiday greenery — limited-edition designs to mark life's special moments.",
    image: "",
    categories: ["seasonal"],
  },
  {
    slug: "weddings",
    title: "Weddings & Events",
    description: "Elegant stationery for life's most special moments",
    longDescription:
      "Save-the-dates, thank-you cards, and event stationery — designed to set the tone for your celebration.",
    image: "",
    categories: ["weddings"],
  },
];

export function findCollection(slug: string): AppCollection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

// ─── GraphQL adapter ─────────────────────────────────────────────────
// Hydrogen's Storefront GraphQL returns products in a different shape.
// Adapt that to our internal ShopifyProduct (REST-ish) shape.
export interface GraphqlProduct {
  id: string;
  handle: string;
  title: string;
  descriptionHtml?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[] | null;
  variants?: {
    nodes: Array<{
      price: {amount: string};
      compareAtPrice?: {amount: string} | null;
      availableForSale?: boolean;
    }>;
  };
  images?: {nodes: Array<{url: string; altText?: string | null}>};
  featuredImage?: {url: string} | null;
}

/** Drop duplicate image entries by src, preserving order. */
function dedupeBySrc(imgs: Array<{src: string}>): Array<{src: string}> {
  const seen = new Set<string>();
  return imgs.filter((i) => {
    if (!i.src || seen.has(i.src)) return false;
    seen.add(i.src);
    return true;
  });
}

export function graphqlToAppProduct(p: GraphqlProduct): AppProduct {
  const shopify: ShopifyProduct = {
    id: p.id,
    title: p.title,
    handle: p.handle,
    body_html: p.descriptionHtml ?? '',
    vendor: p.vendor ?? '',
    product_type: p.productType ?? '',
    tags: p.tags ?? [],
    variants: (p.variants?.nodes ?? []).map((v) => ({
      price: v.price.amount,
      compare_at_price: v.compareAtPrice?.amount ?? null,
      available: v.availableForSale ?? true,
    })),
    // Featured image first, then the rest — deduped so the featured image
    // isn't repeated when it also appears in images.nodes (it usually does).
    images: dedupeBySrc([
      ...(p.featuredImage ? [{src: p.featuredImage.url}] : []),
      ...((p.images?.nodes ?? []).map((i) => ({src: i.url}))),
    ]),
  };
  return shopifyToAppProduct(shopify);
}
