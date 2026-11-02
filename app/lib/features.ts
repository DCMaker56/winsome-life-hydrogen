/*
 * Site feature switches.
 *
 * STUDIO_OPEN — the "Design Your Own" Product Builder (/studio). Closed for
 * now per Sydney: the navbar shows a "Coming soon" hint instead of a link,
 * /studio shows a coming-soon page, and /studio/<format> redirects there.
 * Flip to true to reopen everything; no other code changes needed.
 */
export const STUDIO_OPEN = false;

/*
 * BUILD_YOUR_OWN_OPEN — the Build Your Own gift set builder (/build-your-own).
 * Closed per Sydney: hidden from search, and the page shows a coming-soon
 * message. Flip to true to reopen.
 */
export const BUILD_YOUR_OWN_OPEN = false;

/*
 * GIFT_SETS_OPEN — the gift set pages (/gift-sets and /gift-sets/<set>).
 * Closed per Sydney until gift sets are rebuilt as real Shopify products
 * (the current ones aren't purchasable). Hidden from the footer and search;
 * /gift-sets shows a coming-soon page and each set redirects there.
 */
export const GIFT_SETS_OPEN = false;
