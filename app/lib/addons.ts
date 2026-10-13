/**
 * Add-on products (e.g. the paid product proof) live in Shopify like any other
 * product so they can go in the cart, but they're not browsable merchandise:
 * keep them out of listings and search. They carry the "add-on" tag.
 */
export const PROOF_PRODUCT_HANDLE = 'product-proof';
// Listing queries filter them with `query: "tag_not:add-on"` (written inline
// so GraphQL codegen can read the queries).

export const isAddOnHandle = (handle?: string | null) =>
  handle === PROOF_PRODUCT_HANDLE;
