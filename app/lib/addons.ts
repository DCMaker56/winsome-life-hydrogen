/**
 * Add-on products (e.g. the paid product proof) live in Shopify like any other
 * product so they can go in the cart, but they're not browsable merchandise:
 * keep them out of listings and search. They carry the "add-on" tag.
 */
export const PROOF_PRODUCT_HANDLE = 'product-proof';
/** Charged when a customer uploads their own pet photo instead of picking a breed. */
export const PHOTO_FEE_PRODUCT_HANDLE = 'custom-photo-fee';
/** Charged for each extra pet on a design (e.g. a second or third cat). */
export const EXTRA_ITEM_FEE_PRODUCT_HANDLE = 'additional-pet-fee';
/** Charged for each photo beyond those included on a photo card ($12). */
export const EXTRA_PHOTO_FEE_PRODUCT_HANDLE = 'additional-photo-fee';
/** Charged per card when the customer adds envelope liners ($0.55 each). */
export const ENVELOPE_LINER_PRODUCT_HANDLE = 'envelope-liners';
/** Charged per envelope when the customer picks Euro flap envelopes ($0.35 each). */
export const EURO_FLAP_PRODUCT_HANDLE = 'euro-flap-envelopes';
// Listing queries filter them with `query: "tag_not:add-on"` (written inline
// so GraphQL codegen can read the queries).

export const isAddOnHandle = (handle?: string | null) =>
  handle === PROOF_PRODUCT_HANDLE ||
  handle === PHOTO_FEE_PRODUCT_HANDLE ||
  handle === EXTRA_ITEM_FEE_PRODUCT_HANDLE ||
  handle === EXTRA_PHOTO_FEE_PRODUCT_HANDLE ||
  handle === ENVELOPE_LINER_PRODUCT_HANDLE ||
  handle === EURO_FLAP_PRODUCT_HANDLE;
