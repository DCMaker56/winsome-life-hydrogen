/**
 * Collection page — Hydrogen + Winsome brand UI.
 *
 * Hero image + scrollable product sampler on top, full filterable grid below.
 */
import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import {InfiniteProductGrid} from '~/components/InfiniteProductGrid';
import CollectionHowTo from '~/components/CollectionHowTo';
import {JsonLd} from '~/components/JsonLd';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) => {
  const title = `${data?.collection?.title ?? 'Collection'} | The Winsome Life`;
  const description =
    data?.collection?.description ||
    `Shop ${data?.collection?.title ?? 'our'} — personalized luxury stationery from The Winsome Life.`;
  return [
    {title},
    {name: 'description', content: description},
    {
      tagName: 'link',
      rel: 'canonical',
      href: absoluteUrl(`/collections/${data?.collection?.handle}`),
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response(null, {status: 404});

  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const [{collection}] = await Promise.all([
    context.storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
    }),
  ]);
  if (!collection) throw new Response(null, {status: 404});

  return {collection};
}

export default function CollectionRoute() {
  const {collection} = useLoaderData<typeof loader>();
  const count = collection.products?.nodes?.length ?? 0;

  const listProducts = (collection.products?.nodes ?? []).map(
    (p: {
      handle: string;
      title: string;
      featuredImage?: {url?: string | null} | null;
      variants?: {nodes?: Array<{price?: {amount?: string} | null} | null>} | null;
    }) => ({
      slug: p.handle,
      title: p.title,
      image: p.featuredImage?.url ?? undefined,
      price: Number(p.variants?.nodes?.[0]?.price?.amount ?? 0) || undefined,
    }),
  );

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            {name: 'Home', path: '/'},
            {name: 'Collections', path: '/collections/all'},
            {name: collection.title},
          ]),
          itemListJsonLd(listProducts, `/collections/${collection.handle}`),
        ]}
      />
      {/* Compact header — breadcrumb, then title · count on one baseline */}
      <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-[#2D2D2D]/45 mb-4">
          <Link to="/" className="hover:text-[#C9A96E]">
            Home
          </Link>{' '}
          /{' '}
          <Link to="/collections/all" className="hover:text-[#C9A96E]">
            Collections
          </Link>{' '}
          / <span className="text-[#2D2D2D]/70" aria-current="page">{collection.title}</span>
        </nav>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#C9A96E]/15 pb-5 mb-8">
          <h1 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] leading-none">
            {collection.title.replace(/ Collection$/i, '')}
          </h1>
          <p className="font-sans text-sm text-[#2D2D2D]/45">
            {count}
            {collection.products?.pageInfo?.hasNextPage ? '+' : ''}{' '}
            {count === 1 ? 'piece' : 'pieces'}
          </p>
          {collection.description && (
            <p className="font-sans font-light text-sm text-[#2D2D2D]/60 leading-relaxed w-full max-w-2xl mt-1">
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Product grid — infinite scroll */}
      <section className="container max-w-7xl mx-auto px-4 lg:px-8">
        <CollectionHowTo />
        <InfiniteProductGrid connection={collection.products} />
      </section>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </main>
  );
}

const PRODUCT_FRAGMENT = `#graphql
  fragment ProductItem on Product {
    id
    handle
    title
    descriptionHtml
    productType
    tags
    featuredImage { url altText }
    images(first: 3) { nodes { url } }
    variants(first: 3) {
      nodes {
        price { amount }
        compareAtPrice { amount }
        availableForSale
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
      ) {
        nodes { ...ProductItem }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;
