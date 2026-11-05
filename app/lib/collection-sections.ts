/*
 * Groups a page's products under collection headings (Monograms, Sports,
 * Floral, …). Used on the product-type pages (Notecards, Notepads, …) and on
 * partner pages.
 *
 * Each product shows once, under the first heading it qualifies for:
 *  1. hand placements (product handle → headings; may list several),
 *  2. then rules (in a collection, or a word in the product name),
 *  3. then the first collection in `order` that the product is in.
 * Anything left goes under `moreTitle`. Headings follow `order`; empty ones
 * are skipped.
 */
import type {CardData} from '~/lib/collection-filters.server';
import {PRODUCT_TYPE_COLLECTIONS} from '~/lib/collection-filters';

export type Section = {handle: string; title: string; cards: CardData[]};

export type SectionConfig = {
  order: string[];
  /** Heading names that differ from the Shopify collection's title. */
  titles?: Record<string, string>;
  rules?: Array<{section: string; collection?: string; titleMatch?: RegExp}>;
  placements?: Record<string, string[]>;
  moreTitle?: string;
};

export function groupIntoSections(
  cards: CardData[],
  collectionsById: Record<string, Array<{handle: string; title: string}>>,
  {order, titles: titleOverrides = {}, rules = [], placements = {}, moreTitle = 'More Designs'}: SectionConfig,
): Section[] {
  const titles = new Map<string, string>();
  for (const list of Object.values(collectionsById))
    for (const c of list) titles.set(c.handle, c.title.replace(/ Collection$/i, ''));
  const buckets = new Map<string, CardData[]>();
  const add = (h: string, card: CardData) => buckets.set(h, [...(buckets.get(h) ?? []), card]);
  const more: CardData[] = [];
  for (const card of cards) {
    const placed = placements[card.slug];
    if (placed) {
      for (const h of placed) add(h, card);
      continue;
    }
    const handles = new Set((collectionsById[card.id] ?? []).map((c) => c.handle));
    const rule = rules.find(
      (r) =>
        (r.collection && handles.has(r.collection)) ||
        (r.titleMatch && r.titleMatch.test(card.title)),
    );
    const home = rule?.section ?? order.find((h) => handles.has(h));
    if (home) add(home, card);
    else more.push(card);
  }
  return [
    ...order
      .filter((h) => buckets.has(h))
      .map((h) => ({handle: h, title: titleOverrides[h] ?? titles.get(h) ?? h, cards: buckets.get(h)!})),
    ...(more.length ? [{handle: 'more', title: moreTitle, cards: more}] : []),
  ];
}

/**
 * Product-type pages grouped by collection, and the heading order there
 * (Sydney, Nov 2026). Pages with fewer than MIN_TO_GROUP products stay a
 * single grid.
 */
export const GROUPED_PAGES = new Set([
  'notecards',
  'notepads',
  'gift-tags-stickers',
  'place-cards',
  'holiday-photo-cards',
  'wine-tags-1',
  'artwork',
]);
export const MIN_TO_GROUP = 16;

/**
 * Holiday products go under their holiday first, even if they're also in a
 * theme (a Christmas monogram gift tag shows under Christmas / Holiday).
 * General seasons (Winter, Spring, Summer) only catch what nothing else does.
 */
export const PRODUCT_TYPE_SECTION_RULES = [
  'christmas-holiday',
  'fall-autumn',
  'halloween',
  'valentines-day',
  'st-patricks-day',
  'easter',
  'graduation',
].map((h) => ({section: h, collection: h}));

export const PRODUCT_TYPE_SECTION_ORDER = [
  'monogram-styles',
  'classics',
  'floral',
  'seaside',
  'nature-1',
  'travel',
  'sports-1',
  'affinity-hobbies',
  'mahjong',
  'dogs',
  'christian-1',
  'family-couples',
  'baby',
  'mens',
  'teacher',
  'business-professional',
  'greek-life-sorority-fraternity',
  'military',
  'graduation',
  'christmas-holiday',
  'fall-autumn',
  'halloween',
  'winter-1',
  'valentines-day',
  'st-patricks-day',
  'easter',
  'spring-1',
  'summer',
];

/**
 * Shop All: products grouped by product type (Notecards, Notepads, …, in
 * PRODUCT_TYPE_COLLECTIONS order), then by collection within each type
 * (types with fewer than MIN_TO_GROUP products stay one grid). Each product
 * shows once, under its first product type; products with none go last.
 */
export function groupByTypeThenCollection(
  cards: CardData[],
  collectionsById: Record<string, Array<{handle: string; title: string}>>,
) {
  const types = groupIntoSections(cards, collectionsById, {
    order: PRODUCT_TYPE_COLLECTIONS,
    moreTitle: 'Other Designs',
  });
  return types.map((t) => {
    let subsections: Section[] | null = null;
    if (t.cards.length >= MIN_TO_GROUP) {
      subsections = groupIntoSections(t.cards, collectionsById, {
        order: PRODUCT_TYPE_SECTION_ORDER,
        rules: PRODUCT_TYPE_SECTION_RULES,
      });
      if (subsections.length < 2) subsections = null;
    }
    return {...t, subsections};
  });
}
