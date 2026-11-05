/**
 * Product Detail Page — Hydrogen + Winsome brand UI.
 *
 * Loader fetches the product via Storefront GraphQL, then renders the
 * brand PDP shell: product photo gallery on the left, buy-box on the right
 * with the classic PersonalizationPanel (name/text, font, color) and Add to
 * Cart. Existing products are the classic shopping experience — the design is
 * fixed; only personalization (not the illustration) is customer-editable.
 * That lives in the separate Product Builder. Personalization values are
 * serialized into Shopify cart line item properties so they survive into
 * checkout + the order detail.
 */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {getSelectedProductOptions} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  EXTRA_ITEM_FEE_PRODUCT_HANDLE,
  EXTRA_PHOTO_FEE_PRODUCT_HANDLE,
  PHOTO_FEE_PRODUCT_HANDLE,
  PROOF_PRODUCT_HANDLE,
  ENVELOPE_LINER_PRODUCT_HANDLE,
} from '~/lib/addons';
import {stampUploadedFiles} from '~/lib/uploads.server';
import {parseHiddenStandard, questionsToFields} from '~/lib/personalization-questions';
import {
  graphqlToAppProduct,
  type GraphqlProduct,
} from '~/lib/shopify-transform';
import {TEXT_LIMIT} from '~/lib/variants';
import {ProductView} from '~/components/ProductView';
import {
  SET_ACCESSORIES_COLLECTION,
  findSet,
  type SetCardProduct,
} from '~/lib/matching-sets';
import {absoluteUrl} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) => {
  const title = `${data?.product?.title ?? 'Product'} | The Winsome Life`;
  const description =
    data?.product?.seo?.description ||
    data?.appProduct?.description ||
    'Personalized luxury stationery, made to order.';
  return [
    {title},
    {name: 'description', content: description},
    // Canonical points at the clean parent product URL, so customizer state
    // (name, font, illustration — all client-side React state, never query
    // params) can never spawn indexable duplicate variations.
    {
      tagName: 'link',
      rel: 'canonical',
      href: absoluteUrl(`/products/${data?.product?.handle}`),
    },
    {property: 'og:type', content: 'product'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    ...(data?.appProduct?.images?.[0]
      ? [{property: 'og:image', content: absoluteUrl(data.appProduct.images[0])}]
      : []),
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Error('Expected product handle');

  const {storefront} = context;
  // Background: put order numbers on files customers uploaded (see uploads.server).
  context.waitUntil?.(stampUploadedFiles(context.env));
  const [{product}, proofData, photoFeeData, extraFeeData, extraPhotoFeeData, linerData] =
    await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // The paid proof add-on is its own Shopify product; if it isn't set up
    // (or isn't on this sales channel) the option simply doesn't show.
    storefront
      .query(PROOF_PRODUCT_QUERY, {variables: {handle: PROOF_PRODUCT_HANDLE}})
      .catch(() => null),
    // Same for the custom photo charge (own pet photo instead of a breed).
    storefront
      .query(PROOF_PRODUCT_QUERY, {variables: {handle: PHOTO_FEE_PRODUCT_HANDLE}})
      .catch(() => null),
    // And the charge for each extra pet (a second or third cat).
    storefront
      .query(PROOF_PRODUCT_QUERY, {variables: {handle: EXTRA_ITEM_FEE_PRODUCT_HANDLE}})
      .catch(() => null),
    // And each photo beyond those included on a photo card ($12 each).
    storefront
      .query(PROOF_PRODUCT_QUERY, {variables: {handle: EXTRA_PHOTO_FEE_PRODUCT_HANDLE}})
      .catch(() => null),
    // And envelope liners, charged per card when the customer adds them.
    storefront
      .query(PROOF_PRODUCT_QUERY, {variables: {handle: ENVELOPE_LINER_PRODUCT_HANDLE}})
      .catch(() => null),
  ]);
  if (!product?.id) throw new Response(null, {status: 404});

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const appProduct = graphqlToAppProduct(product as unknown as GraphqlProduct);

  // "More like this" — sibling designs from the product's first collection.
  const collection = product.collections?.nodes?.[0];
  const related = {
    title: collection?.title ?? '',
    handle: collection?.handle ?? '',
    products: (collection?.products?.nodes ?? [])
      .filter((p: {handle: string}) => p.handle !== product.handle)
      .slice(0, 12)
      .map((p) => graphqlToAppProduct(p as unknown as GraphqlProduct)),
  };

  const proofVariant = proofData?.product?.variants?.nodes?.[0];
  const proof =
    proofVariant?.availableForSale && handle !== PROOF_PRODUCT_HANDLE
      ? {variantId: proofVariant.id, price: Number(proofVariant.price.amount)}
      : null;
  const photoFeeVariant = photoFeeData?.product?.variants?.nodes?.[0];
  const photoFee = photoFeeVariant?.availableForSale
    ? {variantId: photoFeeVariant.id, price: Number(photoFeeVariant.price.amount)}
    : null;
  const extraFeeVariant = extraFeeData?.product?.variants?.nodes?.[0];
  const extraFee = extraFeeVariant?.availableForSale
    ? {variantId: extraFeeVariant.id, price: Number(extraFeeVariant.price.amount)}
    : null;
  const extraPhotoFeeVariant = extraPhotoFeeData?.product?.variants?.nodes?.[0];
  const extraPhotoFee = extraPhotoFeeVariant?.availableForSale
    ? {variantId: extraPhotoFeeVariant.id, price: Number(extraPhotoFeeVariant.price.amount)}
    : null;
  const linerVariant = linerData?.product?.variants?.nodes?.[0];
  const envelopeLiner = linerVariant?.availableForSale
    ? {variantId: linerVariant.id, price: Number(linerVariant.price.amount)}
    : null;

  // This product's own questions, managed in Shopify admin. While the
  // product's "Personalization questions draft" switch is on they only show
  // on review links (?drafts=1), so Sydney can approve them before customers
  // see them.
  const isDraft = product.personalizationDraft?.value === 'true';
  const showDrafts = new URL(request.url).searchParams.has('drafts');
  const useOwnSetup = !isDraft || showDrafts;
  // Changes to a live product's questions are staged in its "Personalization
  // questions (draft list)" field, which only review links use; publishing
  // copies it over the live list.
  const draftList = showDrafts
    ? product.personalizationQuestionsDraft?.references?.nodes
    : undefined;
  const extraQuestions = !useOwnSetup ? [] : questionsToFields(
    (draftList?.length
      ? draftList
      : product.personalizationQuestions?.references?.nodes) as
      | Parameters<typeof questionsToFields>[0]
      | undefined,
  );
  // Standard questions this product skips ("Hide standard questions"), e.g.
  // state cards ask only for colors. Held back with the draft too, so a
  // product never loses its standard questions before its own go live.
  const hidden = useOwnSetup
    ? parseHiddenStandard(
        (showDrafts && product.personalizationHideDraft?.value) ||
          product.personalizationHide?.value,
      )
    : [];

  // Per-product Text box tweaks ("Text box length" / "Text box label").
  const textLength = useOwnSetup
    ? // Sydney: every Text box has room for as much as customers want.
      Math.max(Number(product.personalizationTextLength?.value) || 0, TEXT_LIMIT)
    : undefined;
  const textLabel = useOwnSetup
    ? ((showDrafts && product.personalizationTextLabelDraft?.value) ||
        product.personalizationTextLabel?.value)?.trim() || undefined
    : undefined;
  // "Font picker label", e.g. "Font for Name".
  const fontLabel = useOwnSetup
    ? ((showDrafts && product.personalizationFontLabelDraft?.value) ||
        product.personalizationFontLabel?.value)?.trim() || undefined
    : undefined;
  // This product's own note under the Name & Return Address box, if any.
  const returnAddressHelp = useOwnSetup
    ? product.personalizationReturnAddressHelp?.value?.trim() || undefined
    : undefined;
  const textHelp = useOwnSetup
    ? product.personalizationTextHelp?.value?.trim() || undefined
    : undefined;

  // Complete the set (pilot): the other pieces of this product's matching
  // design, plus a few gift-tag accessories. Never blocks the page.
  const set = findSet(handle);
  const setData = set
    ? await storefront
        .query<Record<string, SetQueryProduct | null> & {acc?: {products: {nodes: SetQueryProduct[]}} | null}>(
            setQuery(set.others.map((o) => o.handle)),
            {cache: storefront.CacheShort()},
          )
        .catch(() => null)
    : null;
  const toCard = (p: SetQueryProduct | null | undefined, label: string) =>
    p
      ? {
          handle: p.handle,
          title: p.title,
          label,
          image: p.featuredImage?.url ?? null,
          price: Number(p.priceRange.minVariantPrice.amount),
        }
      : null;
  const setMatches = set
    ? set.others
        .map((o, i) => toCard(setData?.[`m${i}`], o.label))
        .filter((c): c is SetCardProduct => Boolean(c))
    : [];
  const setAccessories = set
    ? (setData?.acc?.products.nodes ?? [])
        .map((p) => toCard(p, 'Gift Tags'))
        .filter((c): c is SetCardProduct => Boolean(c))
    : [];
  const setLabel = set?.self.label ?? '';

  return {
    setMatches,
    setAccessories,
    setLabel,
    product,
    appProduct,
    related,
    proof,
    photoFee,
    extraFee,
    extraPhotoFee,
    envelopeLiner,
    extraQuestions,
    hidden,
    textLength,
    textLabel,
    fontLabel,
    textHelp,
    returnAddressHelp,
    // A link to a specific option (?Size=…) keeps it; otherwise sets start
    // at 10 + Blank Envelopes.
    // (Review links add ?drafts=1, which isn't a product option.)
    optionsInUrl: getSelectedProductOptions(request).some(
      (o) => o.name !== 'drafts',
    ),
  };
}


export default function ProductRoute() {
  const data = useLoaderData<typeof loader>();
  return <ProductView data={data} />;
}

type SetQueryProduct = {
  handle: string;
  title: string;
  featuredImage: {url: string} | null;
  priceRange: {minVariantPrice: {amount: string}};
};

const SET_PRODUCT_FIELDS = `handle title featuredImage { url } priceRange { minVariantPrice { amount } }`;

function setQuery(handles: string[]) {
  return `
    query CompleteTheSet($country: CountryCode, $language: LanguageCode)
      @inContext(country: $country, language: $language) {
      ${handles
        .map((h, i) => `m${i}: product(handle: ${JSON.stringify(h)}) { ${SET_PRODUCT_FIELDS} }`)
        .join('\n')}
      acc: collection(handle: ${JSON.stringify(SET_ACCESSORIES_COLLECTION)}) {
        products(first: 3, sortKey: BEST_SELLING) { nodes { ${SET_PRODUCT_FIELDS} } }
      }
    }
  `;
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice { amount currencyCode }
    id
    image { __typename id url altText width height }
    price { amount currencyCode }
    product { title handle }
    selectedOptions { name value }
    sku
    title
  }
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      vendor
      handle
      descriptionHtml
      description
      productType
      tags
      options { name optionValues { name } }
      personalizationTextLength: metafield(namespace: "winsome", key: "personalization_text_length") {
        value
      }
      personalizationTextLabel: metafield(namespace: "winsome", key: "personalization_text_label") {
        value
      }
      personalizationReturnAddressHelp: metafield(namespace: "winsome", key: "personalization_return_address_help") {
        value
      }
      personalizationTextHelp: metafield(namespace: "winsome", key: "personalization_text_help") {
        value
      }
      personalizationHideDraft: metafield(namespace: "winsome", key: "personalization_hide_draft") {
        value
      }
      personalizationTextLabelDraft: metafield(namespace: "winsome", key: "personalization_text_label_draft") {
        value
      }
      personalizationFontLabel: metafield(namespace: "winsome", key: "personalization_font_label") {
        value
      }
      personalizationFontLabelDraft: metafield(namespace: "winsome", key: "personalization_font_label_draft") {
        value
      }
      personalizationHide: metafield(namespace: "winsome", key: "personalization_hide") {
        value
      }
      personalizationDraft: metafield(namespace: "winsome", key: "personalization_draft") {
        value
      }
      personalizationQuestions: metafield(namespace: "winsome", key: "personalization_questions") {
        references(first: 30) {
          nodes {
            ... on Metaobject {
              fields {
                key
                value
                references(first: 150) {
                  nodes { ... on MediaImage { image { url } } }
                }
              }
            }
          }
        }
      }
      personalizationQuestionsDraft: metafield(namespace: "winsome", key: "personalization_questions_draft") {
        references(first: 30) {
          nodes {
            ... on Metaobject {
              fields {
                key
                value
                references(first: 150) {
                  nodes { ... on MediaImage { image { url } } }
                }
              }
            }
          }
        }
      }
      featuredImage { url altText width height }
      images(first: 100) {
        nodes { url altText }
      }
      variants(first: 250) {
        nodes {
          ...ProductVariant
          compareAtPrice { amount }
        }
      }
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...ProductVariant
      }
      seo { description title }
      collections(first: 1) {
        nodes {
          title
          handle
          products(first: 13) {
            nodes { ...RelatedProduct }
          }
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
  fragment RelatedProduct on Product {
    id
    handle
    title
    productType
    tags
    featuredImage { url altText }
    images(first: 1) { nodes { url altText } }
    variants(first: 1) {
      nodes {
        price { amount }
        compareAtPrice { amount }
        availableForSale
      }
    }
  }
` as const;

const PROOF_PRODUCT_QUERY = `#graphql
  query ProofProduct(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      variants(first: 1) {
        nodes { id availableForSale price { amount } }
      }
    }
  }
` as const;
