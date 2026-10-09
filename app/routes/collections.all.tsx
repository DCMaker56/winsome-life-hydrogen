/**
 * All Designs — every product, branded grid with infinite scroll.
 */
import type {Route} from './+types/collections.all';
import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {InfiniteProductGrid} from '~/components/InfiniteProductGrid';
import CollectionHowTo from '~/components/CollectionHowTo';
import {JsonLd} from '~/components/JsonLd';
import {absoluteUrl, breadcrumbJsonLd, itemListJsonLd} from '~/lib/seo';

export const meta: Route.MetaFunction = () => {
  const title = 'All Designs | The Winsome Life';
  const description =
    'Browse every personalized stationery design — notecards, notepads, gift tags, wine tags, and more.';
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: absoluteUrl('/collections/all')},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const [{products}] = await Promise.all([
    context.storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
  ]);

  return {products};
}

export default function AllProducts() {
  const {products} = useLoaderData<typeof loader>();

  const listProducts = (products.nodes ?? []).map((p) => ({
    slug: p.handle,
    title: p.title,
    image: p.featuredImage?.url ?? undefined,
    price: Number(p.variants?.nodes?.[0]?.price?.amount ?? 0) || undefined,
  }));

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            {name: 'Home', path: '/'},
            {name: 'All Designs'},
          ]),
          itemListJsonLd(listProducts, '/collections/all'),
        ]}
      />
      <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-[#2D2D2D]/45 mb-4">
          <Link to="/" className="hover:text-[#C9A96E]">
            Home
          </Link>{' '}
          / <span className="text-[#2D2D2D]/70" aria-current="page">All Designs</span>
        </nav>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#C9A96E]/15 pb-5 mb-8">
          <h1 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] leading-none">
            All Designs
          </h1>
          <p className="font-sans font-light text-sm text-[#2D2D2D]/60 leading-relaxed w-full max-w-2xl mt-1">
            Every personalized piece — each ready to make your own.
          </p>
        </div>
      </section>

      <section className="container max-w-7xl mx-auto px-4 lg:px-8">
        <CollectionHowTo />
        <InfiniteProductGrid connection={products} />
      </section>

      <Analytics.CollectionView
        data={{collection: {id: 'all-products', handle: 'all'}}}
      />
    </main>
  );
}

const PRODUCT_FRAGMENT = `#graphql
  fragment CatalogProduct on Product {
    id
    handle
    title
    descriptionHtml
    vendor
    productType
    tags
    featuredImage { url altText }
    images(first: 2) { nodes { url } }
    variants(first: 3) {
      nodes {
        price { amount }
        compareAtPrice { amount }
        availableForSale
      }
    }
  }
` as const;

const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes { ...CatalogProduct }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
