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
import GiftGuideTeaser from '~/components/GiftGuideTeaser';
import {loadRecipients} from '~/lib/gift-guide';
import PetsSection, {type PetProduct} from '~/components/PetsSection';
import Marquee from '~/components/Marquee';
import ShopByProductType from '~/components/ShopByProductType';
import BrandStory from '~/components/BrandStory';
import ValueProps from '~/components/ValueProps';
import SocialProof from '~/components/SocialProof';
import {absoluteUrl, SITE_URL} from '~/lib/seo';

export const meta: Route.MetaFunction = () => {
  const title = 'The Winsome Life | Luxury Personalized Stationery';
  const description =
    'Luxury personalized stationery designed to be treasured. Watercolor notecards, monogram gifts, custom notepads, and bespoke gift sets — crafted with care.';
  const ogImage =
    'https://caatee-kr.myshopify.com/cdn/shop/files/Winsome_Banner_01_13972622-0426-4773-b922-928098ab2bda.png?width=1200';
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: absoluteUrl('/')},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'The Winsome Life'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: SITE_URL},
    {property: 'og:image', content: ogImage},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: ogImage},
  ];
};

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
    {collection: pets},
    recipients,
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
    // "For the Love of Dogs & Cats" section — the Dogs & Cats collection.
    context.storefront.query(HOME_COLLECTION_QUERY, {
      variables: {handle: 'dogs'},
      cache: context.storefront.CacheShort(),
    }),
    // Holiday Gift Guide teaser circles (replaced "Shop by Interest").
    loadRecipients(context.storefront as never),
    // "Shop by Product Type" square-tile images.
    context.storefront.query<Record<string, CollImg>>(PRODUCT_TYPE_QUERY, {
      cache: context.storefront.CacheShort(),
    }),
  ]);

  const petProducts: PetProduct[] = (pets?.products?.nodes ?? []).map((p) => {
    const prices = (p.variants?.nodes ?? [])
      .map((v) => Number(v.price?.amount))
      .filter((n) => n > 0);
    return {
      handle: p.handle,
      title: p.title,
      image: p.featuredImage?.url ?? p.images?.nodes?.[0]?.url ?? null,
      price: prices.length ? Math.min(...prices) : null,
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
    recipients,
    productTypes,
    petProducts,
  };
}

export default function HomePage() {
  const {products, militaryProducts, recipients, productTypes, petProducts} =
    useLoaderData<typeof loader>();
  return (
    <CatalogProvider products={products} collections={COLLECTIONS}>
      <main className="min-h-screen bg-[#FAF8F5]">
        {/* Order per Sydney: Hero → Best Sellers/Holiday → reviews → Holiday
            Gift Guide → Founder's Welcome → value bar → Trending → Notes Worth
            Saluting → Shop by Product Type. Trending was replaced by Dogs & Cats. */}
        <HeroSection />
        <Marquee />
        <TwoUpFeature />
        <SocialProof />
        <GiftGuideTeaser recipients={recipients} />
        <BrandStory />
        <ValueProps />
        <PetsSection products={petProducts} />
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
    products(first: 24, sortKey: BEST_SELLING, query: "tag_not:add-on") {
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
