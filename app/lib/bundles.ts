/*
 * Gift Sets Data Store
 * Themed lifestyle gift sets: each set groups notecards, a notepad, a desk calendar,
 * a ceramic mug, and gift tags — all featuring the same watercolor illustration.
 */

export type ItemType = "notecards" | "notepad" | "calendar" | "mug" | "gift-tags";

export interface GiftSetItem {
  type: ItemType;
  label: string;
  description: string;
  individualPrice: number;
  quantity: string;
}

export interface GiftSet {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  category: "sports" | "coastal" | "pets" | "floral" | "preppy";
  categoryLabel: string;
  items: GiftSetItem[];
  setPrice: number;
  savings: number;
  badge?: string;
  personalizable: boolean;
}

// Keep legacy exports for backward compat
export type BundleItem = GiftSetItem;
export type Bundle = GiftSet;

// CDN image URLs (generated)
const LACROSSE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663510562926/j8eawuYxyibob6S8H2yeLJ/bundle-lacrosse-6fPNY4znxYJXpMnzbtcykY.webp";
const SEAHORSE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663510562926/j8eawuYxyibob6S8H2yeLJ/bundle-seahorse-85xnVq3mvJHiYm7rvbQdbp.webp";
const GOLDEN_RETRIEVER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663510562926/j8eawuYxyibob6S8H2yeLJ/bundle-golden-retriever-6LK5yDTmn9q4ZSQYEbNefT.webp";
const TENNIS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663510562926/j8eawuYxyibob6S8H2yeLJ/bundle-tennis-gdnzTJDXMx4cDaqMz5GtNL.webp";

export const BUNDLES_HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663510562926/j8eawuYxyibob6S8H2yeLJ/bundles-hero-P6HhQjoJLKC9WNZHPVr226.webp";

// Helper: build a standard 5-piece gift set item list for a given theme
function buildItems(theme: string): GiftSetItem[] {
  return [
    {
      type: "notecards",
      label: `Personalized ${theme} Notecards`,
      description: `Set of 24 flat notecards with lined envelopes, featuring our signature watercolor ${theme.toLowerCase()} illustration. Personalized with your name or monogram in gold foil.`,
      individualPrice: 38,
      quantity: "Set of 24",
    },
    {
      type: "notepad",
      label: `${theme} Notepad`,
      description: `5.5" x 8.5" tear-off notepad with 50 sheets. The matching ${theme.toLowerCase()} watercolor graces the top of each page — perfect for lists, notes, and reminders.`,
      individualPrice: 22,
      quantity: "50 sheets",
    },
    {
      type: "calendar",
      label: `${theme} Desk Calendar`,
      description: `12-month spiral-bound desk calendar (5" x 7") featuring the coordinating ${theme.toLowerCase()} watercolor on every page. A beautiful addition to any desk or countertop.`,
      individualPrice: 28,
      quantity: "12 months",
    },
    {
      type: "mug",
      label: `${theme} Ceramic Mug`,
      description: `15 oz white ceramic mug with the ${theme.toLowerCase()} watercolor illustration wrapped around the front. Dishwasher and microwave safe. Arrives in a gift box.`,
      individualPrice: 26,
      quantity: "15 oz",
    },
    {
      type: "gift-tags",
      label: `${theme} Gift Tags`,
      description: `Set of 12 gift tags with silk ribbon, each featuring the coordinating ${theme.toLowerCase()} watercolor illustration. Perfect for wrapping gifts in style.`,
      individualPrice: 14,
      quantity: "Set of 12",
    },
  ];
}

export const giftSets: GiftSet[] = [
  {
    slug: "lacrosse-gift-set",
    name: "The Lacrosse Gift Set",
    tagline: "For the player, the fan, the lacrosse family",
    description:
      "Our watercolor lacrosse illustration — sticks crossed over a field of green — graces every piece in this coordinated gift set. From personalized notecards to a matching desk calendar and ceramic mug, this collection is the perfect gift for the lacrosse lover in your life or a beautiful way to celebrate the season.",
    image: LACROSSE_IMG,
    category: "sports",
    categoryLabel: "Sports",
    items: buildItems("Lacrosse"),
    setPrice: 98,
    savings: 30,
    badge: "Popular",
    personalizable: true,
  },
  {
    slug: "seahorse-gift-set",
    name: "The Seahorse Gift Set",
    tagline: "Coastal elegance, carried in every note",
    description:
      "Our delicate watercolor seahorse pair — painted in soft ocean blues, teals, and corals — brings a touch of the coast to your entire desk. This coordinated gift set includes notecards, a notepad, a desk calendar, a ceramic mug, and gift tags, all featuring the same signature illustration. A beautiful gift for the beach lover or anyone who finds peace by the sea.",
    image: SEAHORSE_IMG,
    category: "coastal",
    categoryLabel: "Coastal",
    items: buildItems("Seahorse"),
    setPrice: 98,
    savings: 30,
    badge: "Bestseller",
    personalizable: true,
  },
  {
    slug: "golden-retriever-gift-set",
    name: "The Golden Retriever Gift Set",
    tagline: "For the dog lover who writes from the heart",
    description:
      "Our warm, lifelike watercolor golden retriever portrait captures the gentle spirit of everyone's favorite companion. This coordinated gift set features the same original painting across notecards, a notepad, a desk calendar, a ceramic mug, and gift tags — making it the perfect gift for the golden retriever owner, dog mom, or animal lover in your life.",
    image: GOLDEN_RETRIEVER_IMG,
    category: "pets",
    categoryLabel: "Pets",
    items: buildItems("Golden Retriever"),
    setPrice: 98,
    savings: 30,
    personalizable: true,
  },
  {
    slug: "tennis-gift-set",
    name: "The Tennis Gift Set",
    tagline: "Serve up something personal",
    description:
      "Our preppy watercolor crossed-rackets illustration brings country club charm to your stationery drawer and beyond. This coordinated gift set features the same original tennis artwork across notecards, a notepad, a desk calendar, a ceramic mug, and gift tags — ideal for the tennis player, team mom, or anyone who loves the sport.",
    image: TENNIS_IMG,
    category: "sports",
    categoryLabel: "Sports",
    items: buildItems("Tennis"),
    setPrice: 98,
    savings: 30,
    badge: "New",
    personalizable: true,
  },
  {
    slug: "hydrangea-gift-set",
    name: "The Hydrangea Gift Set",
    tagline: "Garden-fresh elegance for every day",
    description:
      "Lush blue and lavender hydrangea blooms, painted in soft watercolor, bring a garden-fresh elegance to this five-piece gift set. Every item — from the personalized notecards to the ceramic mug — features the same original botanical illustration. A timeless choice for the gardener, the hostess, or anyone who loves classic florals.",
    image: "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=800&q=80",
    category: "floral",
    categoryLabel: "Floral",
    items: buildItems("Hydrangea"),
    setPrice: 98,
    savings: 30,
    personalizable: true,
  },
  {
    slug: "pickleball-gift-set",
    name: "The Pickleball Gift Set",
    tagline: "For the court enthusiast who loves a personal touch",
    description:
      "Paddles crossed, ball in flight — our playful watercolor pickleball illustration captures the energy and joy of the fastest-growing sport. This five-piece gift set brings that same spirited artwork to notecards, a notepad, a desk calendar, a ceramic mug, and gift tags. The perfect gift for your pickleball partner or league friends.",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
    category: "sports",
    categoryLabel: "Sports",
    items: buildItems("Pickleball"),
    setPrice: 98,
    savings: 30,
    badge: "New",
    personalizable: true,
  },
  {
    slug: "labrador-gift-set",
    name: "The Labrador Gift Set",
    tagline: "A loyal companion on every page and mug",
    description:
      "Our chocolate labrador watercolor portrait — warm eyes, soft fur, and that unmistakable expression — brings joy to every piece in this coordinated gift set. Notecards, notepad, desk calendar, ceramic mug, and gift tags all feature the same original painting. A heartfelt gift for any lab lover.",
    image: "https://images.unsplash.com/photo-1579168765467-3b235f938439?w=800&q=80",
    category: "pets",
    categoryLabel: "Pets",
    items: buildItems("Labrador"),
    setPrice: 98,
    savings: 30,
    personalizable: true,
  },
  {
    slug: "sailboat-gift-set",
    name: "The Sailboat Gift Set",
    tagline: "Set sail with stationery that tells your story",
    description:
      "A classic sailboat gliding across calm waters, painted in soft watercolor blues and whites — this coastal illustration brings nautical charm to your entire desk. The five-piece gift set includes personalized notecards, a notepad, a desk calendar, a ceramic mug, and gift tags, all featuring the same serene sailing scene.",
    image: "https://images.unsplash.com/photo-1534854638093-bada1813ca19?w=800&q=80",
    category: "coastal",
    categoryLabel: "Coastal",
    items: buildItems("Sailboat"),
    setPrice: 98,
    savings: 30,
    personalizable: true,
  },
];

// Legacy alias
export const bundles = giftSets;

export const giftSetCategories = [
  { slug: "all", label: "All Gift Sets" },
  { slug: "sports", label: "Sports" },
  { slug: "coastal", label: "Coastal" },
  { slug: "pets", label: "Pets" },
  { slug: "floral", label: "Floral" },
];

// Legacy alias
export const bundleCategories = giftSetCategories;

export function getGiftSetBySlug(slug: string): GiftSet | undefined {
  return giftSets.find((s) => s.slug === slug);
}

export function getGiftSetsByCategory(category: string): GiftSet[] {
  if (category === "all") return giftSets;
  return giftSets.filter((s) => s.category === category);
}

export function getRelatedGiftSets(currentSlug: string, limit = 3): GiftSet[] {
  const current = getGiftSetBySlug(currentSlug);
  if (!current) return giftSets.slice(0, limit);
  const sameCategory = giftSets.filter(
    (s) => s.category === current.category && s.slug !== currentSlug
  );
  const others = giftSets.filter(
    (s) => s.category !== current.category && s.slug !== currentSlug
  );
  return [...sameCategory, ...others].slice(0, limit);
}

// Legacy aliases
export const getBundleBySlug = getGiftSetBySlug;
export const getBundlesByCategory = getGiftSetsByCategory;
export const getRelatedBundles = getRelatedGiftSets;
