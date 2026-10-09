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
import {useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {redirect, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  CartForm,
  ShopPayButton,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  graphqlToAppProduct,
  type GraphqlProduct,
} from '~/lib/shopify-transform';
import {VARIANT_PRESETS} from '~/lib/variants';
import {
  PersonalizationPanel,
  defaultPersonalizationValue,
  type PersonalizationValue,
} from '~/components/PersonalizationPanel';
import {JsonLd} from '~/components/JsonLd';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildSrcSet,
  productJsonLd,
} from '~/lib/seo';

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
  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
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

  return {product, appProduct, related};
}

/**
 * Per-product personalization overrides, keyed by product handle. Default (see
 * below) is name-only with a "Text" label. Add a handle here to re-enable the
 * monogram option or relabel, e.g.:
 *   'some-monogram-notecard-handle': {hideMonogram: false},
 */
const PDP_PERSONALIZATION_OVERRIDES: Record<
  string,
  {hideMonogram?: boolean; textLabel?: string}
> = {};

export default function ProductRoute() {
  const {product, appProduct, related} = useLoaderData<typeof loader>();

  const preset = VARIANT_PRESETS[appProduct.type];
  // Existing products are the classic shopping experience: the product photo
  // the customer clicked, plus a simple personalize form (name/text, font,
  // color). Changing the illustration lives only in the separate Product
  // Builder — never on an existing product page.
  const schema = preset.personalization;
  // Per-product personalization tweaks (keyed by handle). Sydney: most items are
  // name-only for now — monogram is opt-in per item — and the field reads "Text".
  // (Scale this via a Shopify tag/metafield once the monogram list is defined.)
  const pdpOverride = PDP_PERSONALIZATION_OVERRIDES[appProduct.slug] ?? {
    hideMonogram: true,
    textLabel: 'Text',
  };

  const [personalization, setPersonalization] = useState<PersonalizationValue>(
    () => {
      const base = schema
        ? defaultPersonalizationValue(schema)
        : {mode: 'name' as const, fontKey: '', inkKey: '', fields: {}};
      // When monogram is hidden, start in name mode so the live preview reads
      // the Text field (not the monogram letters).
      return pdpOverride.hideMonogram ? {...base, mode: 'name'} : base;
    },
  );
  const [selectedImage, setSelectedImage] = useState(0);
  // Rifle-style checkpoint: made-to-order + final sale means the customer
  // must explicitly approve their personalization before it can be purchased.
  const [proofApproved, setProofApproved] = useState(false);

  // Real Shopify variants (sizes, sheets, set quantities, …) + purchase qty.
  const variants = product.variants?.nodes ?? [];
  const optionGroups = (
    (product as {options?: {name: string; optionValues: {name: string}[]}[]})
      .options ?? []
  ).filter((o) => o.optionValues.length > 1 && o.name.toLowerCase() !== 'title');
  const firstVariant = product.selectedOrFirstAvailableVariant ?? variants[0];
  const [selOptions, setSelOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (firstVariant?.selectedOptions ?? []).map((o) => [o.name, o.value]),
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const selectedVariant =
    variants.find((v) =>
      v.selectedOptions.every((o) => selOptions[o.name] === o.value),
    ) ?? firstVariant;
  const variantId = selectedVariant?.id;
  const unitPrice = Number(selectedVariant?.price?.amount ?? appProduct.price);
  const rawCompareAt = Number(selectedVariant?.compareAtPrice?.amount ?? 0);
  const unitCompareAt = rawCompareAt > unitPrice ? rawCompareAt : undefined;
  const personalizable = !!schema;

  const lineAttributes = [
    ...(schema ? buildLineAttributes(personalization) : []),
    ...(personalizable
      ? [{key: '_Proof Approved', value: proofApproved ? 'Yes' : 'No'}]
      : []),
  ];

  // ── Structured data (JSON-LD) ──────────────────────────────────────────
  const productLd = productJsonLd({
    id: product.id,
    title: appProduct.title,
    description: appProduct.description,
    handle: appProduct.slug,
    images: appProduct.images,
    price: appProduct.price,
    // Personalized / made-to-order pieces are final sale + always makeable,
    // so schema stays InStock (never flags Out of Stock in Merchant listings).
    finalSale: personalizable,
    variants: (product.variants?.nodes ?? []).map((v) => ({
      sku: v.sku,
      price: Number(v.price?.amount ?? appProduct.price),
      availableForSale: v.availableForSale,
      selectedOptions: v.selectedOptions,
      title: v.title,
    })),
  });
  const breadcrumbs = [
    {name: 'Home', path: '/'},
    ...(related.title && related.handle
      ? [{name: related.title.replace(/ Collection$/i, ''), path: `/collections/${related.handle}`}]
      : [{name: 'Shop All', path: '/collections/all'}]),
    {name: appProduct.title},
  ];

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pt-4 pb-20">
      <JsonLd data={[productLd, breadcrumbJsonLd(breadcrumbs)]} />
      <div className="container max-w-7xl mx-auto px-4 lg:px-8">
        {/* Visible, semantic breadcrumb trail (mirrors the BreadcrumbList schema) */}
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-wider text-[#2D2D2D]/50 mb-6">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumbs.map((c, i) => (
              <li key={c.name} className="flex items-center gap-1.5">
                {c.path ? (
                  <a href={c.path} className="hover:text-[#C9A96E]">
                    {c.name}
                  </a>
                ) : (
                  <span className="text-[#2D2D2D]" aria-current="page">
                    {c.name}
                  </span>
                )}
                {i < breadcrumbs.length - 1 && <span aria-hidden>/</span>}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16">
          {/* LEFT: product photos — browsable with arrows + a thumbnail strip,
              sized so the thumbnails stay above the fold. */}
          <div className="md:sticky md:top-[120px] md:self-start">
            <div
              className="group relative overflow-hidden bg-white border border-[#C9A96E]/10 aspect-[4/5]"
              style={{maxHeight: 'calc(100vh - 300px)'}}
            >
              {appProduct.images[selectedImage] ? (
                <img
                  src={appProduct.images[selectedImage]}
                  srcSet={buildSrcSet(appProduct.images[selectedImage])}
                  sizes="(min-width: 1024px) 640px, 100vw"
                  alt={`${appProduct.title} — personalized ${appProduct.type} from The Winsome Life`}
                  width={640}
                  height={800}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#2D2D2D]/30 text-sm">
                  No image
                </div>
              )}

              {/* Prev / next — browse all photos without touching the thumbnails */}
              {appProduct.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(
                        (i) =>
                          (i - 1 + appProduct.images.length) %
                          appProduct.images.length,
                      )
                    }
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 ring-1 ring-[#C9A96E]/25 flex items-center justify-center text-[#2D2D2D] hover:bg-white shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage((i) => (i + 1) % appProduct.images.length)
                    }
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 ring-1 ring-[#C9A96E]/25 flex items-center justify-center text-[#2D2D2D] hover:bg-white shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="absolute bottom-3 right-3 font-sans text-[11px] tracking-wide text-[#2D2D2D]/50 bg-white/80 rounded-full px-2.5 py-0.5">
                    {selectedImage + 1} / {appProduct.images.length}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail strip — product photos */}
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {appProduct.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={`shrink-0 w-16 h-20 overflow-hidden border-2 bg-white transition-colors ${
                    selectedImage === i
                      ? 'border-[#C9A96E]'
                      : 'border-[#C9A96E]/15 hover:border-[#C9A96E]/40'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${appProduct.title} — view ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: buy box */}
          <div>
            {appProduct.badge && (
              <span className="inline-block bg-[#C9A96E]/15 text-[#8a6a3a] text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 mb-3">
                {appProduct.badge}
              </span>
            )}
            <h1 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] leading-tight mb-3">
              {appProduct.title}
            </h1>
            <p className="font-sans font-medium text-xl text-[#2D2D2D] mb-1">
              ${unitPrice.toFixed(2)}
              {unitCompareAt ? (
                <span className="ml-3 font-light text-base text-[#2D2D2D]/40 line-through">
                  ${unitCompareAt.toFixed(2)}
                </span>
              ) : null}
              {quantity > 1 ? (
                <span className="ml-3 font-light text-sm text-[#2D2D2D]/50">
                  · {quantity} × = ${(unitPrice * quantity).toFixed(2)}
                </span>
              ) : null}
            </p>
            <p className="font-sans font-light text-xs text-[#2D2D2D]/50 mb-6 flex items-center gap-1.5">
              <span className="text-[#C9A96E]">✦</span>
              Made to order in 5–7 business days · Free shipping over $75
            </p>

            {/* Full product description — never truncated (renders the complete
                merchant-authored body). */}
            {product.descriptionHtml ? (
              <div
                className="pdp-rte mb-8"
                dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
              />
            ) : (
              <p className="font-sans font-light text-sm text-[#2D2D2D]/70 leading-relaxed mb-8">
                {appProduct.description}
              </p>
            )}

            {/* Real Shopify variant options — size, sheets, set quantity, etc. */}
            {optionGroups.length > 0 && (
              <div className="mb-6 space-y-5">
                {optionGroups.map((opt) => (
                  <div key={opt.name}>
                    <div className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D] mb-2.5">
                      {opt.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {opt.optionValues.map((ov) => {
                        const active = selOptions[opt.name] === ov.name;
                        return (
                          <button
                            key={ov.name}
                            type="button"
                            onClick={() =>
                              setSelOptions((s) => ({...s, [opt.name]: ov.name}))
                            }
                            aria-pressed={active}
                            className={`px-4 py-2 text-sm font-sans border transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
                              active
                                ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white'
                                : 'border-[#C9A96E]/40 text-[#2D2D2D] hover:border-[#2D2D2D]'
                            }`}
                          >
                            {ov.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity — how many to add to cart */}
            <div className="mb-8">
              <div className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D] mb-2.5">
                Quantity
              </div>
              <div className="inline-flex items-center border border-[#C9A96E]/40 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="px-4 py-2 text-lg text-[#2D2D2D] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  aria-label="Quantity"
                  className="w-14 text-center border-x border-[#C9A96E]/40 py-2 text-sm font-medium text-[#2D2D2D] tabular-nums outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="px-4 py-2 text-lg text-[#2D2D2D] hover:bg-[#FAF8F5]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Personalize — classic form: name/text, font, color */}
            {schema && (
              <div className="mb-6">
                <PersonalizationPanel
                  schema={schema}
                  value={personalization}
                  onChange={setPersonalization}
                  hideMonogram={pdpOverride.hideMonogram}
                  textLabel={pdpOverride.textLabel}
                />
              </div>
            )}

            {/* Review & approve — the made-to-order checkpoint. The customer's
                approval is what lets production print without a designer pass. */}
            {personalizable && (
              <label className="flex items-start gap-3 mb-4 p-4 bg-white border border-[#C9A96E]/25 rounded-sm cursor-pointer hover:border-[#C9A96E]/60 transition-colors">
                <input
                  type="checkbox"
                  checked={proofApproved}
                  onChange={(e) => setProofApproved(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A96E]"
                />
                <span className="font-sans font-light text-[13px] text-[#2D2D2D]/75 leading-relaxed">
                  <span className="font-medium text-[#2D2D2D]">
                    I&rsquo;ve reviewed my personalization and approve this
                    design.
                  </span>{' '}
                  Personalized pieces are made to order exactly as shown and
                  cannot be changed or returned after checkout.
                </span>
              </label>
            )}

            {/* Add to Cart with Shopify line item properties */}
            <CartForm
              route="/cart"
              inputs={{
                lines: [
                  {
                    merchandiseId: variantId ?? '',
                    quantity,
                    attributes: lineAttributes,
                  },
                ],
              }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <button
                  type="submit"
                  disabled={
                    !variantId ||
                    (personalizable && !proofApproved) ||
                    fetcher.state !== 'idle'
                  }
                  className="w-full bg-[#2D2D2D] text-white font-sans font-medium text-sm tracking-[0.15em] uppercase py-4 hover:bg-[#C9A96E] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetcher.state !== 'idle'
                    ? 'Adding…'
                    : personalizable && !proofApproved
                      ? 'Approve Your Design Above'
                      : 'Add to Cart'}
                </button>
              )}
            </CartForm>

            {/* Express checkout skips cart line attributes, which would strip
                the personalization from a final-sale order — only offer it on
                non-personalized products. */}
            {variantId && !personalizable && (
              <div className="mt-3 flex justify-center">
                <ShopPayButton
                  width="100%"
                  variantIdsAndQuantities={[{id: variantId, quantity: 1}]}
                  storeDomain={'mock.shop'}
                />
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/15">
              <h3 className="font-sans font-medium text-xs tracking-[0.2em] uppercase text-[#2D2D2D] mb-3">
                Details
              </h3>
              <ul className="space-y-1.5">
                {appProduct.details.slice(0, 6).map((d, i) => (
                  <li
                    key={i}
                    className="font-sans font-light text-sm text-[#2D2D2D]/70 flex gap-2"
                  >
                    <span className="text-[#C9A96E] mt-0.5">·</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* (Full description now lives in the buy box above, so no duplicate
            "Product Details" section here.) */}

        {/* More designs — every sibling in this product's collection, so the
            customer can browse all the variations of what they clicked. */}
        {related.products.length > 0 && (
          <section className="mt-20 lg:mt-28 pt-12 border-t border-[#C9A96E]/15">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="font-sans font-medium text-[11px] tracking-[0.3em] uppercase text-[#C9A96E] mb-2">
                  More like this
                </p>
                <h2 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D]">
                  {related.title
                    ? related.title.replace(/ Collection$/i, '')
                    : 'Related designs'}
                </h2>
              </div>
              {related.handle && (
                <Link
                  to={`/collections/${related.handle}`}
                  className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#C9A96E] hover:text-[#2D2D2D] transition-colors whitespace-nowrap"
                >
                  View all →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5">
              {related.products.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-white ring-1 ring-[#C9A96E]/12 group-hover:ring-[#C9A96E]/50 transition-all">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-contain p-2.5 transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#2D2D2D]/25 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-[13px] text-[#2D2D2D] leading-snug mt-2.5 line-clamp-2 group-hover:text-[#C9A96E] transition-colors">
                    {p.title}
                  </h3>
                  <p className="font-sans text-xs text-[#2D2D2D]/55 mt-0.5">
                    {p.type === 'notecard' ||
                    p.type === 'gift-tag' ||
                    p.type === 'wine-tag'
                      ? `From $${p.price.toFixed(2)}`
                      : `$${p.price.toFixed(2)}`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount ?? '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id ?? '',
              variantTitle: selectedVariant?.title ?? '',
              quantity: 1,
            },
          ],
        }}
      />
    </main>
  );
}

/**
 * Serialize the personalization payload into Shopify cart line attributes.
 * These appear in the cart UI (prefixed with "_" to hide them from buyers),
 * survive into checkout, and land on the order so the production team has
 * the structured data they need to fulfill.
 */
function buildLineAttributes(p: PersonalizationValue) {
  const attrs: Array<{key: string; value: string}> = [];
  if (p.mode) attrs.push({key: '_Personalization Mode', value: p.mode});
  if (p.monogramStyleKey)
    attrs.push({key: '_Monogram Style', value: p.monogramStyleKey});
  if (p.fontKey) attrs.push({key: '_Font', value: p.fontKey});
  if (p.inkKey) attrs.push({key: '_Ink Color', value: p.inkKey});
  for (const [k, v] of Object.entries(p.fields ?? {})) {
    if (v) attrs.push({key: `_${k}`, value: String(v)});
  }
  return attrs;
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
      featuredImage { url altText width height }
      images(first: 100) {
        nodes { url altText }
      }
      variants(first: 50) {
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
