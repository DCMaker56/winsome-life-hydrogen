/**
 * SEO / structured-data helpers (Hydrogen equivalents of the Liquid theme's
 * `structured_data` filter). Everything here builds Schema.org JSON-LD objects
 * that the routes render through the <JsonLd> component (app/components/JsonLd).
 *
 * Canonical host is the production domain the storefront will serve from, so
 * canonical tags + JSON-LD `url`s stay stable across the *.myshopify.dev
 * preview deployments.
 */

export const SITE_URL = 'https://www.thewinsomelife.com';
export const BRAND_NAME = 'The Winsome Life';

/** Absolute URL for a site-relative path (or pass through an absolute one). */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/* ------------------------------------------------------------------ *
 * Responsive image helpers — next-gen (WebP) + srcset for Shopify /
 * thewinsomelife CDN URLs, which both accept a `width` query param.
 * ------------------------------------------------------------------ */

const DEFAULT_WIDTHS = [400, 600, 800, 1200, 1600];

function withWidth(url: string, width: number): string {
  try {
    const u = new URL(url, SITE_URL);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}

/** Build a `srcset` string across common widths for a CDN image URL. */
export function buildSrcSet(
  url: string,
  widths: number[] = DEFAULT_WIDTHS,
): string {
  if (!url) return '';
  return widths.map((w) => `${withWidth(url, w)} ${w}w`).join(', ');
}

/* ------------------------------------------------------------------ *
 * Shared merchant-listing schema (returns + shipping). Google requires
 * these to feature products in organic shopping / rich results.
 * ------------------------------------------------------------------ */

/**
 * Return policy. Personalized / made-to-order pieces are final sale, so those
 * emit MerchantReturnNotPermitted; everything else gets a 30-day window.
 */
export function merchantReturnPolicy(finalSale: boolean) {
  if (finalSale) {
    return {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory:
        'https://schema.org/MerchantReturnNotPermitted',
    };
  }
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'US',
    returnPolicyCategory:
      'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };
}

/**
 * US shipping. Free over $75; made-to-order handling time (5–7 business days)
 * plus transit. Modeled as free-with-threshold so listings show accurate ETAs.
 */
export function shippingDetails() {
  return {
    '@type': 'OfferShippingDetails',
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'US',
    },
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: '0',
      currency: 'USD',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 5,
        maxValue: 7,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 2,
        maxValue: 5,
        unitCode: 'DAY',
      },
    },
  };
}

/* ------------------------------------------------------------------ *
 * Offer / Product / ProductGroup
 * ------------------------------------------------------------------ */

export interface OfferInput {
  price: number;
  /** Made-to-order pieces stay InStock so they never flag Out of Stock. */
  availability?: 'InStock' | 'PreOrder' | 'OutOfStock';
  url: string;
  sku?: string;
  finalSale: boolean;
}

function offer({price, availability = 'InStock', url, sku, finalSale}: OfferInput) {
  return {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: price.toFixed(2),
    availability: `https://schema.org/${availability}`,
    itemCondition: 'https://schema.org/NewCondition',
    url,
    ...(sku ? {sku} : {}),
    priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
    hasMerchantReturnPolicy: merchantReturnPolicy(finalSale),
    shippingDetails: shippingDetails(),
    seller: {'@type': 'Organization', name: BRAND_NAME},
  };
}

export interface VariantInput {
  sku?: string | null;
  price: number;
  availableForSale?: boolean;
  selectedOptions?: Array<{name: string; value: string}>;
  title?: string;
}

export interface ProductSchemaInput {
  id: string;
  title: string;
  description: string;
  handle: string;
  images: string[];
  price: number;
  /** Personalized / made-to-order → final sale + always InStock. */
  finalSale: boolean;
  variants?: VariantInput[];
}

/**
 * Product JSON-LD. When the product has more than one real variant (paper type,
 * size…), emits a ProductGroup with each variant as an `isVariantOf` Product so
 * Google can group them; otherwise a single Product.
 */
export function productJsonLd(p: ProductSchemaInput) {
  const url = absoluteUrl(`/products/${p.handle}`);
  const images = p.images.map((i) => absoluteUrl(i)).slice(0, 8);
  const availability = p.finalSale ? 'InStock' : undefined;

  const distinctVariants = (p.variants ?? []).filter(
    (v) => v.selectedOptions && v.selectedOptions.length > 0,
  );
  const isGroup = distinctVariants.length > 1;

  const base = {
    '@context': 'https://schema.org',
    name: p.title,
    description: p.description,
    image: images,
    brand: {'@type': 'Brand', name: BRAND_NAME},
    ...(p.id ? {productID: p.id} : {}),
  };

  if (!isGroup) {
    return {
      ...base,
      '@type': 'Product',
      url,
      offers: offer({
        price: p.price,
        availability,
        url,
        sku: distinctVariants[0]?.sku ?? undefined,
        finalSale: p.finalSale,
      }),
    };
  }

  // Which option dimensions actually vary (e.g. "Paper Type", "Size")
  const variesBy = Array.from(
    new Set(
      distinctVariants.flatMap((v) =>
        (v.selectedOptions ?? []).map((o) => o.name),
      ),
    ),
  );
  const groupId = `${url}#productGroup`;

  return {
    ...base,
    '@type': 'ProductGroup',
    '@id': groupId,
    productGroupID: p.id,
    url,
    variesBy: variesBy.map((v) => `https://schema.org/${v.replace(/\s+/g, '')}`),
    hasVariant: distinctVariants.map((v) => {
      const variantName = v.selectedOptions?.map((o) => o.value).join(' / ');
      return {
        '@type': 'Product',
        name: `${p.title}${variantName ? ` — ${variantName}` : ''}`,
        image: images,
        ...(v.sku ? {sku: v.sku} : {}),
        isVariantOf: {'@id': groupId},
        ...(v.selectedOptions?.length
          ? {
              additionalProperty: v.selectedOptions.map((o) => ({
                '@type': 'PropertyValue',
                name: o.name,
                value: o.value,
              })),
            }
          : {}),
        offers: offer({
          price: v.price,
          availability: p.finalSale
            ? 'InStock'
            : v.availableForSale
              ? 'InStock'
              : 'OutOfStock',
          url,
          sku: v.sku ?? undefined,
          finalSale: p.finalSale,
        }),
      };
    }),
  };
}

/* ------------------------------------------------------------------ *
 * Breadcrumbs + collection ItemList
 * ------------------------------------------------------------------ */

export interface Crumb {
  name: string;
  /** Site-relative path; last crumb may omit for the current page. */
  path?: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? {item: absoluteUrl(c.path)} : {}),
    })),
  };
}

export interface ListProduct {
  slug: string;
  title: string;
  image?: string;
  price?: number;
}

export function itemListJsonLd(products: ListProduct[], pagePath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: absoluteUrl(pagePath),
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.title,
      ...(p.image ? {image: absoluteUrl(p.image)} : {}),
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Site-wide Organization + WebSite (rendered once, at the root)
 * ------------------------------------------------------------------ */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    description:
      'Luxury personalized stationery — notecards, notepads, gift tags, and gift sets for every interest.',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
