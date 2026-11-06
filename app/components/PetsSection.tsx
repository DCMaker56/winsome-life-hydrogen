/*
 * "For the Love of Dogs & Cats" (Sydney, Nov 2026) — replaces Trending &
 * Popular on the home page. Holiday pet pieces featured large (with a
 * Holiday ribbon), year-round pet favorites below, and a link to the Dogs &
 * Cats collection. Products come from that collection (home loader); the
 * handle lists below pick and order them.
 */
import {Link} from 'react-router';

export type PetProduct = {
  handle: string;
  title: string;
  image: string | null;
  price: number | null;
};

/** Featured large, in this order (holiday pieces). */
const HOLIDAY = [
  'personalized-christmas-dog-gift-tags-customize-your-dog-breed',
  'personalized-dog-bow-stationery-set-stationary-dog-breed-flat-notecards-christmas-bow-dog-lover-gift',
  'plaid-dog-christmas-card-happy-pawlidays-holiday-photo-card-for-dogs',
];
/** Year-round favorites, in this order. */
const EVERYDAY = [
  'custom-dog-stationery-stationary-choose-your-dog-breed-custom-canine-notecards-dog-lover-gift-ability-to-add-multiple-dogs-1',
  'custom-cat-stationery-stationary-choose-your-cat-breed-cat-lover-gift',
  'personalized-dog-notepad-dog-lover-gift-customize-with-dog-of-your-choice-name-customize-with-multiple-dogs',
  'personalized-cat-notepad-cat-lover-gift-customize-with-cat-of-your-choice-name-customize-with-multiple-cats',
  'custom-dog-coasters-customize-dog-breed-text',
  'personalized-dog-bookmark-customize-your-dog-breed-and-text',
];

/** Short display names (Shopify titles are long, keyword-heavy listings). */
const NAMES: Record<string, string> = {
  [HOLIDAY[0]]: 'Christmas Dog Gift Tags',
  [HOLIDAY[1]]: 'Dog & Christmas Bow Notecards',
  [HOLIDAY[2]]: 'Happy Pawlidays Photo Card',
  [EVERYDAY[0]]: 'Dog Stationery',
  [EVERYDAY[1]]: 'Cat Stationery',
  [EVERYDAY[2]]: 'Dog Notepad',
  [EVERYDAY[3]]: 'Cat Notepad',
  [EVERYDAY[4]]: 'Dog Coasters',
  [EVERYDAY[5]]: 'Dog Bookmark',
};

/** Hand-drawn style red ribbon bow (holiday accent). */
function Bow({className = ''}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden focusable="false">
      {/* tails */}
      <path d="M55 44 C50 56 44 66 37 78 L46 75 L50 83 C56 70 60 57 61 46 Z" fill="#8E2824" />
      <path d="M65 44 C70 56 76 66 83 78 L74 75 L70 83 C64 70 60 57 59 46 Z" fill="#8E2824" />
      {/* loops */}
      <path d="M60 40 C48 20 24 8 13 18 C3 28 14 46 34 47 C44 47.5 53 45 60 40 Z" fill="#A8322D" />
      <path d="M60 40 C72 20 96 8 107 18 C117 28 106 46 86 47 C76 47.5 67 45 60 40 Z" fill="#A8322D" />
      {/* loop folds */}
      <path d="M58 39 C46 28 30 21 22 25 C30 24 44 31 56 41 Z" fill="#7A211E" opacity=".55" />
      <path d="M62 39 C74 28 90 21 98 25 C90 24 76 31 64 41 Z" fill="#7A211E" opacity=".55" />
      <path d="M22 22 C30 16 44 22 52 30" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M98 22 C90 16 76 22 68 30" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* knot */}
      <rect x="52" y="33" width="16" height="15" rx="5" fill="#962C28" />
      <path d="M55 37 C58 35 62 35 65 37" stroke="#fff" strokeOpacity=".35" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const name = (p: PetProduct) => NAMES[p.handle] ?? p.title.split('|')[0].trim();
const script = {fontFamily: "'Parisian Script', 'Great Vibes', cursive", lineHeight: 0.9} as const;

function pick(products: PetProduct[], handles: string[]) {
  return handles
    .map((h) => products.find((p) => p.handle === h))
    .filter((p): p is PetProduct => !!p);
}

export default function PetsSection({products}: {products: PetProduct[]}) {
  const holiday = pick(products, HOLIDAY);
  const everyday = pick(products, EVERYDAY);
  if (!holiday.length && !everyday.length) return null;

  return (
    <section className="py-20 lg:py-24 bg-[#E4EBDF]" aria-labelledby="pets-title">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <Bow className="mx-auto mb-4 w-[72px] md:w-[84px] h-auto drop-shadow-[0_4px_6px_rgba(122,33,30,0.18)]" />
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#A8322D] mb-4">
            For the Love of Dogs &amp; Cats
          </p>
          <h2
            id="pets-title"
            className="font-serif font-medium text-[2.2rem] md:text-[2.8rem] text-[#2D2D2D] leading-tight"
          >
            Made for the{' '}
            <span
              className="inline-block ml-[0.3em] mr-[0.12em] text-[#A8322D] align-[-0.04em]"
              style={{...script, fontSize: '1.3em'}}
            >
              furry
            </span>{' '}
            family
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/70 max-w-xl mx-auto mt-4 leading-relaxed">
            Choose their breed or send us a photo, and add up to four
            pets. Hand-painted portraits as one of a kind as they are.
          </p>
        </div>

        {/* Holiday pieces, featured large */}
        {holiday.length > 0 && (
          <ul className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-5 lg:gap-7 sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {holiday.map((p) => (
              <li key={p.handle} className="snap-center shrink-0 w-[78%] sm:w-auto">
                <Link
                  to={`/products/${p.handle}`}
                  prefetch="intent"
                  className="group block h-full bg-white shadow-[0_12px_30px_-18px_rgba(45,45,45,0.35)] hover:shadow-[0_18px_40px_-18px_rgba(45,45,45,0.45)] hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {p.image && (
                      <img
                        src={`${p.image}${p.image.includes('?') ? '&' : '?'}width=800`}
                        alt={name(p)}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                    <span className="absolute top-4 left-4 bg-[#A8322D] text-white font-sans font-medium text-[10px] tracking-[0.22em] uppercase pl-2 pr-3 py-1.5 inline-flex items-center gap-1.5">
                      <Bow className="w-[18px] h-auto [&_path]:fill-white [&_rect]:fill-white [&_path[stroke]]:hidden" />
                      Holiday
                    </span>
                  </div>
                  <div className="px-5 py-5 text-center">
                    <p className="font-serif text-[1.2rem] text-[#2D2D2D] leading-snug group-hover:text-[#A8322D] transition-colors">
                      {name(p)}
                    </p>
                    {p.price ? (
                      <p className="font-sans text-sm text-[#2D2D2D]/60 mt-1">
                        From ${p.price.toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Year-round favorites */}
        {everyday.length > 0 && (
          <>
            <div className="flex items-center gap-4 mt-16 mb-8">
              <span aria-hidden className="h-px flex-1 bg-[#2D2D2D]/15" />
              <p className="font-sans font-medium text-[11px] tracking-[0.25em] uppercase text-[#2D2D2D]/60">
                Year-round favorites
              </p>
              <span aria-hidden className="h-px flex-1 bg-[#2D2D2D]/15" />
            </div>
            <ul className="flex gap-5 overflow-x-auto snap-x pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-6 lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {everyday.map((p) => (
                <li key={p.handle} className="snap-start shrink-0 w-36 lg:w-auto">
                  <Link to={`/products/${p.handle}`} prefetch="intent" className="group block text-center">
                    <div className="aspect-square overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_10px_24px_-14px_rgba(45,45,45,0.4)] group-hover:ring-[#A8322D]/30 transition-all">
                      {p.image && (
                        <img
                          src={`${p.image}${p.image.includes('?') ? '&' : '?'}width=400`}
                          alt={name(p)}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        />
                      )}
                    </div>
                    <p className="font-serif text-[1.02rem] text-[#2D2D2D] leading-snug mt-4 group-hover:text-[#A8322D] transition-colors">
                      {name(p)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="text-center mt-14">
          <Link
            to="/collections/dogs"
            className="inline-flex items-center gap-2 px-9 py-3.5 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.18em] uppercase hover:bg-[#A8322D] transition-colors"
          >
            Shop All Dogs &amp; Cats <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
