/**
 * Winsome Life — Home page.
 *
 * Fetches products from the Storefront GraphQL API in the loader, maps
 * them to our `AppProduct` shape, and renders the brand sections wrapped
 * in a CatalogProvider so the legacy brand components keep working.
 *
 * In dev with no credentials, Hydrogen falls back to mock.shop's products.
 * Once `.env` has PUBLIC_STOREFRONT_API_TOKEN + PUBLIC_STORE_DOMAIN, this
 * automatically reads from your real catalog.
 */
import type {Route} from './+types/_index';
import {useLoaderData} from 'react-router';
import {
  graphqlToAppProduct,
  COLLECTIONS,
  type GraphqlProduct,
} from '~/lib/shopify-transform';
import {CatalogProvider} from '~/hooks/useProducts';
import HeroSection from '~/components/HeroSection';
import TwoUpFeature from '~/components/TwoUpFeature';
import CollectionRow from '~/components/CollectionRow';
import DesignWall from '~/components/DesignWall';
import TrendingPopular from '~/components/TrendingPopular';
import Marquee from '~/components/Marquee';
import ShopByProductType from '~/components/ShopByProductType';
import BrandStory from '~/components/BrandStory';
import ValueProps from '~/components/ValueProps';
import SocialProof from '~/components/SocialProof';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'The Winsome Life | Luxury Personalized Stationery'},
    {
      name: 'description',
      content:
        "Luxury personalized stationery designed to be treasured. Watercolor notecards, monogram gifts, custom notepads, and bespoke gift sets — crafted with care.",
    },
  ];
};

// "Shop by Interest" genre circles — label + real Shopify collection handle.
const INTERESTS = [
  {label: 'Floral', handle: 'floral'},
  {label: 'Monograms', handle: 'monogram-styles'},
  {label: 'Seaside', handle: 'seaside'},
  {label: 'Dogs & Cats', handle: 'dogs'},
  {label: 'Sports', handle: 'sports-1'},
  {label: 'Affinity & Hobbies', handle: 'affinity-hobbies'},
  {label: 'Travel', handle: 'travel'},
  {label: 'Christian', handle: 'christian-1'},
  {label: 'Business & Professional', handle: 'business-professional'},
  {label: 'Greek Life', handle: 'greek-life-sorority-fraternity'},
];

// Aliased query: one round trip for all genre collections' representative image.
const INTEREST_QUERY = `
  query InterestCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    ${INTERESTS.map(
      (it, i) =>
        `c${i}: collection(handle: "${it.handle}") { handle image { url } products(first: 1) { nodes { featuredImage { url } } } }`,
    ).join('\n')}
  }
`;

// "Shop by Product Type" square tiles — label + collection handle (icon added
// client-side in the component).
const PRODUCT_TYPES = [
  {label: 'Notecards', handle: 'notecards'},
  {label: 'Notepads', handle: 'notepads'},
  {label: 'Gift Tags & Stickers', handle: 'gift-tags-stickers'},
  {label: 'Artwork', handle: 'artwork'},
  {label: 'Wine Tags', handle: 'wine-tags-1'},
  {label: 'Place Cards', handle: 'place-cards'},
];

const PRODUCT_TYPE_QUERY = `
  query ProductTypeCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    ${PRODUCT_TYPES.map(
      (it, i) =>
        `t${i}: collection(handle: "${it.handle}") { handle image { url } products(first: 1) { nodes { featuredImage { url } } } }`,
    ).join('\n')}
  }
`;

type CollImg = {
  image?: {url: string} | null;
  products?: {nodes: Array<{featuredImage?: {url: string} | null}>};
} | null;

export async function loader({context}: Route.LoaderArgs) {
  const [
    {products},
    {collection: military},
    {collection: holiday},
    interestData,
    productTypeData,
  ] = await Promise.all([
    context.storefront.query(HOME_PRODUCTS_QUERY, {
      cache: context.storefront.CacheShort(),
    }),
    // "Notes Worth Saluting" product row — the military collection.
    context.storefront.query(HOME_COLLECTION_QUERY, {
      variables: {handle: 'military'},
      cache: context.storefront.CacheShort(),
    }),
    // Holiday Essentials tile image — a real product from the Christmas collection.
    context.storefront.query(HOME_COLLECTION_QUERY, {
      variables: {handle: 'christmas-holiday'},
      cache: context.storefront.CacheShort(),
    }),
    // "Shop by Interest" circle images.
    context.storefront.query<Record<string, CollImg>>(INTEREST_QUERY, {
      cache: context.storefront.CacheShort(),
    }),
    // "Shop by Product Type" square-tile images.
    context.storefront.query<Record<string, CollImg>>(PRODUCT_TYPE_QUERY, {
      cache: context.storefront.CacheShort(),
    }),
  ]);

  const holidayImage =
    holiday?.products?.nodes?.[0]?.featuredImage?.url ??
    holiday?.products?.nodes?.[0]?.images?.nodes?.[0]?.url ??
    null;

  const interests = INTERESTS.map((it, i) => {
    const c = interestData?.[`c${i}`];
    return {
      label: it.label,
      handle: it.handle,
      image:
        c?.image?.url ?? c?.products?.nodes?.[0]?.featuredImage?.url ?? null,
    };
  });

  const productTypes = PRODUCT_TYPES.map((it, i) => {
    const c = productTypeData?.[`t${i}`];
    return {
      label: it.label,
      handle: it.handle,
      image:
        c?.image?.url ?? c?.products?.nodes?.[0]?.featuredImage?.url ?? null,
    };
  });

  return {
    products: (products?.nodes ?? []).map((p: GraphqlProduct) =>
      graphqlToAppProduct(p),
    ),
    militaryProducts: (military?.products?.nodes ?? []).map((p: GraphqlProduct) =>
      graphqlToAppProduct(p),
    ),
    interests,
    productTypes,
    holidayImage,
  };
}

export default function HomePage() {
  const {products, militaryProducts, interests, productTypes, holidayImage} =
    useLoaderData<typeof loader>();
  return (
    <CatalogProvider products={products} collections={COLLECTIONS}>
      <main className="min-h-screen bg-[#FAF8F5]">
        {/* Order per Sydney: Hero → Best Sellers/Holiday → Shop by Interest →
            Founder's Welcome → value bar → quotes → Trending → Notes Worth
            Saluting → Shop by Product Type. */}
        <HeroSection />
        <Marquee />
        <TwoUpFeature holidayImage={holidayImage} />
        <DesignWall interests={interests} />
        <BrandStory />
        <ValueProps />
        <SocialProof />
        <TrendingPopular />
        <CollectionRow
          title="Notes Worth"
          scriptWord="Saluting"
          subtitle="Personalized military stationery honoring every branch of service"
          handle="military"
          products={militaryProducts}
          stars
        />
        <ShopByProductType productTypes={productTypes} />
      </main>
    </CatalogProvider>
  );
}

const HOME_PRODUCTS_QUERY = `#graphql
  query HomeProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 24, sortKey: BEST_SELLING) {
      nodes {
        id
        handle
        title
        descriptionHtml
        vendor
        productType
        tags
        featuredImage {
          url
          altText
          width
          height
        }
        images(first: 5) {
          nodes {
            url
            altText
          }
        }
        variants(first: 5) {
          nodes {
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
            }
            availableForSale
          }
        }
      }
    }
  }
` as const;

const HOME_COLLECTION_QUERY = `#graphql
  query HomeCollection($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: 12, sortKey: BEST_SELLING) {
        nodes {
          id
          handle
          title
          descriptionHtml
          vendor
          productType
          tags
          featuredImage { url altText width height }
          images(first: 2) { nodes { url altText } }
          variants(first: 3) {
            nodes {
              price { amount currencyCode }
              compareAtPrice { amount }
              availableForSale
            }
          }
        }
      }
    }
  }
` as const;
