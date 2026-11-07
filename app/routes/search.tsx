import {Form, Link, useLoaderData} from 'react-router';
import {Search as SearchIcon} from 'lucide-react';
import type {Route} from './+types/search';
import {getPaginationVariables, Analytics, Image, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';
import {
  type RegularSearchReturn,
  type PredictiveSearchReturn,
  getEmptyPredictiveSearchResult,
} from '~/lib/search';
import type {
  RegularSearchQuery,
  PredictiveSearchQuery,
} from 'storefrontapi.generated';
import {isAddOnHandle} from '~/lib/addons';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Search | The Winsome Life'}, {name: 'robots', content: 'noindex'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise: Promise<PredictiveSearchReturn | RegularSearchReturn> =
    isPredictive
      ? predictiveSearch({request, context})
      : regularSearch({request, context});

  searchPromise.catch((error: Error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });

  return await searchPromise;
}

/**
 * The search results page (/search?q=…), styled like the collection pages:
 * a search box, then a grid of matching products with "Load more".
 */
export default function SearchPage() {
  const {type, term, result, error} = useLoaderData<typeof loader>();
  if (type === 'predictive') return null;
  const products = result?.items?.products;
  const count = products?.nodes.length ?? 0;

  return (
    <main className="bg-[#FAF8F5] min-h-[60vh]">
      <section className="container max-w-6xl py-12 lg:py-16">
        <h1 className="text-center font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
          {term ? (
            <>Results for &ldquo;{term}&rdquo;</>
          ) : (
            'Search'
          )}
        </h1>
        <Form
          method="get"
          action="/search"
          role="search"
          className="mt-6 mx-auto max-w-xl flex items-center gap-3 bg-white ring-1 ring-[#C9A96E]/40 focus-within:ring-[#C9A96E] px-4 h-12"
        >
          <SearchIcon size={18} className="text-[#C9A96E] shrink-0" aria-hidden />
          <input
            key={term}
            defaultValue={term}
            name="q"
            type="search"
            placeholder="Search notecards, notepads, gifts…"
            aria-label="Search products"
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent font-sans text-[16px] text-[#2D2D2D] placeholder:text-[#2D2D2D]/40 outline-none"
          />
          <button
            type="submit"
            className="font-sans font-medium text-[11px] tracking-[0.15em] uppercase text-[#2D2D2D] hover:text-[#C9A96E]"
          >
            Search
          </button>
        </Form>

        {error && <p className="mt-6 text-center font-sans text-sm text-[#B23A3A]">{error}</p>}

        {term && !count ? (
          <div className="mt-12 text-center">
            <p className="font-sans text-[15px] text-[#2D2D2D]">
              Nothing matched &ldquo;{term}&rdquo;.
            </p>
            <p className="font-sans text-[13px] text-[#2D2D2D]/55 mt-1">
              Try a simpler word, or{' '}
              <Link to="/collections/all" className="underline hover:text-[#C9A96E]">
                browse everything
              </Link>
              .
            </p>
          </div>
        ) : null}

        {products && count > 0 && (
          <Pagination connection={products}>
            {({nodes, isLoading, NextLink}) => (
              <>
                <ul className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6">
                  {nodes.map((product) => {
                    const v = product.selectedOrFirstAvailableVariant;
                    const url = urlWithTrackingParams({
                      baseUrl: `/products/${product.handle}`,
                      trackingParams: product.trackingParameters,
                      term,
                    });
                    return (
                      <li key={product.id}>
                        <Link to={url} prefetch="intent" className="group block">
                          <div className="aspect-square bg-white overflow-hidden ring-1 ring-[#C9A96E]/15">
                            {v?.image && (
                              <Image
                                data={v.image}
                                alt={product.title}
                                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                              />
                            )}
                          </div>
                          <p className="mt-3 font-serif text-[15px] md:text-[16px] text-[#2D2D2D] leading-snug line-clamp-2 group-hover:text-[#C9A96E] transition-colors">
                            {product.title.split('|')[0].trim()}
                          </p>
                          {v?.price && (
                            <p className="font-sans text-[13px] text-[#2D2D2D]/60 mt-1">
                              From ${Number(v.price.amount).toFixed(2)}
                            </p>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-10 text-center">
                  <NextLink className="inline-flex items-center justify-center h-12 px-10 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#C9A96E] transition-colors">
                    {isLoading ? 'Loading…' : 'Load more'}
                  </NextLink>
                </div>
              </>
            )}
          </Pagination>
        )}
      </section>
      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} />
    </main>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
` as const;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
` as const;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: RELEVANCE,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

/**
 * Regular search fetcher
 */
async function regularSearch({
  request,
  context,
}: Pick<
  Route.LoaderArgs,
  'request' | 'context'
>): Promise<RegularSearchReturn> {
  const {storefront} = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, {pageBy: 24});
  const term = String(url.searchParams.get('q') || '');

  // Search articles, pages, and products for the `q` term
  const {
    errors,
    ...items
  }: {errors?: Array<{message: string}>} & RegularSearchQuery =
    await storefront.query(SEARCH_QUERY, {
      variables: {...variables, term},
    });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  // Add-ons (the paid proof) aren't browsable products.
  items.products.nodes = items.products.nodes.filter(
    (p) => !isAddOnHandle(p.handle),
  );

  const total = Object.values(items).reduce(
    (acc: number, {nodes}: {nodes: Array<unknown>}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}: {message: string}) => message).join(', ')
    : undefined;

  return {type: 'regular', term, error, result: {total, items}};
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

/**
 * Predictive search fetcher
 */
async function predictiveSearch({
  request,
  context,
}: Pick<
  Route.ActionArgs,
  'request' | 'context'
>): Promise<PredictiveSearchReturn> {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const {
    predictiveSearch: items,
    errors,
  }: PredictiveSearchQuery & {errors?: Array<{message: string}>} =
    await storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        term,
      },
    });

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}: {message: string}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  items.products = items.products.filter((p) => !isAddOnHandle(p.handle));
  // Partner-only collections (partner-…) are private to their partner page.
  items.collections = items.collections.filter((c) => !c.handle.startsWith('partner-'));

  const total = Object.values(items).reduce(
    (acc: number, item: Array<unknown>) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}
