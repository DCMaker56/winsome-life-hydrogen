/*
 * Collection filters — Theme / Occasion / For / Style / Price + Sort on the
 * product-type pages (Notecards, Notepads, …) and Shop All.
 *
 * Built from the collections each product already belongs to in Shopify
 * (Floral, Christmas / Holiday, Men, Monograms, …), so no retagging is needed.
 * Within a filter, choices widen the results (Floral OR Seaside); across
 * filters they narrow it (Floral AND Christmas). Choices live in the URL
 * (?theme=floral,seaside&sort=price-asc) so a filtered page can be shared.
 *
 * To add a choice: add the collection's handle to the right group below.
 */

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

export const FILTER_GROUPS: FilterGroup[] = [
  {
    key: 'theme',
    label: 'Theme',
    options: [
      {value: 'floral', label: 'Floral', collection: 'floral'},
      {value: 'seaside', label: 'Seaside', collection: 'seaside'},
      {value: 'nature', label: 'Nature', collection: 'nature-1'},
      {value: 'sports', label: 'Sports', collection: 'sports-1'},
      {value: 'military', label: 'Military', collection: 'military'},
      {value: 'travel', label: 'Travel', collection: 'travel'},
      {value: 'dogs-cats', label: 'Dogs & Cats', collection: 'dogs'},
      {value: 'christian', label: 'Christian', collection: 'christian-1'},
      {value: 'greek-life', label: 'Greek Life', collection: 'greek-life-sorority-fraternity'},
      {value: 'mahjong', label: 'Mahjong', collection: 'mahjong'},
      {value: 'hobbies', label: 'Hobbies & Interests', collection: 'affinity-hobbies'},
    ],
  },
  {
    key: 'occasion',
    label: 'Occasion',
    options: [
      {value: 'christmas', label: 'Christmas & Holiday', collection: 'christmas-holiday'},
      {value: 'fall', label: 'Thanksgiving & Fall', collection: 'fall-autumn'},
      {value: 'valentines', label: 'Valentine’s Day', collection: 'valentines-day'},
      {value: 'easter', label: 'Easter', collection: 'easter'},
      {value: 'st-patricks', label: 'St. Patrick’s Day', collection: 'st-patricks-day'},
      {value: 'spring', label: 'Spring', collection: 'spring-1'},
      {value: 'summer', label: 'Summer', collection: 'summer'},
      {value: 'winter', label: 'Winter', collection: 'winter-1'},
      {value: 'halloween', label: 'Halloween', collection: 'halloween'},
      {value: 'graduation', label: 'Graduation', collection: 'graduation'},
    ],
  },
  {
    key: 'for',
    label: 'For',
    options: [
      {value: 'men', label: 'Men', collection: 'mens'},
      {value: 'baby-child', label: 'Baby & Child', collection: 'baby'},
      {value: 'family', label: 'Family & Couples', collection: 'family-couples'},
      {value: 'teacher', label: 'Teacher', collection: 'teacher'},
      {value: 'business', label: 'Business & Professional', collection: 'business-professional'},
    ],
  },
  {
    key: 'style',
    label: 'Style',
    options: [
      {value: 'monogram', label: 'Monogram', collection: 'monogram-styles'},
      {value: 'classic', label: 'Classic', collection: 'classics'},
      {value: 'folded', label: 'Folded', test: (p) => /\bfolded\b/i.test(p.title)},
      {value: 'flat', label: 'Flat', test: (p) => /\bflat\b/i.test(p.title)},
    ],
  },
  {
    key: 'price',
    label: 'Price',
    options: [
      {value: 'under-20', label: 'Under $20', test: (p) => p.minPrice < 20},
      {value: '20-30', label: '$20 – $30', test: (p) => p.minPrice >= 20 && p.minPrice <= 30},
      {value: 'over-30', label: 'Over $30', test: (p) => p.minPrice > 30},
    ],
  },
];

export const SORT_OPTIONS = [
  {value: 'featured', label: 'Featured'},
  {value: 'newest', label: 'Newest'},
  {value: 'price-asc', label: 'Price: Low to High'},
  {value: 'price-desc', label: 'Price: High to Low'},
] as const;

export type Selection = Record<string, string[]>;

export function parseSelection(params: URLSearchParams): {
  selection: Selection;
  sort: string;
  q: string;
} {
  const selection: Selection = {};
  for (const g of FILTER_GROUPS) {
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
  return (o.collection ? p.collections.includes(o.collection) : false) || (o.test ? o.test(p) : false);
}

function passes(p: FilterProduct, selection: Selection, skipGroup?: string) {
  return FILTER_GROUPS.every((g) => {
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
 * Filter + sort, and work out which choices to offer. A choice's count is
 * what you'd see after picking it (other filters applied); choices that would
 * show nothing are left out, as is the page's own collection (no "Floral"
 * filter on the Floral page).
 */
export function applyFilters(
  allProducts: FilterProduct[],
  selection: Selection,
  sort: string,
  currentCollection?: string,
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
  const results = products.filter((p) => passes(p, selection));
  if (sort === 'price-asc') results.sort((a, b) => a.minPrice - b.minPrice);
  else if (sort === 'price-desc') results.sort((a, b) => b.minPrice - a.minPrice);
  else if (sort === 'newest') results.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const facets: FacetGroup[] = FILTER_GROUPS.map((g) => {
    const pool = products.filter((p) => passes(p, selection, g.key));
    return {
      key: g.key,
      label: g.label,
      options: g.options
        .filter((o) => !o.collection || o.collection !== currentCollection)
        .map((o) => ({
          value: o.value,
          label: o.label,
          count: pool.filter((p) => matches(p, o)).length,
          selected: !!selection[g.key]?.includes(o.value),
        }))
        .filter((o) => o.count > 0 || o.selected),
    };
  }).filter((g) => g.options.length > 0);

  return {results, facets};
}
