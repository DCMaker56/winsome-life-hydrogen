/*
 * "Complete the Set, save 10%" (Sydney, Nov 2026) — a few of the best
 * matching sets on the home page, each as its notepad and notecards side by
 * side. Replaces "Notes Worth Saluting" after Veterans Day. Sets come from
 * Shopify's "Matching set" field (~/lib/matching-sets); FEATURED picks them.
 */
import {Link} from 'react-router';
import {SET_DISCOUNT_PERCENT, type SetCardProduct} from '~/lib/matching-sets';

/** Matching set names to feature, in this order. */
export const FEATURED_SETS = ['Red & Green Tartan', 'Mahjong', 'Dog', 'Hydrangea'];

/** Veterans Day edition (through Nov 11): the military matching sets. */
export const VETERANS_DAY_SETS = ['US Army', 'US Navy', 'US Air Force', 'US Marine Corps', 'US Coast Guard'];

export type FeaturedSet = {design: string; pieces: SetCardProduct[]};

const script = {fontFamily: "'Parisian Script', 'Great Vibes', cursive"} as const;
const sized = (url: string, w: number) => `${url}${url.includes('?') ? '&' : '?'}width=${w}`;
const kind = (p: SetCardProduct) => (/notepad/i.test(p.title) ? 'Notepad' : 'Notecards');

export default function MatchingSetsShowcase({
  sets,
  veteransDay = false,
}: {
  sets: FeaturedSet[];
  /** Veterans Day edition: military sets, honoring copy. */
  veteransDay?: boolean;
}) {
  if (!sets.length) return null;
  return (
    <section className="py-20 lg:py-24 bg-[#FAF8F5]" aria-labelledby="sets-title">
      <div className="container max-w-7xl">
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#2D2D2D] mb-3">
            {veteransDay ? 'Honoring Veterans Day \u00b7 November 11' : `Matching Sets \u00b7 Save ${SET_DISCOUNT_PERCENT}%`}
          </p>
          <h2 id="sets-title" className="font-serif font-medium text-3xl md:text-[2.6rem] text-[#2D2D2D] leading-tight">
            {veteransDay ? 'Notes Worth' : 'Complete the'}{' '}
            <span className="inline-block text-[1.35em] leading-none relative top-[0.3em] ml-[0.05em]" style={script}>
              {veteransDay ? 'Saluting' : 'Set'}
            </span>
          </h2>
          <p className="font-sans font-light text-base md:text-[17px] text-[#2D2D2D] max-w-xl mx-auto mt-6 leading-relaxed">
            {veteransDay
              ? `Thank the veterans in your life with a personalized note. Pair the notepad and notecards for every branch and save ${SET_DISCOUNT_PERCENT}% automatically at checkout.`
              : `The same artwork on your notepad and notecards. Buy two or more pieces of a matching set and save ${SET_DISCOUNT_PERCENT}% automatically at checkout.`}
          </p>
        </div>

        <ul className={`grid sm:grid-cols-2 gap-6 ${sets.length === 5 ? 'lg:grid-cols-5 lg:gap-5' : 'lg:grid-cols-4'}`}>
          {sets.map((set) => {
            const [a, b] = set.pieces;
            return (
              <li key={set.design} className="bg-white shadow-[0_12px_30px_-20px_rgba(45,45,45,0.35)] flex flex-col">
                <div className="relative grid grid-cols-2 gap-px bg-[#2D2D2D]/5">
                  {[a, b].map((p) => (
                    <Link key={p.handle} to={`/products/${p.handle}`} prefetch="intent" className="group block bg-white">
                      <span className="block aspect-square overflow-hidden">
                        {p.image && (
                          <img
                            src={sized(p.image, 400)}
                            alt={`${set.design} ${kind(p)}`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        )}
                      </span>
                      <span className="block text-center font-sans text-[11px] tracking-[0.16em] uppercase text-[#2D2D2D] py-2">
                        {kind(p)}
                      </span>
                    </Link>
                  ))}
                  <span className="absolute top-3 left-3 bg-[#2D2D2D] text-white font-sans font-semibold text-[10px] tracking-[0.16em] uppercase px-2.5 py-1">
                    Save {SET_DISCOUNT_PERCENT}%
                  </span>
                </div>
                <div className="px-5 py-5 text-center flex-1 flex flex-col">
                  <p className="font-serif text-xl text-[#2D2D2D]">{set.design}</p>
                  <p className="font-sans text-[13px] text-[#2D2D2D]/70 mt-1">
                    Notepad from ${a.price.toFixed(2)} &middot; Notecards from ${b.price.toFixed(2)}
                  </p>
                  <Link
                    to={`/products/${a.handle}`}
                    prefetch="intent"
                    className="mt-4 self-center inline-flex items-center gap-2 font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-[#2D2D2D] border-b border-[#2D2D2D]/40 hover:border-[#2D2D2D] pb-0.5"
                  >
                    Shop the set <span aria-hidden>&rarr;</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
