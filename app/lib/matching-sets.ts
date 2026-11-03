/*
 * Matching sets — products that share the same artwork, offered together as
 * "Complete the set" on product pages and in the cart.
 *
 * PILOT (Sydney, Nov 2026): three designs, set by hand here. Each piece's
 * `label` is how the buttons name it ("Add the Notecards"). Once the pilot
 * proves out, this moves to a "Design" label on each product in Shopify so
 * every matching design is picked up automatically.
 *
 * The 10% set discount itself is a Shopify automatic discount (created when
 * the pilot is published); the site only advertises it.
 */

export type SetPiece = {handle: string; label: string};
export type MatchingSet = {design: string; pieces: SetPiece[]};

export const SET_DISCOUNT_PERCENT = 10;

export const MATCHING_SETS: MatchingSet[] = [
  {
    design: 'Mallard',
    pieces: [
      {
        handle:
          'duck-hunting-notepad-personalized-mallard-notepad-duck-hunting-gift-custom-duck-notepad',
        label: 'Notepad',
      },
      {
        handle:
          'personalized-duck-hunting-stationery-set-stationary-mallard-flat-notecards-duck-hunter-gift-present-for-hunting-lover',
        label: 'Notecards',
      },
    ],
  },
  {
    design: 'Pheasant',
    pieces: [
      {handle: 'personalized-pheasant-bird-notepad-pheasant-hunting-gift', label: 'Notepad'},
      {
        handle:
          'personalized-pheasant-hunting-stationery-set-stationary-pheasant-flat-notecards-bird-hunter-gift-present-for-hunting-lover',
        label: 'Notecards',
      },
    ],
  },
  {
    design: 'Rainbow Trout',
    pieces: [
      {
        handle:
          'fishing-notepad-personalized-rainbow-trout-notepad-id-rather-be-fishing-fisherman-gift',
        label: 'Notepad',
      },
      {
        handle: 'personalized-fishing-stationery-rainbow-trout-flat-notecards',
        label: 'Notecards',
      },
    ],
  },
];

/** Accessories suggested alongside any set piece ("Also pairs well"). */
export const SET_ACCESSORIES_COLLECTION = 'gift-tags-stickers';

export function findSet(handle: string) {
  const set = MATCHING_SETS.find((s) => s.pieces.some((p) => p.handle === handle));
  if (!set) return null;
  const self = set.pieces.find((p) => p.handle === handle)!;
  return {design: set.design, self, others: set.pieces.filter((p) => p.handle !== handle)};
}

/** Every handle in a pilot set (for the cart's "Complete the collection"). */
export function isSetPiece(handle: string) {
  return MATCHING_SETS.some((s) => s.pieces.some((p) => p.handle === handle));
}

export type SetCardProduct = {
  handle: string;
  title: string;
  label: string;
  image: string | null;
  price: number;
};
