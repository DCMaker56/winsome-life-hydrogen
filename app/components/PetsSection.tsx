/*
 * "For the Love of Dogs & Cats" (Sydney, Nov 2026) — replaces Trending &
 * Popular on the home page. Holiday pet pieces featured large (with a
 * Holiday ribbon), year-round pet favorites below, and a link to the Dogs &
 * Cats collection. Every product in that collection shows automatically
 * (home loader); see sortPets for how they're grouped.
 */
import {Link} from 'react-router';
import {ResponsiveImg} from '~/components/ResponsiveImg';
import bow from '~/assets/home/bow-watercolor.png';

export type PetProduct = {
  handle: string;
  title: string;
  image: string | null;
  price: number | null;
};

/** Holiday pieces lead in this order; any other holiday product follows. */
const HOLIDAY_ORDER = [
  'personalized-christmas-dog-gift-tags-customize-your-dog-breed',
  'personalized-dog-bow-stationery-set-stationary-dog-breed-flat-notecards-christmas-bow-dog-lover-gift',
  'plaid-dog-christmas-card-happy-pawlidays-holiday-photo-card-for-dogs',
];

/** Short display names (Shopify titles are long, keyword-heavy listings). */
const NAMES: Record<string, string> = {
  'personalized-christmas-dog-gift-tags-customize-your-dog-breed': 'Christmas Dog Gift Tags',
  'personalized-dog-bow-stationery-set-stationary-dog-breed-flat-notecards-christmas-bow-dog-lover-gift':
    'Dog & Christmas Bow Notecards',
  'plaid-dog-christmas-card-happy-pawlidays-holiday-photo-card-for-dogs': 'Happy Pawlidays Photo Card',
  'custom-dog-stationery-stationary-choose-your-dog-breed-custom-canine-notecards-dog-lover-gift-ability-to-add-multiple-dogs-1':
    'Dog Stationery',
  'custom-cat-stationery-stationary-choose-your-cat-breed-cat-lover-gift': 'Cat Stationery',
  'personalized-dog-notepad-dog-lover-gift-customize-with-dog-of-your-choice-name-customize-with-multiple-dogs':
    'Dog Notepad',
  'personalized-cat-notepad-cat-lover-gift-customize-with-cat-of-your-choice-name-customize-with-multiple-cats':
    'Cat Notepad',
  'custom-dog-coasters-customize-dog-breed-text': 'Dog Coasters',
  'personalized-dog-bookmark-customize-your-dog-breed-and-text': 'Dog Bookmark',
};

/** Everything in the Dogs & Cats collection shows on its own (Sydney, Nov
 * 2026): Christmas / holiday pieces in the Holiday row (Oct–Dec), everything
 * else in Year-round favorites, ordered stationery → notepads → coasters →
 * the rest. Valentine's pieces only show in January and February. */
const isHoliday = (t: string) => /christmas|holiday|pawlidays|\bbow\b/i.test(t);
const isValentine = (t: string) => /valentine/i.test(t);
const KIND_ORDER = [/stationery|notecard/i, /notepad/i, /coaster/i, /tag/i, /bookmark/i];
const kindRank = (t: string) => {
  const i = KIND_ORDER.findIndex((r) => r.test(t.split('|')[0]));
  return i === -1 ? KIND_ORDER.length : i;
};

const name = (p: PetProduct) =>
  NAMES[p.handle] ??
  p.title
    .split('|')[0]
    .replace(/\s*\/\s*Stationary\b/i, '')
    .replace(/^(Personalized|Custom)\s+/i, '')
    .trim();
const script = {fontFamily: "'Parisian Script', 'Great Vibes', cursive", lineHeight: 0.9} as const;

function sortPets(products: PetProduct[]) {
  const month = new Date().getMonth(); // 0 = Jan
  const holidaySeason = month >= 9; // Oct–Dec
  const valentineSeason = month <= 1; // Jan–Feb
  const shown = products.filter((p) => !isValentine(p.title) || valentineSeason);
  const holiday = holidaySeason ? shown.filter((p) => isHoliday(p.title)) : [];
  holiday.sort((a, b) => {
    const ia = HOLIDAY_ORDER.indexOf(a.handle);
    const ib = HOLIDAY_ORDER.indexOf(b.handle);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const everyday = shown
    .filter((p) => !holiday.includes(p) && !isHoliday(p.title))
    .sort((a, b) => kindRank(a.title) - kindRank(b.title) || Number(/cat/i.test(a.title)) - Number(/cat/i.test(b.title)));
  return {holiday, everyday};
}

export default function PetsSection({products}: {products: PetProduct[]}) {
  const {holiday, everyday} = sortPets(products);
  if (!holiday.length && !everyday.length) return null;

  return (
    <section className="py-20 lg:py-24 bg-[#123D2E]" aria-labelledby="pets-title">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <ResponsiveImg
            src={bow}
            sizes="160px"
            alt=""
            width={660}
            height={566}
            loading="lazy"
            className="mx-auto mb-5 w-[120px] md:w-[150px] h-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
          />
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-white/75 mb-4">
            For the Love of Dogs &amp; Cats
          </p>
          <h2
            id="pets-title"
            className="font-serif font-medium text-[2.2rem] md:text-[2.8rem] text-white leading-tight"
          >
            Made for the{' '}
            <span
              className="inline-block ml-[0.3em] mr-[0.12em] text-[#E9D3A6] align-[-0.04em]"
              style={{...script, fontSize: '1.3em'}}
            >
              furry
            </span>{' '}
            family
          </h2>
          <p className="font-sans font-light text-base text-white/80 max-w-xl mx-auto mt-4 leading-relaxed">
            Choose their breed or send us a photo, and add up to four
            pets. Hand-painted portraits as one of a kind as they are.
          </p>
        </div>

        {/* Holiday pieces, featured large */}
        {holiday.length > 0 && (
          <ul className={`flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-5 lg:gap-6 sm:overflow-visible ${holiday.length >= 5 ? "lg:grid-cols-5" : holiday.length === 4 ? "lg:grid-cols-4" : ""} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
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
                    <span className="absolute top-4 left-4 bg-white text-[#A8322D] shadow-sm font-sans font-medium text-[10px] tracking-[0.22em] uppercase pl-1.5 pr-3 py-1 inline-flex items-center gap-1">
                      <ResponsiveImg src={bow} sizes="40px" alt="" width={660} height={566} className="w-[24px] h-auto" />
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
              <span aria-hidden className="h-px flex-1 bg-white/25" />
              <p className="font-sans font-medium text-[11px] tracking-[0.25em] uppercase text-white/70">
                Year-round favorites
              </p>
              <span aria-hidden className="h-px flex-1 bg-white/25" />
            </div>
            <ul className={`flex gap-5 overflow-x-auto snap-x pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid ${everyday.length > 6 ? "lg:grid-cols-4 lg:gap-y-8 lg:max-w-4xl lg:mx-auto" : "lg:grid-cols-6"} lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
              {everyday.map((p) => (
                <li key={p.handle} className="snap-start shrink-0 w-36 lg:w-auto">
                  <Link to={`/products/${p.handle}`} prefetch="intent" className="group block text-center">
                    <div className="aspect-square overflow-hidden rounded-full bg-white ring-4 ring-white shadow-[0_10px_24px_-14px_rgba(45,45,45,0.4)] group-hover:ring-[#E9D3A6] transition-all">
                      {p.image && (
                        <img
                          src={`${p.image}${p.image.includes('?') ? '&' : '?'}width=400`}
                          alt={name(p)}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        />
                      )}
                    </div>
                    <p className="font-serif text-[1.02rem] text-white leading-snug mt-4 group-hover:text-[#E9D3A6] transition-colors">
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
            className="inline-flex items-center gap-2 px-9 py-3.5 bg-white text-[#123D2E] font-sans font-medium text-[12px] tracking-[0.18em] uppercase hover:bg-[#E9D3A6] transition-colors"
          >
            Shop All Dogs &amp; Cats <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
