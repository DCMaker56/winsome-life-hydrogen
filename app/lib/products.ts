/*
 * Product types + utilities.
 *
 * The hardcoded products array has been replaced — live data is fetched
 * from Shopify (thewinsomelife.com) via the `storefront` tRPC router.
 * Components should call the hooks in @/hooks/useProducts.ts rather than
 * importing data from here.
 */
import type { ProductType } from "./variants";
export type { ProductType } from "./variants";

export type CategorySlug =
  | "monogram"
  | "floral"
  | "seasonal"
  | "notecards"
  | "notepads"
  | "gift-tags"
  | "wine-tags"
  | "artwork"
  | "calendars"
  | "weddings"
  | "bestsellers";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  /** "From" price — smallest variant. The PDP's quantity ladder shows real
   *  per-tier pricing. */
  price: number;
  compareAtPrice?: number;
  images: string[];
  categories: CategorySlug[];
  badge?: "Bestseller" | "New" | "Sale" | "Limited";
  details: string[];
  inStock: boolean;
  shopifyUrl: string;
  /** Controls which variant axes, quantity ladder, and personalization UI
   *  the product page surfaces. See VARIANT_PRESETS. */
  type: ProductType;
}

export interface Collection {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  categories: CategorySlug[];
}

/** Money formatting — pure utility, no data dependency. */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
