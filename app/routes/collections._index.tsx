/**
 * /collections — "Shop by Interest" browser.
 *
 * The brand's moat is niche coverage ("every niche, covered"), so this page
 * leads with interests (dogs, sports, teacher, greek life…) and keeps the
 * product formats (notecards, notepads…) as a secondary rail.
 */
import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';

export const meta: Route.MetaFunction = () => [
  {title: 'Shop by Interest | The Winsome Life'},
  {
    name: 'description',
    content:
      'Personalized stationery for every interest — pets, sports, teachers, travel, and more. Whatever their thing is, we make stationery for it.',
  },
];

/** Product-format collections — everything else is an interest/niche. */
const FORMAT_HANDLES = new Set([
  'notecards',
  'notepads',
  'gift-tags-stickers',
  'wine-tags-1',
  'calendars',
  'artwork',
  'place-cards',
  'holiday-photo-cards',
  'bestsellers',
]);

const TILE_TONES = ['bg-[#F6F2EA]', 'bg-[#EFEAE2]', 'bg-[#F3EEE9]', 'bg-[#EAE5DC]'];

export async function loader({context}: Route.LoaderArgs) {
  const {collections} = await context.storefront.query(COLLECTIONS_QUERY);
  const nodes = collections?.nodes ?? [];
  return {
    interests: nodes.filter(
      (c: {handle: string}) => !FORMAT_HANDLES.has(c.handle),
    ),
    formats: nodes.filter(
      (c: {handle: string}) =>
        FORMAT_HANDLES.has(c.handle) && c.handle !== 'bestsellers',
    ),
  };
}

interface CollectionTile {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: {url: string; altText?: string | null} | null;
  products?: {nodes: Array<{featuredImage?: {url: string} | null}>};
}

/** Collection image, falling back to its first product's photo. */
function tileImage(c: CollectionTile): string | null {
  return c.image?.url ?? c.products?.nodes?.[0]?.featuredImage?.url ?? null;
}

export default function CollectionsIndex() {
  const {interests, formats} = useLoaderData<typeof loader>();

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      {/* Header */}
      <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-10 lg:pt-14 pb-2 text-center">
        <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-6">
          Every Niche, Covered
        </p>
        <h1 className="font-serif font-medium text-4xl md:text-5xl text-[#2D2D2D] mb-4">
          Shop by{' '}
          <span
            className="text-[#C9A96E]"
            style={{
              fontFamily: "'Parisian Script', 'Great Vibes', cursive",
              fontSize: '1.15em',
              lineHeight: '1',
              verticalAlign: '-0.05em',
            }}
          >
            Interest
          </span>
        </h1>
        <p className="font-sans font-light text-base text-[#2D2D2D]/65 max-w-xl mx-auto">
          Whatever their thing is — we make stationery for it. Find the perfect
          personalized gift by what they love.
        </p>
        <div className="gold-rule w-20 mx-auto mt-6" />
      </section>

      {/* Interest tiles */}
      <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-10">
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {(interests as CollectionTile[]).map((c, i) => {
            const img = tileImage(c);
            return (
              <li key={c.id}>
                <Link
                  to={`/collections/${c.handle}`}
                  prefetch="intent"
                  className={`group relative flex flex-col justify-end aspect-[4/3] overflow-hidden ring-1 ring-[#C9A96E]/15 hover:ring-[#C9A96E] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
                    img ? '' : TILE_TONES[i % TILE_TONES.length]
                  }`}
                >
                  {img && (
                    <>
                      <img
                        src={img}
                        alt=""
                        loading={i < 8 ? 'eager' : 'lazy'}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        aria-hidden
                      />
                      <span
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(45,45,45,0.66) 0%, rgba(45,45,45,0.12) 55%, rgba(45,45,45,0.04) 100%)',
                        }}
                        aria-hidden
                      />
                    </>
                  )}
                  <span className="relative p-4 lg:p-5">
                    <span
                      className={`block font-serif font-medium text-lg lg:text-xl leading-tight ${
                        img ? 'text-white' : 'text-[#2D2D2D]'
                      }`}
                    >
                      {c.title}
                    </span>
                    <span
                      className={`font-sans font-medium text-[10px] tracking-[0.18em] uppercase ${
                        img ? 'text-[#e7d4ac]' : 'text-[#C9A96E]'
                      } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    >
                      Shop →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Formats rail */}
      {formats.length > 0 && (
        <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-16">
          <div className="flex items-baseline justify-between mb-6 border-b border-[#C9A96E]/15 pb-4">
            <h2 className="font-serif font-medium text-2xl text-[#2D2D2D]">
              Or shop by product
            </h2>
            <Link
              to="/collections/all"
              className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#C9A96E] hover:text-[#2D2D2D] transition-colors"
            >
              View everything →
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2.5">
            {(formats as CollectionTile[]).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/collections/${c.handle}`}
                  prefetch="intent"
                  className="inline-flex items-center font-sans font-medium text-sm text-[#2D2D2D] bg-white ring-1 ring-[#C9A96E]/25 hover:ring-[#C9A96E] hover:text-[#C9A96E] transition-all px-5 py-2.5 focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query StoreCollectionsIndex($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 60, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        description
        image { url altText }
        products(first: 1) {
          nodes {
            featuredImage { url }
          }
        }
      }
    }
  }
` as const;
