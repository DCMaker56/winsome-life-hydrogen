/*
 * Keeps the gift charges in the cart in step with the gift choices (see
 * ~/lib/gift-options). Run after every cart change.
 */
import type {CartQueryDataReturn, HydrogenCart} from '@shopify/hydrogen';
import {
  GIFT_MESSAGE_PRODUCT_HANDLE,
  GIFT_WRAP_EXTRA_PRODUCT_HANDLE,
  GIFT_WRAP_PRODUCT_HANDLE,
  isAddOnHandle,
} from '~/lib/addons';
import {GIFT_ATTR, GIFT_MESSAGE_ATTR, GIFT_WRAP_ATTR} from '~/lib/gift-options';

type Storefront = {
  query: <T>(q: string, opts?: {variables?: Record<string, unknown>; cache?: unknown}) => Promise<T>;
  CacheLong: () => unknown;
};

const VARIANTS_QUERY = `
  query GiftVariants($a: String!, $b: String!, $c: String!) {
    a: product(handle: $a) { variants(first: 1) { nodes { id } } }
    b: product(handle: $b) { variants(first: 1) { nodes { id } } }
    c: product(handle: $c) { variants(first: 1) { nodes { id } } }
  }
`;
type V = {variants: {nodes: {id: string}[]}} | null;

type Line = {
  id: string;
  quantity: number;
  attributes?: {key: string; value?: string | null}[];
  merchandise?: {id?: string; product?: {handle?: string}};
};

export async function syncGiftCharges(
  cart: HydrogenCart,
  storefront: Storefront,
  result: CartQueryDataReturn,
): Promise<CartQueryDataReturn> {
  const cartId = result.cart?.id;
  if (!cartId) return result;
  const current = await cart.get({cartId});
  if (!current?.id) return result;
  const attr = (k: string) => current.attributes?.find((a) => a.key === k)?.value ?? '';
  const isGift = attr(GIFT_ATTR) === 'Yes';
  const lines = (current.lines?.nodes ?? []) as Line[];
  const handle = (l: Line) => l.merchandise?.product?.handle ?? '';

  // Items to wrap: everything except charges (add-ons, personalization fees).
  const items = lines
    .filter((l) => !isAddOnHandle(handle(l)) && !l.attributes?.some((a) => a.key === 'For'))
    .reduce((n, l) => n + l.quantity, 0);
  const want: Record<string, number> = {
    [GIFT_MESSAGE_PRODUCT_HANDLE]: isGift && attr(GIFT_MESSAGE_ATTR).trim() ? 1 : 0,
    [GIFT_WRAP_PRODUCT_HANDLE]: isGift && attr(GIFT_WRAP_ATTR) === 'Yes' && items > 0 ? 1 : 0,
    [GIFT_WRAP_EXTRA_PRODUCT_HANDLE]: isGift && attr(GIFT_WRAP_ATTR) === 'Yes' ? Math.max(items - 1, 0) : 0,
  };

  const add: {merchandiseId: string; quantity: number}[] = [];
  const update: {id: string; quantity: number}[] = [];
  const remove: string[] = [];
  let ids: Record<string, string> | null = null;
  for (const [h, qty] of Object.entries(want)) {
    const existing = lines.filter((l) => handle(l) === h);
    const have = existing.reduce((n, l) => n + l.quantity, 0);
    if (have === qty) continue;
    if (!qty) remove.push(...existing.map((l) => l.id));
    else if (existing.length) update.push({id: existing[0].id, quantity: qty});
    else {
      ids ??= await storefront
        .query<{a: V; b: V; c: V}>(VARIANTS_QUERY, {
          variables: {a: GIFT_MESSAGE_PRODUCT_HANDLE, b: GIFT_WRAP_PRODUCT_HANDLE, c: GIFT_WRAP_EXTRA_PRODUCT_HANDLE},
          cache: storefront.CacheLong(),
        })
        .then((d) => ({
          [GIFT_MESSAGE_PRODUCT_HANDLE]: d.a?.variants.nodes[0]?.id ?? '',
          [GIFT_WRAP_PRODUCT_HANDLE]: d.b?.variants.nodes[0]?.id ?? '',
          [GIFT_WRAP_EXTRA_PRODUCT_HANDLE]: d.c?.variants.nodes[0]?.id ?? '',
        }));
      const id = ids?.[h];
      if (id) add.push({merchandiseId: id, quantity: qty});
    }
  }
  let out = result;
  if (remove.length) out = await cart.removeLines(remove, {cartId});
  if (update.length) out = await cart.updateLines(update, {cartId});
  if (add.length) out = await cart.addLines(add, {cartId});
  return out.cart ? out : result;
}
