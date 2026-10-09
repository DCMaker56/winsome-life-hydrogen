/*
 * CollectionRow — a titled, horizontally-scrolling row of product cards from a
 * single collection. Mirrors the "Notes Worth Saluting" product row on
 * thewinsomelife.com.
 */
import {Link} from 'react-router';
import {Star} from 'lucide-react';
import {formatPrice, type Product} from '@/lib/products';

export default function CollectionRow({
  title,
  subtitle,
  handle,
  products,
  scriptWord,
  stars,
  bg = 'bg-white',
}: {
  title: string;
  subtitle?: string;
  handle: string;
  products: Product[];
  /** Optional trailing word rendered in the Parisian script accent. */
  scriptWord?: string;
  /** Render a patriotic red/blue star flourish under the title. */
  stars?: boolean;
  /** Section background utility class. */
  bg?: string;
}) {
  if (!products?.length) return null;
  return (
    <section className={`py-16 lg:py-20 ${bg}`} aria-label={title}>
      <div className="container">
        <div className="text-center mb-9">
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            {title}
            {scriptWord && (
              <span
                className="text-[#C9A96E]"
                style={{
                  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                  fontSize: '1.3em',
                  lineHeight: '0.9',
                  verticalAlign: '-0.05em',
                  marginLeft: '0.2em',
                }}
              >
                {scriptWord}
              </span>
            )}
          </h2>
          {stars && (
            <div className="flex items-center justify-center gap-1.5 mt-3" aria-hidden>
              <Star size={15} className="fill-[#9E1B32] text-[#9E1B32]" />
              <Star size={18} className="fill-[#1B294E] text-[#1B294E]" />
              <Star size={15} className="fill-[#9E1B32] text-[#9E1B32]" />
            </div>
          )}
          {subtitle && (
            <p className="font-sans font-light text-base text-[#2D2D2D]/60 max-w-xl mx-auto mt-3">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex gap-5 lg:gap-6 overflow-x-auto snap-x pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/products/${p.slug}`}
              prefetch="intent"
              className="group snap-start shrink-0 w-[220px] lg:w-[250px] focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF8F5] ring-1 ring-[#C9A96E]/12 group-hover:ring-[#C9A96E]/50 transition-all">
                {p.images[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full bg-[#C9A96E]/5" />
                )}
              </div>
              <h3 className="font-serif text-[15px] text-[#2D2D2D] leading-snug mt-3 line-clamp-2 group-hover:text-[#C9A96E] transition-colors">
                {p.title}
              </h3>
              <p className="font-sans text-sm text-[#2D2D2D]/55 mt-0.5">
                {p.type === 'notecard' || p.type === 'gift-tag' || p.type === 'wine-tag'
                  ? `From ${formatPrice(p.price)}`
                  : formatPrice(p.price)}
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to={`/collections/${handle}`}
            className="font-sans font-medium inline-flex items-center justify-center px-10 py-3.5 border border-[#C9A96E] text-[#C9A96E] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A96E] hover:text-white transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
          >
            Shop the Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
