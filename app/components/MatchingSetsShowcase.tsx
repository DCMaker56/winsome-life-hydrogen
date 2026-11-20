/*
 * "Complete the Set, save 10%" (Sydney, Nov 2026) — a few of the best
 * matching sets on the home page, each as its notepad and notecards side by
 * side. Through Veterans Day it's the "Matching U.S. Military Sets" edition
 * (navy with red, white and gold accents); after, "Complete the Set". Sets come from
 * Shopify's "Matching set" field (~/lib/matching-sets); FEATURED picks them.
 */
import {Link} from 'react-router';
import {SET_DISCOUNT_PERCENT, type SetCardProduct} from '~/lib/matching-sets';

/** Matching set names to feature, in this order (Sydney, Nov 2026). */
export const FEATURED_SETS = ['Dog', 'Cat', 'Hydrangea', 'Mallard', 'Lacrosse'];

/** The military edition: one set per branch. */
export const VETERANS_DAY_SETS = ['US Army', 'US Navy', 'US Air Force', 'US Marine Corps', 'US Coast Guard'];

export type FeaturedSet = {design: string; pieces: SetCardProduct[]};

const script = {fontFamily: "'Parisian Script', 'Great Vibes', cursive"} as const;
const sized = (url: string, w: number) => `${url}${url.includes('?') ? '&' : '?'}width=${w}`;
const kind = (p: SetCardProduct) => p.label || (/notepad/i.test(p.title) ? 'Notepad' : 'Notecards');

export default function MatchingSetsShowcase({
  sets,
  veteransDay = false,
  seeAll = false,
  heading = true,
}: {
  sets: FeaturedSet[];
  /** Military edition: navy with red, white and gold; the branch sets. */
  veteransDay?: boolean;
  /** "See more matching sets" button to /matching-sets. */
  seeAll?: boolean;
  /** Show the section heading (off on the Matching Sets page). */
  heading?: boolean;
}) {
  if (!sets.length) return null;
  return (
    <section
      className={`relative py-20 lg:py-24 ${veteransDay ? 'bg-[#1B2A4A]' : 'bg-[#FAF8F5]'}`}
      aria-labelledby="sets-title"
    >
      {/* Veterans Day: red, white and navy stripe along the top. */}
      {veteransDay && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-2 flex">
          <span className="flex-1 bg-[#B22234]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#B22234]" />
        </div>
      )}
      <div className="container max-w-7xl">
        {heading && (
        <div className="text-center mb-12">
          {veteransDay && (
            <p aria-hidden className="text-[#E8B04B] tracking-[0.6em] text-sm mb-3">&#9733; &#9733; &#9733;</p>
          )}
          <p className={`font-sans font-medium text-xs tracking-[0.3em] uppercase mb-3 ${veteransDay ? 'text-white' : 'text-[#2D2D2D]'}`}>
            {veteransDay ? `For Those Who Serve \u00b7 Save ${SET_DISCOUNT_PERCENT}%` : `Matching Sets \u00b7 Save ${SET_DISCOUNT_PERCENT}%`}
          </p>
          <h2
            id="sets-title"
            className={`font-serif font-medium text-3xl md:text-[2.6rem] leading-tight ${veteransDay ? 'text-white' : 'text-[#2D2D2D]'}`}
          >
            {veteransDay ? 'Matching' : 'Complete the'}{' '}
            <span
              className={`inline-block text-[1.35em] leading-none relative top-[0.3em] ml-[0.05em] ${veteransDay ? 'text-[#E8B04B]' : ''}`}
              style={script}
            >
              {veteransDay ? 'U.S. Military' : 'Set'}
            </span>{veteransDay ? ' Sets' : ''}
          </h2>
          <p
            className={`font-sans font-light text-base md:text-[17px] max-w-xl mx-auto mt-6 leading-relaxed ${veteransDay ? 'text-white/90' : 'text-[#2D2D2D]'}`}
          >
            {veteransDay
              ? `Every branch has a matching notepad and notecards, perfect for the service members and veterans in your life. Buy both and save ${SET_DISCOUNT_PERCENT}% automatically at checkout.`
              : `The same artwork on your notepad and notecards. Buy two different pieces of the same set and save ${SET_DISCOUNT_PERCENT}% automatically at checkout.`}
          </p>
        </div>
        )}

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
                </div>
                <div className="px-5 py-5 text-center flex-1 flex flex-col">
                  {/* Below the photos so it never covers them (Sydney). */}
                  <span className={`self-center mb-2 ${veteransDay ? 'bg-[#B22234]' : 'bg-[#2D2D2D]'} text-white font-sans font-semibold text-[10px] tracking-[0.16em] uppercase px-2.5 py-1`}>
                    Save {SET_DISCOUNT_PERCENT}% on the set
                  </span>
                  <p className="font-serif text-xl text-[#2D2D2D]">{set.design}</p>
                  <p className="font-sans text-[13px] text-[#2D2D2D]/70 mt-1">
                    {kind(a)} from ${a.price.toFixed(2)} &middot; {kind(b)} from ${b.price.toFixed(2)}
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
        {seeAll && (
          <div className="text-center mt-12">
            <Link
              to="/matching-sets"
              className={`inline-flex items-center gap-2 px-9 py-3.5 font-sans font-medium text-[12px] tracking-[0.18em] uppercase transition-colors ${
                veteransDay ? 'bg-white text-[#1B2A4A] hover:bg-[#E8B04B]' : 'bg-[#2D2D2D] text-white hover:bg-[#C9A96E]'
              }`}
            >
              See more matching sets <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
