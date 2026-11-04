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
 * code, then add an entry below (logo files go in app/assets/partners/).
 */
import ellieBingLogo from '~/assets/partners/ellie-bing.png';

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
    // Shopify code discount: 35% off the partner collection only.
    discountCode: 'ELLIEBING35',
    discountPercent: 35,
    intro:
      'A curated collection of The Winsome Life’s personalized stationery, chosen especially for Ellie Bing customers.',
    logo: ellieBingLogo,
    website: 'https://www.elliebing.com',
    // Ellie Bing's light blue with their deeper blue as the accent (from
    // their website); the black logo reads clearly on the light blue.
    colors: {background: '#CAEFF6', text: '#111111', accent: '#4679B9'},
  },
};

/**
 * Partner pages group products under headings. Each product shows once:
 *  1. Anything in Place Cards goes under "Place Cards" only.
 *  2. Anything with Christmas / Holiday / Thanksgiving in its name goes under
 *     "Christmas / Holiday" only.
 *  3. Otherwise, under the first heading below that it's in a collection for.
 *  Anything left goes under "More Favorites". Headings show in this order;
 *  empty ones are skipped. (Rules per Sydney, Nov 2026.)
 */
export const PARTNER_SECTION_RULES: Array<{
  section: string;
  collection?: string;
  titleMatch?: RegExp;
}> = [
  {section: 'place-cards', collection: 'place-cards'},
  {section: 'christmas-holiday', titleMatch: /christmas|holiday|thanksgiving/i},
];

/**
 * Hand-placed products (by product handle): shown under exactly these
 * headings, ahead of the rules above. A product can sit under several.
 */
export const PARTNER_PLACEMENTS: Record<string, string[]> = {
  // Dog stationery under Dogs & Cats (Sydney)
  'personalized-dog-bow-stationery-set-stationary-dog-breed-flat-notecards-christmas-bow-dog-lover-gift':
    ['dogs'],
  'custom-dog-stationery-stationary-choose-your-dog-breed-custom-canine-notecards-dog-lover-gift-ability-to-add-multiple-dogs-1':
    ['dogs'],
  // Scalloped stationery under Monograms
  'scalloped-stationery-set-with-border': ['monogram-styles'],
  // Fall gift tags under Christmas / Holiday
  'personalized-fall-gift-tags-or-stickers-thanksgiving-gift-tags-thanksgiving-stickers-monogram-fall-gift-tag':
    ['christmas-holiday'],
  // Golf notepad + stationery under Sports, and also Men
  'personalized-golf-notepad-monogram-golf-notepad-golf-lover-gift-golfer-birthday-present-customize-with-text-of-your-choice':
    ['sports-1', 'mens'],
  'personalized-golf-stationery-stationary-golfing-notecards-golfer-gift-mens-womens-golf-gift-monogram-stationery-with-initials-1':
    ['sports-1', 'mens'],
  // Wine tags under Wine Tags
  'personalized-wine-tags-custom-prosecco-champagne-tags-mini-prosecco-tags-customize-with-your-own-art-logo-text':
    ['wine-tags-1'],
  // Bordered stationery set under Monograms and also Men
  'bordered-stationery-set-personalized-mens-and-womens-stationary-bordered-notecards-elegant-notecards-mens-womens-birthday-gift-1':
    ['monogram-styles', 'mens'],
};

/** Heading names that differ from the Shopify collection's title. */
export const PARTNER_SECTION_TITLES: Record<string, string> = {
  classics: 'Family / Couples Stationery',
  'place-cards': 'Place Cards',
  'wine-tags-1': 'Wine Tags',
  'christmas-holiday': 'Christmas / Holiday',
};

export const PARTNER_SECTION_ORDER = [
  'monogram-styles',
  'floral',
  'seaside',
  'nature-1',
  'classics',
  'christian-1',
  'family-couples',
  'baby',
  'mens',
  'teacher',
  'business-professional',
  'sports-1',
  'military',
  'travel',
  'dogs',
  'affinity-hobbies',
  'greek-life-sorority-fraternity',
  'mahjong',
  'wine-tags-1',
  'place-cards',
  'christmas-holiday',
  'fall-autumn',
  'winter-1',
  'spring-1',
  'summer',
  'valentines-day',
  'easter',
  'halloween',
  'graduation',
];

/** Partner-only collections never appear in the public "Filter by Collection". */
export function isPartnerCollection(handle: string) {
  return handle.startsWith('partner-');
}
