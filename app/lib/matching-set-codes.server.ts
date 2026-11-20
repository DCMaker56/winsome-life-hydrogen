/*
 * Keeps the cart's matching-set codes in step with its contents (see
 * ~/lib/matching-set-codes). Run after every cart change.
 *
 * - Only codes for sets with 2+ different pieces in the cart.
 * - A customer's own code (WINSOMEWELCOME10, a partner code, …) wins: set
 *   codes don't combine with those, so they come off while it's applied.
 * - At most 5 codes per order (Shopify's limit); the cart explains the rest.
 */
import type {CartQueryDataReturn, HydrogenCart} from '@shopify/hydrogen';
import {loadMatchingSets} from '~/lib/matching-sets';
import {MAX_CART_CODES, matchedSetDesigns, setCodeFor, setCodes} from '~/lib/matching-set-codes';

type Storefront = Parameters<typeof loadMatchingSets>[0];

export async function syncSetCodes(
  cart: HydrogenCart,
  storefront: Storefront,
  result: CartQueryDataReturn,
): Promise<CartQueryDataReturn> {
  // Cart changes return only the cart id, so read the full cart.
  const cartId = result.cart?.id;
  if (!cartId) return result;
  const current = await cart.get({cartId});
  if (!current?.id) return result;
  const index = await loadMatchingSets(storefront);
  if (!Object.keys(index).length) return result;
  const known = setCodes(index);
  const isSet = (c: string) => known.has(c.toUpperCase());

  const applied = (current.discountCodes ?? []) as Array<{code: string; applicable: boolean}>;
  const others = applied.filter((d) => !isSet(d.code));
  const handles = (current.lines?.nodes ?? [])
    .map((l) => (l as {merchandise?: {product?: {handle?: string}}}).merchandise?.product?.handle)
    .filter((h): h is string => !!h);

  const wanted = others.some((d) => d.applicable)
    ? []
    : matchedSetDesigns(index, handles)
        .map(setCodeFor)
        .slice(0, MAX_CART_CODES - others.length);

  const have = applied.filter((d) => isSet(d.code)).map((d) => d.code.toUpperCase()).sort();
  if (have.join() === [...wanted].sort().join()) return result;

  const next = await cart.updateDiscountCodes([...others.map((d) => d.code), ...wanted], {
    cartId: current.id,
  });
  return next.cart ? next : result;
}
