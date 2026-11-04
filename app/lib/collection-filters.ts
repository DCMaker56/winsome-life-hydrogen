/*
 * Collection filters — on the product-type pages (Notecards, Notepads, …)
 * and Shop All: a search box, one "Collection" filter and Sort.
 *
 * Per Sydney, the only filter is Collection, built automatically from every
 * Shopify collection the page's products belong to (Floral, Sports,
 * Christmas / Holiday, Men, Monograms, …). Nothing is hand-picked, so a new
 * collection shows up on its own and no product can be hidden by a missing
 * group. Picking several collections widens the results (Floral OR Seaside).
 * Choices live in the URL (?collection=floral,seaside&sort=price-asc&q=duck)
 * so a filtered page can be shared.
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

/**
 * The Collection filter: every collection the products are in, A–Z, except
 * the page's own collection (no "Notecards" filter on the Notecards page).
 */
export function collectionGroup(
  collections: Array<{handle: string; title: string}>,
  currentCollection?: string,
): FilterGroup {
  const seen = new Map<string, string>();
  for (const c of collections) {
    if (c.handle !== currentCollection && !seen.has(c.handle)) {
      seen.set(c.handle, c.title.replace(/ Collection$/i, ''));
    }
  }
  return {
    key: 'collection',
    label: 'Collection',
    options: [...seen.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([handle, title]) => ({value: handle, label: title, collection: handle})),
  };
}

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
