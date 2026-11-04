/*
 * Partner store pages — /partners/<handle>.
 *
 * A co-branded page for a retail partner showing only a curated collection
 * (a Shopify collection whose handle starts with "partner-"; add or remove
 * products there in Shopify admin), with search and sort. Visiting the page
 * puts the partner's discount code on the shopper's cart automatically, so
 * it's applied at checkout. The code itself is a Shopify discount limited to
 * the partner's collection.
 *
 * Pages are unlisted (no menu links, noindex): partners share the link with
 * their customers.
 *
 * To add a partner: create a "Partner - <Name>" collection in Shopify (handle
 * partner-<name>), publish it to the Hydrogen storefront, create the discount
 * code, then add an entry below.
 */

export type Partner = {
  handle: string;
  name: string;
  /** Shopify collection handle with the curated products. */
  collection: string;
  /** Applied to the cart on visit; leave empty for no discount. */
  discountCode: string;
  /** Shown on the page, e.g. 15 → "15% off". null = don't state an amount. */
  discountPercent: number | null;
  /** Short welcome under the heading. */
  intro: string;
  /** Partner logo (image URL); null shows their name as a wordmark. */
  logo: string | null;
  website?: string;
  /** Partner brand colors for the page header. */
  colors: {background: string; text: string; accent: string};
};

export const PARTNERS: Record<string, Partner> = {
  'ellie-bing': {
    handle: 'ellie-bing',
    name: 'Ellie Bing',
    collection: 'partner-ellie-bing',
    discountCode: 'ELLIEBING',
    discountPercent: null,
    intro:
      'A curated collection of The Winsome Life’s personalized stationery, chosen especially for Ellie Bing customers.',
    logo: null,
    website: 'https://www.elliebing.com',
    // Placeholder palette until we have Ellie Bing's brand colors.
    colors: {background: '#F3EEE6', text: '#2D2D2D', accent: '#9A7B4F'},
  },
};

/** Partner-only collections never appear in the public "Filter by Collection". */
export function isPartnerCollection(handle: string) {
  return handle.startsWith('partner-');
}
