/*
 * Printable partner catalogs — /partners/<handle>/catalog.
 *
 * Letter-size (8.5 × 11 in) pages: cover, table of contents, the partner's
 * products (4 per page, grouped by product type, then collection), then the
 * personalization options pages. Open in Chrome → Print → Save as PDF.
 * No prices (Sydney): stores use it with their customers.
 */

/**
 * Options pages at the back, one photo per page. `images` are Shopify image
 * URLs (one page each); `fromAlt` finds the photo by its alt text on
 * `product` instead (for charts labeled in Shopify). Options with no photo
 * yet are left out of the catalog. `product` + `candidates` is only used by the
 * picker (?pick=1) to show the photos to choose from.
 */
export type CatalogOptionPage = {
  key: string;
  title: string;
  note?: string;
  /** Chosen photos (Sydney's picks), one page each. */
  images?: string[];
  fromAlt?: {product: string; alt: RegExp};
  candidates: string[];
};

const DOG = 'gid://shopify/Product/9827269574953';

export const CATALOG_OPTION_PAGES: CatalogOptionPage[] = [
  {
    key: 'monogram',
    title: 'Monogram Options',
    images: [
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/monogram-style-options-15.png?v=1793204718',
    ],
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
    images: [
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.5110218285_rpo2_eafc0d4d-b5aa-4eca-9b7e-e88d95a4aa7a.jpg?v=1768064077',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.5110218279_6iy1_d2291b9e-9046-42a6-bdff-7d35e3dd89e9.jpg?v=1768064077',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.5450036555_mek6_a2deed5b-e54a-46b4-a9a6-4ddd81357294.jpg?v=1768064077',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/4_c70044ff-a47d-40ec-993a-6bf5f08fba96.png?v=1768064077',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/5_95314488-f0d9-4017-bc8c-9cbaf6b97412.png?v=1768064077',
    ],
    note: 'For dog notecards and notepads. You can also send a photo of your own dog.',
    candidates: [DOG, 'gid://shopify/Product/9828551655721'],
  },
  {
    key: 'cat',
    title: 'Cat Breed Options',
    images: [
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/1_ba340c6b-f08e-4be8-a19f-6a662902aa13.png?v=1761329677',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/2_14e0c8b4-0545-4a95-91bb-d12132521f49.png?v=1761329677',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/3_f139ce62-e3b6-44ac-be4a-135d8aef56b0.png?v=1761329677',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/4_5d681f07-a056-4898-a3a0-adcf2c8e3f0e.png?v=1761329677',
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/5_9c33151c-7d00-4a0d-97a8-a5146956a3bb.png?v=1761329677',
    ],
    note: 'For cat notecards and notepads. You can also send a photo of your own cat.',
    candidates: [
      'gid://shopify/Product/9855129125161', // Custom Cat Stationery
      'gid://shopify/Product/9854435590441', // Cat Notepad
    ],
  },
  {
    key: 'flower',
    title: 'Flower Options',
    images: [
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.5048179830_532p.jpg?v=1758645255',
    ],
    candidates: [
      'gid://shopify/Product/9871822356777', // Watercolor Flower Notepad
      'gid://shopify/Product/9826593440041', // Floral Place Cards
    ],
  },
  {
    key: 'seaside',
    title: 'Seaside Icon Options',
    images: [
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.5096411217_34tb.jpg?v=1756561028',
    ],
    candidates: [
      'gid://shopify/Product/9801647456553', // Beachy & Seaside Place Cards
      'gid://shopify/Product/9867848941865', // Seaside Stationery
    ],
  },
  {
    key: 'meal',
    title: 'Meal Options',
    note: 'For wedding and event place cards.',
    // Sydney's pick: flower photo #15 (Floral Place Cards), which shows the meal icons.
    images: [
      'https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.5021894420_mdj6_5ae993bd-22f0-4985-95a5-4109ce1ebc3b.jpg?v=1758645254',
    ],
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
