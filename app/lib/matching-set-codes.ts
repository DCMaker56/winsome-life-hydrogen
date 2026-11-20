/*
 * Matching-set discount codes (Sydney, Nov 2026). Each matching set has its
 * own Shopify code, e.g. "Red & Green Tartan" → REDGREENTARTANSET: 10% off
 * that design's pieces (Shopify collection set-<design>, minimum 2 items).
 * The website adds a set's code to the cart when the cart holds two
 * different pieces of that design, and takes it off when it doesn't — so
 * the 10% only rewards true matches (duck notepad + duck notecards), not
 * any two set items.
 *
 * A new matching set needs its code and collection created in Shopify (ask
 * Claude); until then that set simply gets no discount.
 */
import type {MatchingSetsIndex} from '~/lib/matching-sets';

/** Shopify allows at most 5 discount codes on one order. */
export const MAX_CART_CODES = 5;

export const setCodeFor = (design: string) =>
  design.toUpperCase().replace(/[^A-Z0-9]/g, '') + 'SET';

/** Designs that have 2+ different pieces among these product handles. */
export function matchedSetDesigns(index: MatchingSetsIndex, handles: Iterable<string>): string[] {
  const inCart = new Set(handles);
  return Object.entries(index)
    .filter(([, pieces]) => pieces.filter((p) => inCart.has(p.handle)).length >= 2)
    .map(([design]) => design)
    .sort();
}

/** All set codes, → design name. */
export function setCodes(index: MatchingSetsIndex): Map<string, string> {
  return new Map(Object.keys(index).map((d) => [setCodeFor(d), d]));
}
