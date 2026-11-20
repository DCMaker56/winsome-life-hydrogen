/*
 * /matching-sets — every matching set (Sydney, Nov 2026), from the home
 * page's "See more matching sets". Each set: two of its pieces side by
 * side, its name, and a link to shop it. Sets come from Shopify's
 * "Matching set" field (~/lib/matching-sets); buying two different pieces
 * of one set saves 10% (~/lib/matching-set-codes).
 */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/matching-sets';
import MatchingSetsShowcase, {VETERANS_DAY_SETS, type FeaturedSet} from '~/components/MatchingSetsShowcase';
import {loadMatchingSets, SET_DISCOUNT_PERCENT} from '~/lib/matching-sets';

export const meta: Route.MetaFunction = () => [
  {title: 'Matching Stationery Sets | The Winsome Life'},
  {
    name: 'description',
    content: `Personalized notepads, notecards and more in matching designs. Buy two different pieces of a set and save ${SET_DISCOUNT_PERCENT}%.`,
  },
];

export async function loader({context}: Route.LoaderArgs) {
  const index = await loadMatchingSets(context.storefront as never);
  // Every set with two or more pieces, military branches first, then A–Z.
  const military = new Set(VETERANS_DAY_SETS);
  const sets: FeaturedSet[] = Object.entries(index)
    .filter(([, pieces]) => pieces.length >= 2)
    .sort(([a], [b]) => Number(military.has(b)) - Number(military.has(a)) || a.localeCompare(b))
    .map(([design, pieces]) => ({design, pieces: pieces.slice(0, 2)}));
  return {sets};
}

export default function MatchingSetsPage() {
  const {sets} = useLoaderData<typeof loader>();
  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen">
      <header className="container max-w-4xl mx-auto px-5 pt-14 pb-2 text-center">
        <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#2D2D2D]/70">
          Matching Sets &middot; Save {SET_DISCOUNT_PERCENT}%
        </p>
        <h1 className="mt-3 font-serif font-medium text-4xl md:text-5xl text-[#2D2D2D] leading-tight">
          Complete the{' '}
          <span
            className="inline-block text-[1.35em] leading-none relative top-[0.3em]"
            style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
          >
            Set
          </span>
        </h1>
        <p className="mt-7 font-sans font-light text-base md:text-[17px] text-[#2D2D2D] max-w-xl mx-auto leading-relaxed">
          The same artwork across your notepad, notecards and more. Buy two different pieces of the
          same set and save {SET_DISCOUNT_PERCENT}% automatically at checkout.
        </p>
        <p className="mt-2 font-sans text-sm text-[#2D2D2D]/55">{sets.length} matching sets</p>
      </header>
      <div className="-mt-6">
        <MatchingSetsShowcase sets={sets} heading={false} />
      </div>
    </main>
  );
}
