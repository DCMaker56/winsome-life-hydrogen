/*
 * Loads every product on a collection page (or the whole catalog for Shop All)
 * with the collections each belongs to, then applies the filters in
 * ~/lib/collection-filters. Up to 1,000 products, 250 per request.
 */
import {
  applyFilters,
  collectionGroup,
  parseSelection,
  type FilterProduct,
} from '~/lib/collection-filters';

type Storefront = {
  query: <T>(q: string, opts?: {variables?: Record<string, unknown>; cache?: unknown}) => Promise<T>;
  CacheShort: () => unknown;
};

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  tags: string[];
  publishedAt: string;
  featuredImage: {url: string} | null;
  priceRange: {minVariantPrice: {amount: string}};
  compareAtPriceRange: {maxVariantPrice: {amount: string}};
  collections: {nodes: Array<{handle: string; title: string}>};
};

type Page = {
  nodes: RawProduct[];
  pageInfo: {hasNextPage: boolean; endCursor: string | null};
};

const FIELDS = `
  id handle title productType tags publishedAt
  featuredImage { url }
  priceRange { minVariantPrice { amount } }
  compareAtPriceRange { maxVariantPrice { amount } }
  collections(first: 60) { nodes { handle title } }
`;

const COLLECTION_PRODUCTS = `
  query FilterCollectionProducts($handle: String!, $after: String, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250, after: $after) {
        nodes { ${FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const ALL_PRODUCTS = `
  query FilterAllProducts($after: String, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 250, after: $after, sortKey: BEST_SELLING, query: "tag_not:add-on") {
      nodes { ${FIELDS} }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

/** A product card's data, as the grid shows it. */
export type CardData = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  onSale: boolean;
  type: string;
};

async function fetchAll(storefront: Storefront, handle?: string) {
  const out: RawProduct[] = [];
  let after: string | null = null;
  for (let i = 0; i < 4; i++) {
    let page: Page | undefined;
    if (handle) {
      const data: {collection: {products: Page} | null} = await storefront.query<{
        collection: {products: Page} | null;
      }>(
        COLLECTION_PRODUCTS,
        {variables: {handle, after}, cache: storefront.CacheShort()},
      );
      page = data.collection?.products;
    } else {
      const data: {products: Page} = await storefront.query<{products: Page}>(ALL_PRODUCTS, {
        variables: {after},
        cache: storefront.CacheShort(),
      });
      page = data.products;
    }
    if (!page) break;
    out.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out;
}

export async function loadFilteredProducts(
  storefront: Storefront,
  request: Request,
  collectionHandle?: string,
) {
  const raw = await fetchAll(storefront, collectionHandle);
  const byId = new Map(raw.map((p) => [p.id, p]));
  const products: FilterProduct[] = raw.map((p) => ({
    id: p.id,
    handle: p.handle,
    title: p.title,
    collections: p.collections.nodes.map((c) => c.handle),
    minPrice: Number(p.priceRange.minVariantPrice.amount),
    publishedAt: p.publishedAt ?? '',
  }));
  const groups = [
    collectionGroup(
      raw.flatMap((p) => p.collections.nodes),
      collectionHandle,
    ),
  ];
  const {selection, sort, q} = parseSelection(new URL(request.url).searchParams, groups);
  const {results, facets} = applyFilters(products, groups, selection, sort, q);
  const cards: CardData[] = results.map((r) => {
    const p = byId.get(r.id)!;
    const price = Number(p.priceRange.minVariantPrice.amount);
    return {
      id: p.id,
      slug: p.handle,
      title: p.title,
      image: p.featuredImage?.url ?? null,
      price,
      onSale: Number(p.compareAtPriceRange.maxVariantPrice.amount) > price,
      type: p.productType || 'stationery',
    };
  });
  return {cards, facets, selection, sort, q, total: products.length};
}
