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
import {useMemo, useState} from 'react';
import {ChevronDown, ChevronLeft, ChevronRight} from 'lucide-react';
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
  EXTRA_ITEM_FEE_PRODUCT_HANDLE,
  PHOTO_FEE_PRODUCT_HANDLE,
  PROOF_PRODUCT_HANDLE,
} from '~/lib/addons';
import {stampUploadedFiles} from '~/lib/uploads.server';
import {
  parseHiddenStandard,
  questionsToFields,
} from '~/lib/personalization-questions';
import {
  graphqlToAppProduct,
  type GraphqlProduct,
} from '~/lib/shopify-transform';
import {
  VARIANT_PRESETS,
  sortByFieldGroup,
  type PersonalizationField,
  type PersonalizationSchema,
} from '~/lib/variants';
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
  // Background: put order numbers on files customers uploaded (see uploads.server).
  context.waitUntil?.(stampUploadedFiles(context.env));
  const [{product}, proofData, photoFeeData, extraFeeData] = await Promise.all([
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
    ? // Sydney: every Text box takes at least 150 characters.
      Math.max(Number(product.personalizationTextLength?.value) || 0, 150)
    : undefined;
  const textLabel = useOwnSetup
    ? ((showDrafts && product.personalizationTextLabelDraft?.value) ||
        product.personalizationTextLabel?.value)?.trim() || undefined
    : undefined;
  // This product's own note under the Name & Return Address box, if any.
  const returnAddressHelp = useOwnSetup
    ? product.personalizationReturnAddressHelp?.value?.trim() || undefined
    : undefined;
  const textHelp = useOwnSetup
    ? product.personalizationTextHelp?.value?.trim() || undefined
    : undefined;

  return {
    product,
    appProduct,
    related,
    proof,
    photoFee,
    extraFee,
    extraQuestions,
    hidden,
    textLength,
    textLabel,
    textHelp,
    returnAddressHelp,
    // A link to a specific option (?Size=…) keeps it; otherwise sets start
    // at 10 + Blank Envelopes.
    optionsInUrl: getSelectedProductOptions(request).length > 0,
  };
}


/**
 * Per-product personalization overrides, keyed by product handle. Default (see
 * below) is name-only with a "Text" label. Add a handle here to re-enable the
 * monogram option or relabel, e.g.:
 *   'some-monogram-notecard-handle': {hideMonogram: false},
 * A product's own questions (e.g. where the illustration sits) live in
 * Shopify admin — see app/lib/personalization-questions.ts.
 */
const PDP_PERSONALIZATION_OVERRIDES: Record<
  string,
  {hideMonogram?: boolean; textLabel?: string}
> = {};

/** The live site's optional catch-all, on every personalized product. */
const ADDITIONAL_INSTRUCTIONS_FIELD: PersonalizationField = {
  key: 'Additional Instructions',
  label:
    'Any additional personalization instructions? (if nothing, leave blank or type n/a)',
  type: 'longtext',
  maxLength: 300,
  placeholder: '',
  group: 'notes',
};

/** The live site's envelope field. It appears (required) only once the
 *  customer picks a return-address variant (e.g. "10 + Return Address"). */
const RETURN_ADDRESS_FIELD: PersonalizationField = {
  key: 'Name & Return Address',
  label: 'Name & Return Address',
  type: 'longtext',
  maxLength: 200,
  placeholder: '',
  group: 'return-address',
  helpText:
    'Exactly as you want it printed on the back of the envelope. Printed in the same font and color as your card unless you note otherwise.',
};

export default function ProductRoute() {
  const {
    product,
    appProduct,
    related,
    proof,
    photoFee,
    extraFee,
    extraQuestions,
    hidden,
    textLength,
    textLabel,
    textHelp,
    returnAddressHelp,
    optionsInUrl,
  } = useLoaderData<typeof loader>();
  const hideInstructions = hidden.includes('Additional instructions');

  const preset = VARIANT_PRESETS[appProduct.type];
  // Existing products are the classic shopping experience: the product photo
  // the customer clicked, plus a simple personalize form (name/text, font,
  // color). Changing the illustration lives only in the separate Product
  // Builder — never on an existing product page.
  const schema = preset.personalization;
  // Per-product personalization tweaks (keyed by handle). Sydney: most items are
  // name-only for now — monogram is opt-in per item — and the field reads "Text".
  // (Scale this via a Shopify tag/metafield once the monogram list is defined.)
  const pdpOverride = {
    hideMonogram: true,
    textLabel: 'Text',
    ...PDP_PERSONALIZATION_OVERRIDES[appProduct.slug],
    ...(textLabel ? {textLabel} : {}),
  };

  const [personalization, setPersonalization] = useState<PersonalizationValue>(
    () => {
      const base = schema
        ? defaultPersonalizationValue(schema)
        : {mode: 'name' as const, fontKey: '', inkKey: '', fields: {}};
      // Start blank — empty Text box (font samples read "Sample Text"), no font,
      // ink or choices picked — so the customer makes every choice.
      // When monogram is hidden, start in name mode with no stray letters.
      return pdpOverride.hideMonogram
        ? {...base, mode: 'name', fontKey: '', inkKey: '', fields: {text: ''}}
        : {...base, fontKey: '', inkKey: '', fields: {...base.fields, text: ''}};
    },
  );
  // A yes/no question like "Do you want to add additional text?" (business
  // logo cards): until it's answered Yes, the Text, Font and Text Color
  // questions stay hidden.
  const textGate = extraQuestions.find((f) => f.revealsText);
  const textOff = !!textGate && personalization.fields[textGate.key] !== 'Yes';
  const hideText = hidden.includes('Text') || textOff;
  const hideFont = hidden.includes('Font') || textOff;
  const hideInk =
    hidden.includes('Text Color') || hidden.includes('Ink Color') || textOff;
  const [selectedImage, setSelectedImage] = useState(0);
  // Add to Cart stays clickable; a click with required info missing shows
  // what's still needed instead of adding to the cart.
  const [triedAddToCart, setTriedAddToCart] = useState(false);
  // Rifle-style checkpoint: made-to-order + final sale means the customer
  // must explicitly approve their personalization before it can be purchased.
  // The customer either approves the personalization details, or pays for a full
  // proof (emailed within 2 business days) and approves from that email.
  const [approvalChoice, setApprovalChoice] = useState<'' | 'approve' | 'proof'>('');
  const proofApproved = approvalChoice === 'approve';
  const wantsProof = !!proof && approvalChoice === 'proof';

  // Real Shopify variants (sizes, sheets, set quantities, …) + purchase qty.
  const variants = product.variants?.nodes ?? [];
  const optionGroups = (
    (product as {options?: {name: string; optionValues: {name: string}[]}[]})
      .options ?? []
  )
    .filter((o) => o.optionValues.length > 1 && o.name.toLowerCase() !== 'title')
    .map((o) => ({...o, optionValues: sortSetValues(o.optionValues)}));
  // Sydney: sets start at 10 + Blank Envelopes rather than the smallest.
  const defaultVariant = optionsInUrl
    ? undefined
    : variants.find((v) =>
        v.selectedOptions.some((o) => /^\s*10\s*\+\s*blank/i.test(o.value)),
      );
  const firstVariant =
    defaultVariant ?? product.selectedOrFirstAvailableVariant ?? variants[0];
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
  // Items sold in sets ("Quantity: 10 + Return Address") get "Number of
  // Sets" instead of a second "Quantity", so it's clear 2 means 2 × 10.
  const setSize = (() => {
    const option = (selectedVariant?.selectedOptions ?? []).find((o) =>
      /quantity|qty|pack|set/i.test(o.name),
    );
    const n = Number(option?.value.match(/^\s*(\d+)/)?.[1]);
    return n > 1 ? n : null;
  })();
  const unitPrice = Number(selectedVariant?.price?.amount ?? appProduct.price);
  const rawCompareAt = Number(selectedVariant?.compareAtPrice?.amount ?? 0);
  const unitCompareAt = rawCompareAt > unitPrice ? rawCompareAt : undefined;
  const personalizable = !!schema;

  // The schema this product actually shows: its preset fields, plus its own
  // extra questions, plus the envelope return address when the product sells
  // return-address printing.
  // A variant prints return addresses when its value says so ("10 + Return
  // Address") or it answers a return-address option with Yes ("Return
  // Address on Back of Envelope: Yes").
  const printsReturnAddress = (o: {name: string; value: string}) =>
    /return address/i.test(o.value) ||
    (/return address/i.test(o.name) && /^yes\b/i.test(o.value));
  const wantsReturnAddress = (selectedVariant?.selectedOptions ?? []).some(
    printsReturnAddress,
  );
  // Questions asked once per pet ("Cat 1: Cat Breed", "Cat 2: Cat Breed")
  // once the customer says how many.
  const productQuestions = useMemo(
    () => repeatPerItem(extraQuestions, personalization.fields),
    [extraQuestions, personalization.fields],
  );
  const activeSchema = useMemo(
    () =>
      schema && {
        ...schema,
        fields: [
          // Blank boxes (no sample text) — Sydney found it confusing.
          ...schema.fields
            .filter((f) => !(hideText && isTextField(f)))
            .map((f) => ({
              ...f,
              placeholder: '',
              ...(textLength && f.key === 'text' ? {maxLength: textLength} : {}),
              ...(textHelp && f.key === 'text' ? {helpText: textHelp} : {}),
            })),
          // Follow-up questions appear once their lead question is answered
          // to match (e.g. the breed list after "Choose a breed"); without
          // the lead question on this product they always show.
          ...productQuestions.filter(
            (f) =>
              !f.showWhen ||
              !productQuestions.some((g) => g.key === f.showWhen?.key) ||
              personalization.fields[f.showWhen.key] === f.showWhen.value,
          ),
          ...(hideInstructions ? [] : [ADDITIONAL_INSTRUCTIONS_FIELD]),
          // Only once the customer picks envelopes with a printed return address.
          ...(wantsReturnAddress
            ? [
                {
                  ...RETURN_ADDRESS_FIELD,
                  required: true,
                  ...(returnAddressHelp ? {helpText: returnAddressHelp} : {}),
                },
              ]
            : []),
        ],
      },
    [
      schema,
      productQuestions,
      hideText,
      hideInstructions,
      textLength,
      textHelp,
      returnAddressHelp,
      wantsReturnAddress,
      personalization.fields,
    ],
  );

  // e.g. a card whose only question is the return address, with blank
  // envelopes picked: nothing to ask, so no empty panel.
  const panelHasQuestions =
    !hideFont ||
    !hideInk ||
    (activeSchema?.fields ?? []).some(
      (f) => f.type !== 'monogram-letters' || !pdpOverride.hideMonogram,
    );
  // Nothing personalized (e.g. blank envelopes on a return-address-only
  // card) → nothing to approve or proof.
  const needsApproval = personalizable && panelHasQuestions;
  const addProof = needsApproval && wantsProof;

  const shownFields = activeSchema?.fields ?? [];
  const answered = (f: PersonalizationField) =>
    Boolean((personalization.fields[f.key] ?? '').trim());
  // Either/or questions (e.g. Dog Breed / Upload Your Own Photo): answering
  // one covers both.
  const partnerOf = (f: PersonalizationField) =>
    shownFields.find(
      (g) =>
        g.key !== f.key && (g.key === f.alternativeTo || g.alternativeTo === f.key),
    );
  // Listed in page order: text, font, ink color, then the extra questions.
  const isMissing = (f: PersonalizationField) => {
    if (!f.required) return false;
    if (f.key === 'text' && personalization.mode === 'monogram') return false;
    if (f.type === 'monogram-letters' && personalization.mode !== 'monogram')
      return false;
    const partner = partnerOf(f);
    return !answered(f) && !(partner && answered(partner));
  };
  const plainLabel = (f: PersonalizationField) =>
    f.key === 'text'
      ? pdpOverride.textLabel ?? f.label
      : f.label.replace(/\s*\(.*\)$/, '');
  // An either/or pair is listed once: "Dog Breed or Upload Your Own Photo".
  const fieldLabel = (f: PersonalizationField) => {
    const partner = partnerOf(f);
    if (!partner) return plainLabel(f);
    const [a, b] = sortByFieldGroup([f, partner]);
    return `${plainLabel(a)} or ${plainLabel(b)}`;
  };
  // Add-on charges: the custom photo charge once per order however many
  // photos are uploaded (Sydney), and one additional pet charge per pet
  // after the first.
  const photoCount =
    photoFee && shownFields.some((f) => f.type === 'upload' && f.photoFee && answered(f))
      ? 1
      : 0;
  const extraCount = extraFee
    ? shownFields
        .filter((f) => f.extraFee)
        .reduce((n, f) => n + Math.max(0, itemCount(personalization.fields[f.key]) - 1), 0)
    : 0;
  const addOns = [
    ...(photoFee && photoCount
      ? [{...photoFee, quantity: photoCount, label: 'custom photo'}]
      : []),
    ...(extraFee && extraCount
      ? [{...extraFee, quantity: extraCount, label: extraCount > 1 ? 'additional pets' : 'additional pet'}]
      : []),
  ];
  const addOnTotal = addOns.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const missingInfo = !personalizable
    ? []
    : [
        ...shownFields.filter(isTextField).filter(isMissing).map(fieldLabel),
        ...(hideFont || personalization.fontKey ? [] : ['Font']),
        ...(hideInk || personalization.inkKey ? [] : ['Text Color']),
        ...new Set(
          sortByFieldGroup(shownFields.filter((f) => !isTextField(f)))
            .filter(isMissing)
            .map(fieldLabel),
        ),
        ...(needsApproval && !proofApproved && !wantsProof
          ? [
              proof
                ? 'Before We Print: approve your design or choose a proof'
                : 'Approve your design',
            ]
          : []),
      ];

  const lineAttributes = [
    ...(activeSchema
      ? buildLineAttributes(
          // Text picked before answering No doesn't go on the order.
          textOff
            ? {...personalization, fontKey: '', inkKey: '', fields: {...personalization.fields, text: ''}}
            : personalization,
          activeSchema,
          pdpOverride.textLabel,
        )
      : []),
    ...(needsApproval && (proofApproved || wantsProof)
      ? [
          {
            key: 'Before We Print',
            value: wantsProof ? 'Proof requested' : 'Design approved with personalization details',
          },
        ]
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 lg:gap-16">
          {/* LEFT: product photos — browsable with arrows + a thumbnail strip,
              sized so the thumbnails stay above the fold. */}
          <div className="min-w-0 md:sticky md:top-[120px] md:self-start">
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

            {/* Thumbnails — wrap onto more rows so a long photo set never
                widens this column and squeezes the buy box. */}
            <div className="flex flex-wrap gap-3 mt-4">
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
          <div className="min-w-0">
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
              {addOns.map((a) => (
                <span key={a.variantId} className="ml-2 font-light text-base text-[#2D2D2D]/70">
                  + ${(a.price * a.quantity).toFixed(2)} {a.label}
                </span>
              ))}
              {quantity > 1 || addOns.length ? (
                <span className="ml-3 font-light text-sm text-[#2D2D2D]/50">
                  · {quantity > 1 ? (setSize ? `${quantity} sets ` : `${quantity} × `) : ''}= $
                  {(
                    unitPrice * quantity + addOnTotal
                  ).toFixed(2)}
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
                {optionGroups.map((opt) =>
                  // Long lists (e.g. 26 quantity & return-address choices)
                  // read better as a dropdown; short ones stay as buttons.
                  opt.optionValues.length > OPTION_DROPDOWN_THRESHOLD ? (
                    <div key={opt.name}>
                      <label
                        htmlFor={`option-${opt.name}`}
                        className="block font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D] mb-2.5"
                      >
                        {opt.name}
                      </label>
                      <div className="relative">
                        <select
                          id={`option-${opt.name}`}
                          value={selOptions[opt.name] ?? ''}
                          onChange={(e) =>
                            setSelOptions((s) => ({...s, [opt.name]: e.target.value}))
                          }
                          className="w-full appearance-none bg-white border border-[#C9A96E]/40 px-4 py-3 pr-10 text-sm font-sans text-[#2D2D2D] hover:border-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                        >
                          {opt.optionValues.map((ov) => (
                            <option key={ov.name} value={ov.name}>
                              {ov.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          aria-hidden
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2D2D2D]/60"
                        />
                      </div>
                    </div>
                  ) : (
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
                  ),
                )}
              </div>
            )}

            {/* Quantity — how many to add to cart */}
            <div className="mb-8">
              <div className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D] mb-2.5">
                {setSize ? 'Number of Sets' : 'Quantity'}
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
              {setSize && (
                <p className="font-sans text-xs text-[#2D2D2D]/60 mt-2">
                  Each set has {setSize}
                  {quantity > 1 ? ` — ${quantity} sets = ${quantity * setSize} total` : ''}.
                  All sets get the same personalization.
                </p>
              )}
            </div>

            {/* Personalize — classic form: name/text, font, color */}
            {schema && panelHasQuestions && (
              <div className="mb-6">
                <PersonalizationPanel
                  schema={activeSchema ?? schema}
                  value={personalization}
                  onChange={setPersonalization}
                  hideMonogram={pdpOverride.hideMonogram}
                  requireChoices
                  hideFont={hideFont}
                  hideInk={hideInk}
                  textLabel={pdpOverride.textLabel}
                  photoFeePrice={photoFee?.price}
                />
              </div>
            )}

            {/* Before we print — approve the details, or request a paid proof.
                The approval is what lets production print without a designer
                pass; with a proof, the customer approves from the email. */}
            {needsApproval && (
              <fieldset className="mb-4 space-y-2">
                <legend className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D] mb-2.5">
                  Before We Print{' '}
                  <span className="font-light normal-case tracking-normal text-[#2D2D2D]/55">
                    Choose one
                  </span>
                </legend>
                {[
                  {
                    value: 'approve' as const,
                    title: 'I approve my design with the personalization details above.',
                    text: 'Personalized pieces are made to order with these details and cannot be changed or returned after checkout.',
                  },
                  ...(proof
                    ? [
                        {
                          value: 'proof' as const,
                          title: `Send me a full proof first (+$${proof.price.toFixed(2)}).`,
                          text: 'Emailed within 2 business days of your order; we print once you approve it.',
                        },
                      ]
                    : []),
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-4 bg-white border rounded-sm cursor-pointer transition-colors ${
                      approvalChoice === opt.value
                        ? 'border-[#C9A96E]'
                        : 'border-[#C9A96E]/25 hover:border-[#C9A96E]/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="approval"
                      value={opt.value}
                      checked={approvalChoice === opt.value}
                      onChange={() => setApprovalChoice(opt.value)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A96E]"
                    />
                    <span className="font-sans font-light text-[13px] text-[#2D2D2D]/75 leading-relaxed">
                      <span className="font-medium text-[#2D2D2D]">{opt.title}</span>{' '}
                      {opt.text}
                    </span>
                  </label>
                ))}
              </fieldset>
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
                  ...(addProof
                    ? [
                        {
                          merchandiseId: proof.variantId,
                          quantity: 1,
                          attributes: [
                            {key: 'Proof for', value: appProduct.title},
                            ...(selectedVariant?.title
                              ? [{key: 'Option', value: selectedVariant.title}]
                              : []),
                          ],
                        },
                      ]
                    : []),
                  ...addOns.map((a) => ({
                    merchandiseId: a.variantId,
                    quantity: a.quantity,
                    attributes: [{key: 'For', value: appProduct.title}],
                  })),
                ],
              }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <button
                  type="submit"
                  onClick={(e) => {
                    if (missingInfo.length) {
                      e.preventDefault();
                      setTriedAddToCart(true);
                    }
                  }}
                  disabled={!variantId || fetcher.state !== 'idle'}
                  className="w-full bg-[#2D2D2D] text-white font-sans font-medium text-sm tracking-[0.15em] uppercase py-4 hover:bg-[#C9A96E] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetcher.state !== 'idle' ? 'Adding…' : 'Add to Cart'}
                </button>
              )}
            </CartForm>
            {triedAddToCart && missingInfo.length > 0 && (
              <div
                role="alert"
                className="mt-3 p-3 border border-[#B23A3A]/40 bg-[#B23A3A]/5 rounded-sm font-sans text-[13px] text-[#B23A3A]"
              >
                <p className="font-medium mb-1">
                  Please complete the following before adding to your cart:
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {missingInfo.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

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
/** Variant options with more choices than this show as a dropdown. */
const OPTION_DROPDOWN_THRESHOLD = 6;

/**
 * Set-count options ("5 + Blank Envelopes", "5 + Return Address", …) in
 * order: smallest set first, blank envelopes before return address. Other
 * options keep Shopify's order.
 */
function sortSetValues<T extends {name: string}>(values: T[]): T[] {
  const count = (v: T) =>
    Number(v.name.match(/^\s*(\d+)\s*\+/)?.[1]) || Infinity;
  // Not a set-count option (e.g. sizes): leave it alone. Odd extras like a
  // custom one-off go last.
  if (!values.some((v) => count(v) < Infinity && /envelope|return/i.test(v.name)))
    return values;
  const rank = (v: T) => (/blank/i.test(v.name) ? 0 : 1);
  return [...values].sort((a, b) => count(a) - count(b) || rank(a) - rank(b));
}

/** The text questions (name/text, monogram letters) that come before font and ink. */
/** "2 Cats" → 2; unanswered → 1. */
const itemCount = (answer?: string) =>
  Math.max(1, parseInt(answer ?? '', 10) || 1);

/**
 * Questions tied to a "How many?" question (e.g. "Number of Cats") are asked
 * once per item, grouped by item: "Cat 1: Cat Image Options", "Cat 1: Cat
 * Breed", then "Cat 2: …". The first item keeps its answers when the count
 * changes; follow-up and either/or links point at the same item's questions.
 */
function repeatPerItem(
  fields: PersonalizationField[],
  values: Record<string, string>,
): PersonalizationField[] {
  const done = new Set<string>();
  return fields.flatMap((f) => {
    const counter = f.repeatWith
      ? fields.find((g) => g.key === f.repeatWith)
      : undefined;
    if (!counter) return [f];
    if (done.has(counter.key)) return [];
    done.add(counter.key);
    const group = fields.filter((g) => g.repeatWith === counter.key);
    const n = itemCount(values[counter.key]);
    if (n < 2) return group;
    const keys = new Set(group.map((g) => g.key));
    const each = counter.eachLabel || 'Item';
    return Array.from({length: n}, (_, i) => {
      const prefix = `${each} ${i + 1}: `;
      const keyFor = (k: string) => (i > 0 && keys.has(k) ? prefix + k : k);
      return group.map((g) => ({
        ...g,
        key: keyFor(g.key),
        label: prefix + g.label,
        alternativeTo: g.alternativeTo && keyFor(g.alternativeTo),
        showWhen: g.showWhen && {...g.showWhen, key: keyFor(g.showWhen.key)},
      }));
    }).flat();
  });
}

const isTextField = (f: PersonalizationField) =>
  f.key === 'text' || f.type === 'monogram-letters';

function buildLineAttributes(
  p: PersonalizationValue,
  schema: PersonalizationSchema,
  textLabel: string,
) {
  // Readable labels for production (and the customer's cart), matching how
  // the live site's orders read — e.g. "Font: Font 4 – Buffalo".
  const attrs: Array<{key: string; value: string}> = [];
  if (p.mode) attrs.push({key: '_Personalization Mode', value: p.mode});
  const pushField = (f: PersonalizationField) => {
    const v = (p.fields?.[f.key] ?? '').trim();
    if (!v) return;
    if (f.key === 'text' && p.mode === 'monogram') return;
    if (f.type === 'monogram-letters' && p.mode !== 'monogram') return;
    const label =
      f.key === 'text' ? textLabel : f.label.replace(/\s*\(.*\)$/, '');
    attrs.push({key: label, value: v});
  };
  // Same order the customer fills them in: text, font, ink color, then
  // border → icon → placement → return address.
  schema.fields.filter(isTextField).forEach(pushField);
  if (p.mode === 'monogram' && p.monogramStyleKey) {
    const style = schema.monogramStyles?.find((s) => s.key === p.monogramStyleKey);
    attrs.push({key: 'Monogram Style', value: style?.label ?? p.monogramStyleKey});
  }
  const fontIndex = schema.fonts.findIndex((f) => f.key === p.fontKey);
  if (fontIndex >= 0)
    attrs.push({
      key: 'Font',
      value: `Font ${fontIndex + 1} – ${schema.fonts[fontIndex].label}`,
    });
  const ink = schema.inkColors.find((c) => c.key === p.inkKey);
  if (ink) attrs.push({key: 'Text Color', value: ink.label});
  sortByFieldGroup(schema.fields.filter((f) => !isTextField(f))).forEach(pushField);
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
