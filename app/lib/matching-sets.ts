/*
 * Matching sets — products that share the same artwork, offered together as
 * "Complete the set" on product pages, in the Added-to-cart pop-up and in
 * the cart.
 *
 * Managed in Shopify admin (Sydney, Nov 2026): each product's "Matching set"
 * field (metafield winsome.matching_set) holds its design name, e.g.
 * "Mallard". Products with the same name are one set. The "Matching Sets"
 * collection (handle matching-sets) gathers every product whose field is one
 * of the set names, and the "Matching Set: 10% off" automatic discount
 * applies to that collection (2 or more pieces).
 *
 * A brand-new design name must also be added to the Matching Sets
 * collection's condition in Shopify admin (the collection only matches the
 * names it lists). Adding a product to an existing set needs only the field.
 */

export const SET_DISCOUNT_PERCENT = 10;
export const MATCHING_SETS_COLLECTION = 'matching-sets';

/** Accessories suggested alongside any set piece ("Also pairs well"). */
export const SET_ACCESSORIES_COLLECTION = 'gift-tags-stickers';

export type SetCardProduct = {
  handle: string;
  title: string;
  /** How buttons name it: "Add the Notecards". */
  label: string;
  image: string | null;
  price: number;
};

/** Design name → its pieces (notepads first, then flat, then folded notecards). */
export type MatchingSetsIndex = Record<string, SetCardProduct[]>;

type Storefront = {
  query: <T>(q: string, o?: {cache?: unknown}) => Promise<T>;
  CacheShort: () => unknown;
};

type SetNode = {
  handle: string;
  title: string;
  featuredImage: {url: string} | null;
  priceRange: {minVariantPrice: {amount: string}};
  matchingSet: {value: string} | null;
  matchingSet2: {value: string} | null;
};

const MATCHING_SETS_QUERY = `
  query MatchingSets($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collection(handle: "${MATCHING_SETS_COLLECTION}") {
      products(first: 250) {
        nodes {
          handle
          title
          featuredImage { url }
          priceRange { minVariantPrice { amount } }
          matchingSet: metafield(namespace: "winsome", key: "matching_set") { value }
          matchingSet2: metafield(namespace: "winsome", key: "matching_set_2") { value }
        }
      }
    }
  }
`;

const ORDER = [
  'Notepad',
  'Notecards',
  'Folded Notecards',
  'Photo Card',
  'Gift Tags',
  'Wine Tags',
  'Place Cards',
  'Coasters',
];

/** What kind of piece it is ("Notepad", "Wine Tags", …), from the product title. */
function pieceKind(title: string) {
  const t = title.split('|')[0].toLowerCase();
  if (t.includes('notepad')) return 'Notepad';
  if (t.includes('wine tag') || t.includes('bottle tag')) return 'Wine Tags';
  if (t.includes('gift tag') || t.includes('sticker')) return 'Gift Tags';
  if (t.includes('place card')) return 'Place Cards';
  if (t.includes('coaster')) return 'Coasters';
  if (t.includes('photo card') || t.includes('christmas card') || t.includes('holiday card'))
    return 'Photo Card';
  if (t.includes('folded') || t.includes('greeting card')) return 'Folded Notecards';
  return 'Notecards';
}

/** "Personalized Dog & Bow Stationery Set / Stationary | …" → "Dog & Bow Stationery Set" */
function cleanTitle(title: string) {
  return title
    .split('|')[0]
    .replace(/\s*\/\s*Stationary\b/i, '')
    .replace(/^(Personalized|Custom)\s+/i, '')
    .trim();
}

/** Every matching set, from Shopify. Never throws (an empty index hides the feature). */
export async function loadMatchingSets(storefront: Storefront): Promise<MatchingSetsIndex> {
  const data = await storefront
    .query<{collection: {products: {nodes: SetNode[]}} | null}>(MATCHING_SETS_QUERY, {
      cache: storefront.CacheShort(),
    })
    .catch(() => null);
  const index: MatchingSetsIndex = {};
  for (const p of data?.collection?.products.nodes ?? []) {
    // A product can be in two sets ("Also in matching set", e.g. coasters
    // that come in red or blue).
    const designs = new Set(
      [p.matchingSet?.value, p.matchingSet2?.value].map((d) => d?.trim()).filter(Boolean) as string[],
    );
    for (const design of designs) {
      (index[design] ??= []).push({
        handle: p.handle,
        title: p.title,
        label: pieceKind(p.title),
        image: p.featuredImage?.url ?? null,
        price: Number(p.priceRange.minVariantPrice.amount),
      });
    }
  }
  for (const pieces of Object.values(index)) {
    pieces.sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label));
    // Two pieces of the same kind (e.g. two dog notecards): name them by title.
    for (const p of pieces) {
      if (pieces.filter((q) => q.label === p.label).length > 1) p.label = cleanTitle(p.title);
    }
  }
  return index;
}

/**
 * This product's set: its own piece and the others. A product in two sets
 * gets the pieces of both (no repeats).
 */
export function findSet(index: MatchingSetsIndex | null | undefined, handle: string) {
  if (!index) return null;
  let found: {design: string; self: SetCardProduct; others: SetCardProduct[]} | null = null;
  for (const [design, pieces] of Object.entries(index)) {
    const self = pieces.find((p) => p.handle === handle);
    if (!self || pieces.length < 2) continue;
    const others = pieces.filter((p) => p.handle !== handle);
    if (!found) found = {design, self, others: [...others]};
    else
      found.others.push(...others.filter((o) => !found!.others.some((f) => f.handle === o.handle)));
  }
  return found;
}
