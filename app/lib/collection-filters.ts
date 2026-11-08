/*
 * Collection filters — on the collection pages and Shop All: a search box,
 * Product Type / Collection / Season filters and Sort.
 *
 * Filters are built automatically from every Shopify collection the page's
 * products belong to, split into Product Type, Collection and Season (see
 * collectionGroups). A new collection shows up on its own (under Collection
 * unless it's listed as a product type or season). Picking several choices in
 * one filter widens the results (Floral OR Seaside); choices in different
 * filters narrow them (Notecards AND Christmas). Choices live in the URL
 * (?type=notecards&collection=floral,seaside&season=spring-1&sort=price-asc&q=duck)
 * so a filtered page can be shared.
 */

import {isPartnerCollection} from '~/lib/partners';

export type FilterProduct = {
  id: string;
  handle: string;
  title: string;
  collections: string[];
  minPrice: number;
  publishedAt: string;
};

type Option = {
  value: string;
  label: string;
  /** Matches when the product is in this collection… */
  collection?: string;
  /** …or when this test passes. */
  test?: (p: FilterProduct) => boolean;
};

export type FilterGroup = {key: string; label: string; options: Option[]};

/** Product-type collections ("Filter by Product Type"). */
export const PRODUCT_TYPE_COLLECTIONS = [
  'notecards',
  'notepads',
  'gift-tags-stickers',
  'wine-tags-1',
  'place-cards',
  'holiday-photo-cards',
  'artwork',
  'calendars',
  'mugs',
  'coasters',
  'bookmarks',
  'signs-milestone-cards',
  'invitations-announcements',
  'apparel',
];

/** Seasonal collections ("Filter by Season"), in calendar order. */
export const SEASON_COLLECTIONS = [
  'winter-1',
  'valentines-day',
  'st-patricks-day',
  'easter',
  'spring-1',
  'summer',
  'halloween',
  'fall-autumn',
  'christmas-holiday',
];

/**
 * The filters, built from every collection the page's products are in
 * (except the page's own collection and partner-only "partner-…" ones):
 *  - Filter by Product Type: Notecards, Notepads, … (not on product-type pages)
 *  - Filter by Collection: themes and everything else, A–Z
 *  - Filter by Season: seasonal collections, in calendar order
 * Groups with nothing to offer are hidden.
 */
export function collectionGroups(
  collections: Array<{handle: string; title: string}>,
  currentCollection?: string,
): FilterGroup[] {
  const seen = new Map<string, string>();
  for (const c of collections) {
    if (
      c.handle !== currentCollection &&
      !isPartnerCollection(c.handle) &&
      !seen.has(c.handle)
    ) {
      seen.set(c.handle, c.title.replace(/ Collection$/i, ''));
    }
  }
  const opt = (handle: string) => ({
    value: handle,
    label: seen.get(handle)!,
    collection: handle,
  });
  const onTypePage =
    !!currentCollection && PRODUCT_TYPE_COLLECTIONS.includes(currentCollection);
  const types = onTypePage ? [] : PRODUCT_TYPE_COLLECTIONS.filter((h) => seen.has(h));
  const seasons = SEASON_COLLECTIONS.filter((h) => seen.has(h));
  const rest = [...seen.keys()]
    .filter(
      (h) => !PRODUCT_TYPE_COLLECTIONS.includes(h) && !SEASON_COLLECTIONS.includes(h),
    )
    .sort((a, b) => seen.get(a)!.localeCompare(seen.get(b)!));
  return [
    {key: 'type', label: 'Filter by Product Type', options: types.map(opt)},
    {key: 'collection', label: 'Filter by Collection', options: rest.map(opt)},
    {key: 'season', label: 'Filter by Season', options: seasons.map(opt)},
    PRICE_GROUP,
  ];
}

/** Price ranges by starting price (used by the gift guide's Shop by Budget). */
export const PRICE_GROUP: FilterGroup = {
  key: 'price',
  label: 'Filter by Price',
  options: [
    {value: 'under-25', label: 'Under $25', test: (p) => p.minPrice < 25},
    {value: '25-50', label: '$25 – $50', test: (p) => p.minPrice >= 25 && p.minPrice <= 50},
    {value: '50-up', label: '$50 & Up', test: (p) => p.minPrice > 50},
  ],
};

export const SORT_OPTIONS = [
  {value: 'featured', label: 'Featured'},
  {value: 'newest', label: 'Newest'},
  {value: 'price-asc', label: 'Price: Low to High'},
  {value: 'price-desc', label: 'Price: High to Low'},
] as const;

export type Selection = Record<string, string[]>;

export function parseSelection(
  params: URLSearchParams,
  groups: FilterGroup[],
): {selection: Selection; sort: string; q: string} {
  const selection: Selection = {};
  for (const g of groups) {
    const values = (params.get(g.key) ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => g.options.some((o) => o.value === v));
    if (values.length) selection[g.key] = values;
  }
  const s = params.get('sort') ?? 'featured';
  const sort = SORT_OPTIONS.some((o) => o.value === s) ? s : 'featured';
  const q = (params.get('q') ?? '').trim().slice(0, 100);
  return {selection, sort, q};
}

function matches(p: FilterProduct, o: Option) {
  return (
    (o.collection ? p.collections.includes(o.collection) : false) ||
    (o.test ? o.test(p) : false)
  );
}

function passes(
  p: FilterProduct,
  groups: FilterGroup[],
  selection: Selection,
  skipGroup?: string,
) {
  return groups.every((g) => {
    if (g.key === skipGroup) return true;
    const chosen = selection[g.key];
    if (!chosen?.length) return true;
    return g.options.some((o) => chosen.includes(o.value) && matches(p, o));
  });
}

export type FacetGroup = {
  key: string;
  label: string;
  options: Array<{value: string; label: string; count: number; selected: boolean}>;
};

/**
 * Search, filter and sort, and work out which choices to offer. A choice's
 * count is what you'd see after picking it; choices that would show nothing
 * are left out.
 */
export function applyFilters(
  allProducts: FilterProduct[],
  groups: FilterGroup[],
  selection: Selection,
  sort: string,
  q = '',
) {
  // Search box: every word must appear in the product's name ("duck notepad").
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const products = words.length
    ? allProducts.filter((p) => {
        const name = p.title.toLowerCase();
        return words.every((w) => name.includes(w));
      })
    : allProducts;
  const results = products.filter((p) => passes(p, groups, selection));
  if (sort === 'price-asc') results.sort((a, b) => a.minPrice - b.minPrice);
  else if (sort === 'price-desc') results.sort((a, b) => b.minPrice - a.minPrice);
  else if (sort === 'newest') results.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const facets: FacetGroup[] = groups
    .map((g) => {
      const pool = products.filter((p) => passes(p, groups, selection, g.key));
      return {
        key: g.key,
        label: g.label,
        options: g.options
          .map((o) => ({
            value: o.value,
            label: o.label,
            count: pool.filter((p) => matches(p, o)).length,
            selected: !!selection[g.key]?.includes(o.value),
          }))
          .filter((o) => o.count > 0 || o.selected),
      };
    })
    .filter((g) => g.options.length > 0);

  return {results, facets};
}
