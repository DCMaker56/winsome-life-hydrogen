/*
 * Printable partner catalogs — /partners/<handle>/catalog.
 *
 * Letter-size (8.5 × 11 in) pages: cover, table of contents, the partner's
 * products (4 per page, grouped by product type, then collection), then the
 * personalization options pages. Open in Chrome → Print → Save as PDF.
 * No prices (Sydney): stores use it with their customers.
 */

/**
 * Options pages at the back, one photo per page. `image` is a Shopify image
 * URL; `fromAlt` finds the photo by its alt text on `product` instead (for
 * charts labeled in Shopify). `product` + `candidates` is only used by the
 * picker (?pick=1) to show the photos to choose from.
 */
export type CatalogOptionPage = {
  key: string;
  title: string;
  note?: string;
  image?: string;
  fromAlt?: {product: string; alt: RegExp};
  candidates: string[];
};

const DOG = 'gid://shopify/Product/9827269574953';

export const CATALOG_OPTION_PAGES: CatalogOptionPage[] = [
  {
    key: 'monogram',
    title: 'Monogram Options',
    candidates: [
      'gid://shopify/Product/9828551688489', // Monogram Stationery Set
      'gid://shopify/Product/9827279012137', // Folded Monogram Notecards
      'gid://shopify/Product/9827271147817', // Bordered Monogram Stationery
    ],
  },
  {
    key: 'font',
    title: 'Font Options',
    fromAlt: {product: DOG, alt: /font options/i},
    candidates: [DOG],
  },
  {
    key: 'color',
    title: 'Color Options',
    fromAlt: {product: DOG, alt: /color options/i},
    candidates: [DOG],
  },
  {
    key: 'dog',
    title: 'Dog Breed Options',
    note: 'For dog notecards and notepads. You can also send a photo of your own dog.',
    candidates: [DOG, 'gid://shopify/Product/9828551655721'],
  },
  {
    key: 'cat',
    title: 'Cat Breed Options',
    note: 'For cat notecards and notepads. You can also send a photo of your own cat.',
    candidates: [
      'gid://shopify/Product/9855129125161', // Custom Cat Stationery
      'gid://shopify/Product/9854435590441', // Cat Notepad
    ],
  },
  {
    key: 'flower',
    title: 'Flower Options',
    candidates: [
      'gid://shopify/Product/9871822356777', // Watercolor Flower Notepad
      'gid://shopify/Product/9826593440041', // Floral Place Cards
    ],
  },
  {
    key: 'seaside',
    title: 'Seaside Icon Options',
    candidates: [
      'gid://shopify/Product/9801647456553', // Beachy & Seaside Place Cards
      'gid://shopify/Product/9867848941865', // Seaside Stationery
    ],
  },
  {
    key: 'meal',
    title: 'Meal Options',
    note: 'For wedding and event place cards.',
    candidates: [
      'gid://shopify/Product/10036082901289', // Elegant Place Cards with Border
      'gid://shopify/Product/9826593440041', // Floral Place Cards
      'gid://shopify/Product/9801644146985', // Saguaro Cactus Place Cards
    ],
  },
];

export const CATALOG_PER_PAGE = 4;

/** "Custom Dog Stationery / Stationary | Choose your…" → "Custom Dog Stationery / Stationary" */
export function shortTitle(title: string) {
  return title.split('|')[0].trim();
}

/** Shopify image at a print-friendly width. */
export function printImage(url: string, width = 1000) {
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}
