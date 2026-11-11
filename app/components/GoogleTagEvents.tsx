import {useEffect} from 'react';
import {
  Analytics,
  AnalyticsEvent,
  useAnalytics,
  type ProductViewPayload,
  type CollectionViewPayload,
  type SearchViewPayload,
  type CartLineUpdatePayload,
  type CartViewPayload,
} from '@shopify/hydrogen';

/**
 * Forwards Hydrogen's storefront analytics events to our own Google tag
 * (GA4 `G-H9RRG960BX` + Google Ads `AW-17795546793`, loaded in root.tsx).
 *
 * WHY THIS EXISTS: this is a headless Hydrogen storefront, so Shopify's
 * `web-pixels-manager` does not load here — verified live: no sandbox iframe,
 * no app pixels run on-site. That means the Google & YouTube app's on-site
 * pixel (view_item / add_to_cart / etc.) never fires on our pages. The purchase
 * conversion still fires on Shopify's hosted checkout via that app; this only
 * covers the *on-site* signals Google uses for optimization and remarketing,
 * sent through the tag we fully control. Do NOT also run a Shopify custom pixel
 * for these events or they will double-count.
 */
const CURRENCY = 'USD';

type GtagItem = {
  item_id?: string;
  item_name?: string;
  item_brand?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

function gtagEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as {gtag?: (...a: unknown[]) => void}).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params);
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function GoogleTagEvents() {
  const {subscribe, register} = useAnalytics();
  // register() buffers events fired before we subscribe, then replays them
  // once ready() is called, so the first page_viewed/product_viewed isn't lost.
  const {ready} = register('Google Gtag');

  useEffect(() => {
    // view_item — product detail page
    subscribe(AnalyticsEvent.PRODUCT_VIEWED, (payload: ProductViewPayload) => {
      const items: GtagItem[] = (payload?.products ?? []).map((p) => ({
        item_id: p.variantId || p.id,
        item_name: p.title,
        item_brand: p.vendor,
        item_variant: p.variantTitle,
        price: num(p.price),
        quantity: num(p.quantity) ?? 1,
      }));
      if (!items.length) return;
      gtagEvent('view_item', {
        currency: CURRENCY,
        value: items[0].price,
        items,
      });
    });

    // view_item_list — collection page
    subscribe(
      AnalyticsEvent.COLLECTION_VIEWED,
      (payload: CollectionViewPayload) => {
        const c = payload?.collection;
        if (!c) return;
        gtagEvent('view_item_list', {
          item_list_id: c.handle,
          item_list_name: c.handle,
        });
      },
    );

    // search — search results page
    subscribe(AnalyticsEvent.SEARCH_VIEWED, (payload: SearchViewPayload) => {
      if (!payload?.searchTerm) return;
      gtagEvent('search', {search_term: payload.searchTerm});
    });

    // add_to_cart — quantity increased on the cart
    subscribe(
      AnalyticsEvent.PRODUCT_ADD_TO_CART,
      (payload: CartLineUpdatePayload) => {
        const line = payload?.currentLine;
        if (!line) return;
        const merch = line.merchandise;
        const price = num(merch?.price?.amount);
        const quantity = num(line.quantity) ?? 1;
        const item: GtagItem = {
          item_id: merch?.id,
          item_name: merch?.product?.title,
          item_brand: merch?.product?.vendor,
          item_variant: merch?.title,
          price,
          quantity,
        };
        gtagEvent('add_to_cart', {
          currency: line.cost?.totalAmount?.currencyCode || CURRENCY,
          value:
            num(line.cost?.totalAmount?.amount) ??
            (price != null ? price * quantity : undefined),
          items: [item],
        });
      },
    );

    // view_cart — cart drawer / cart page opened
    subscribe(AnalyticsEvent.CART_VIEWED, (payload: CartViewPayload) => {
      gtagEvent('view_cart', {
        currency: payload?.cart?.cost?.totalAmount?.currencyCode || CURRENCY,
        value: num(payload?.cart?.cost?.totalAmount?.amount),
      });
    });

    ready();
  }, [subscribe, register, ready]);

  return null;
}
