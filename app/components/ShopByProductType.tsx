/*
 * ShopByProductType — the 8 core product types, each a best-selling product
 * photo with its name underneath, styled like the Holiday Gift Guide teaser
 * (Sydney, Nov 2026), plus Shop All. Order follows the season; images and
 * order resolve in the homepage loader. Light blue background so it stands
 * apart from the ivory value bar above and the green Dogs & Cats below.
 */
import {Link} from 'react-router';

export interface ProductType {
  label: string;
  handle: string;
  image: string | null;
}

const script = {
  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
  fontSize: '1.3em',
  lineHeight: '0.9',
  verticalAlign: '-0.05em',
  display: 'inline-block',
  padding: '0 0.08em 0 0.18em',
} as const;

const sized = (url: string, w: number) => `${url}${url.includes('?') ? '&' : '?'}width=${w}`;

export default function ShopByProductType({productTypes}: {productTypes: ProductType[]}) {
  if (!productTypes?.length) return null;

  return (
    <section className="py-20 lg:py-24 bg-[#CADEEA]" aria-label="Shop by product type">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#2D2D2D]/70 mb-3">
            Find Your Format
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-[2.6rem] text-[#2D2D2D]">
            Shop by <span style={script}>Product Type</span>
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/80 max-w-xl mx-auto mt-4">
            From everyday notecards to holiday photo cards, find just the
            piece you are looking for.
          </p>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-9 lg:gap-x-8 max-w-5xl mx-auto">
          {productTypes.map((t) => (
            <li key={t.handle}>
              <Link
                to={`/collections/${t.handle}`}
                prefetch="intent"
                className="group flex flex-col items-center text-center focus-visible:outline-none"
              >
                <span className="relative block w-full aspect-square overflow-hidden bg-[#FAF8F5] shadow-sm ring-1 ring-white/70 group-hover:ring-2 group-hover:ring-[#2D2D2D]/40 transition-all duration-300">
                  {t.image && (
                    <img
                      src={sized(t.image, 500)}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                  )}
                </span>
                <span className="mt-3 font-serif text-[1.15rem] lg:text-[1.25rem] leading-tight text-[#2D2D2D] group-hover:underline underline-offset-4 decoration-1">
                  {t.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="text-center mt-12">
          <Link
            to="/collections/all"
            className="inline-flex items-center gap-2 px-9 py-3.5 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.18em] uppercase hover:bg-[#1B294E] transition-colors"
          >
            Shop All <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
