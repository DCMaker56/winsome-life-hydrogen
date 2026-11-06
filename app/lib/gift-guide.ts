/*
 * The Holiday Gift Guide (Sydney, Nov 2026): "Who are you shopping for?"
 * tiles on the home page teaser and the /gift-guide page. Each tile opens a
 * collection (everything in it). Pictures come from the collection's image,
 * or its first product's photo, unless `image` is set.
 */

export type Recipient = {
  label: string;
  /** Collection whose picture the tile uses. */
  imageFrom: string;
  href: string;
  image?: string;
};

export const RECIPIENTS: Recipient[] = [
  {label: 'For Him', imageFrom: 'mens', href: '/collections/mens'},
  {label: 'For the Couple', imageFrom: 'family-couples', href: '/collections/family-couples'},
  {label: 'Teachers', imageFrom: 'teacher', href: '/collections/teacher'},
  {label: 'Little Ones', imageFrom: 'baby', href: '/collections/baby'},
  {label: 'Dog & Cat Lovers', imageFrom: 'dogs', href: '/collections/dogs'},
  {label: 'Sports Fans', imageFrom: 'sports-1', href: '/collections/sports-1'},
  {label: 'Mahjong Players', imageFrom: 'mahjong', href: '/collections/mahjong'},
  {label: 'The Hostess', imageFrom: 'wine-tags-1', href: '/collections/all?type=wine-tags-1,place-cards'},
  {label: 'The Faithful', imageFrom: 'christian-1', href: '/collections/christian-1'},
  {label: 'Clients & Colleagues', imageFrom: 'business-professional', href: '/collections/business-professional'},
  {label: 'Military Families', imageFrom: 'military', href: '/collections/military'},
];

/** Shop by budget — Shop All with the price filter. */
export const BUDGETS = [
  {label: 'Under $25', note: 'Stocking stuffers', href: '/collections/all?price=under-25'},
  {label: '$25 – $50', note: 'Thoughtful gifts', href: '/collections/all?price=25-50'},
  {label: '$50 & Up', note: 'Something special', href: '/collections/all?price=50-up'},
];

/** One query for every tile's picture (collection image or first product). */
export function recipientImagesQuery(handles: string[]) {
  return `
    query GiftGuideImages($country: CountryCode, $language: LanguageCode)
      @inContext(country: $country, language: $language) {
      ${handles
        .map(
          (h, i) =>
            `r${i}: collection(handle: ${JSON.stringify(h)}) { image { url } products(first: 1) { nodes { featuredImage { url } } } }`,
        )
        .join('\n')}
    }
  `;
}

type CollImg = {
  image?: {url: string} | null;
  products?: {nodes: Array<{featuredImage?: {url: string} | null}>};
} | null;

export async function loadRecipients(storefront: {
  query: <T>(q: string, o?: {cache?: unknown}) => Promise<T>;
  CacheShort: () => unknown;
}) {
  const handles = RECIPIENTS.map((r) => r.imageFrom);
  const data = await storefront
    .query<Record<string, CollImg>>(recipientImagesQuery(handles), {cache: storefront.CacheShort()})
    .catch(() => ({}) as Record<string, CollImg>);
  return RECIPIENTS.map((r, i) => {
    const c = data?.[`r${i}`];
    return {
      label: r.label,
      href: r.href,
      image: r.image ?? c?.image?.url ?? c?.products?.nodes?.[0]?.featuredImage?.url ?? null,
    };
  });
}
