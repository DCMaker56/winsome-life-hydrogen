/**
 * Central config for The Winsome Life frontend.
 *
 * DECISION: Shopify hybrid mode.
 * Browse and discovery happen on this React app; cart and checkout live on
 * the existing Shopify store at thewinsomelife.com. This keeps the
 * fulfillment/payment infrastructure untouched while letting the marketing
 * site evolve independently.
 *
 * Rules:
 *   - Internal browsing links (collections, products, gift sets, about,
 *     subscribe, build-your-own) use wouter `<Link>` and the `internal()`
 *     helper below.
 *   - External commerce actions (add-to-cart, checkout, cart icon,
 *     account/login) go to Shopify via the `shopify()` helper.
 *   - The cart badge hides until cart context is connected to Shopify's
 *     storefront API. Until then, clicking the cart icon deep-links to
 *     the Shopify cart page.
 */

export const SHOPIFY_BASE = "https://www.thewinsomelife.com";

export const CART_MODE: "shopify-hybrid" | "standalone" = "shopify-hybrid";

/** Build an internal wouter path. */
export const internal = (path: string) => path;

/** Build a Shopify deep link. */
export const shopify = (path = "") => {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SHOPIFY_BASE}${path}`;
};

export const SHOPIFY_URLS = {
  cart: shopify("/cart"),
  account: shopify("/account"),
  checkout: shopify("/checkout"),
  collection: (slug: string) => shopify(`/collections/${slug}`),
  product: (handle: string) => shopify(`/products/${handle}`),
} as const;

export const INTERNAL_URLS = {
  home: "/",
  collections: "/collections/all",
  collection: (slug: string) => `/collections/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  giftSets: "/gift-sets",
  giftSet: (slug: string) => `/gift-sets/${slug}`,
  buildYourOwn: "/build-your-own",
  subscribe: "/subscribe",
  about: "/about",
} as const;
