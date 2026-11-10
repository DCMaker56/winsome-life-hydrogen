/**
 * Sends shopping events (view item, add to cart, remove from cart, view cart,
 * view item list, search) to GA4 via gtag.
 *
 * On the old Shopify theme the Google & YouTube app sent these automatically.
 * On a Hydrogen (headless) storefront that app only covers checkout, so the
 * storefront must forward Hydrogen's analytics events to gtag itself. gtag is
 * loaded in root.tsx (G-H9RRG960BX).
 */
import {useEffect} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

type Gtag = (...args: unknown[]) => void;

type AnyLine = {
  quantity?: number;
  cost?: {amountPerQuantity?: {amount?: string; currencyCode?: string}};
  merchandise?: {
    id?: string;
    title?: string;
    sku?: string | null;
    product?: {id?: string; title?: string; vendor?: string};
  };
};

function gtag(...args: unknown[]) {
  const fn = (window as unknown as {gtag?: Gtag}).gtag;
  if (typeof fn === 'function') fn(...args);
}

function numericId(gid?: string) {
  return gid ? gid.split('/').pop() ?? gid : undefined;
}

function lineToItem(line: AnyLine | undefined, quantity: number) {
  const m = line?.merchandise;
  return {
    item_id: numericId(m?.product?.id),
    item_name: m?.product?.title,
    item_variant: m?.title,
    item_brand: m?.product?.vendor,
    price: Number(line?.cost?.amountPerQuantity?.amount ?? 0),
    quantity,
  };
}

function cartItems(cart: unknown) {
  const nodes = ((cart as {lines?: {nodes?: AnyLine[]}} | null)?.lines?.nodes ??
    []) as AnyLine[];
  return nodes.map((l) => lineToItem(l, l.quantity ?? 1));
}

export function GoogleAnalyticsEvents() {
  const {subscribe, register} = useAnalytics();
  const {ready} = register('Google Analytics');

  useEffect(() => {
    subscribe('product_viewed', (data) => {
      const p = data.products?.[0];
      if (!p) return;
      gtag('event', 'view_item', {
        currency: data.shop?.currency,
        value: Number(p.price ?? 0),
        items: [
          {
            item_id: numericId(p.id),
            item_name: p.title,
            item_variant: p.variantTitle,
            item_brand: p.vendor,
            price: Number(p.price ?? 0),
            quantity: p.quantity ?? 1,
          },
        ],
      });
    });

    subscribe('collection_viewed', (data) => {
      gtag('event', 'view_item_list', {
        item_list_id: data.collection?.handle,
        item_list_name: data.collection?.handle,
      });
    });

    subscribe('search_viewed', (data) => {
      if (data.searchTerm) gtag('event', 'search', {search_term: data.searchTerm});
    });

    subscribe('cart_viewed', (data) => {
      const cart = data.cart as {cost?: {subtotalAmount?: {amount?: string}}} | null;
      gtag('event', 'view_cart', {
        currency: data.shop?.currency,
        value: Number(cart?.cost?.subtotalAmount?.amount ?? 0),
        items: cartItems(data.cart),
      });
    });

    subscribe('product_added_to_cart', (data) => {
      const cur = data.currentLine as AnyLine | undefined;
      const prev = data.prevLine as AnyLine | undefined;
      const qty = (cur?.quantity ?? 0) - (prev?.quantity ?? 0);
      if (qty <= 0) return;
      const item = lineToItem(cur, qty);
      gtag('event', 'add_to_cart', {
        currency:
          cur?.cost?.amountPerQuantity?.currencyCode ?? data.shop?.currency,
        value: item.price * qty,
        items: [item],
      });
    });

    subscribe('product_removed_from_cart', (data) => {
      const cur = data.currentLine as AnyLine | undefined;
      const prev = data.prevLine as AnyLine | undefined;
      const qty = (prev?.quantity ?? 0) - (cur?.quantity ?? 0);
      if (qty <= 0) return;
      const item = lineToItem(prev, qty);
      gtag('event', 'remove_from_cart', {
        currency:
          prev?.cost?.amountPerQuantity?.currencyCode ?? data.shop?.currency,
        value: item.price * qty,
        items: [item],
      });
    });

    ready();
    // subscribe/register are stable for the life of the provider
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
