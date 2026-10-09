/*
 * DesignWall — "Shop by Interest" as circular genre tiles (per Sydney: match
 * the winsomelife.com style — a circle image per genre, not a wall of product
 * photos). Each circle is a collection's representative image + label, linking
 * to that collection. Images are resolved in the homepage loader.
 */
import { Link } from "react-router";

export interface Interest {
  label: string;
  handle: string;
  image: string | null;
}

export default function DesignWall({ interests }: { interests: Interest[] }) {
  if (!interests?.length) return null;

  return (
    <section className="py-20 lg:py-24 bg-[#ECF2F5]" aria-label="Shop by interest">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Every Niche, Covered
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            Shop by{" "}
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                fontSize: "1.3em",
                lineHeight: "0.9",
                verticalAlign: "-0.05em",
              }}
            >
              Interest
            </span>
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/60 max-w-xl mx-auto mt-3">
            Pickleball aunts. Golden-retriever dads. Gymnastics nieces. Whatever
            they love, we make personalized stationery for it.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-9 max-w-5xl mx-auto">
          {interests.map((it) => (
            <Link
              key={it.handle}
              to={`/collections/${it.handle}`}
              prefetch="intent"
              className="group flex flex-col items-center text-center focus-visible:outline-none"
            >
              <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-[#FAF8F5] ring-1 ring-[#C9A96E]/25 group-hover:ring-2 group-hover:ring-[#C9A96E] transition-all duration-300 shadow-sm">
                {it.image ? (
                  <img
                    src={it.image}
                    alt={it.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-[#C9A96E]/40">
                    {it.label.charAt(0)}
                  </span>
                )}
              </div>
              <span className="font-serif text-[15px] lg:text-base text-[#2D2D2D] mt-3.5 leading-tight group-hover:text-[#C9A96E] transition-colors">
                {it.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/collections"
            className="font-sans font-medium inline-flex items-center justify-center px-10 py-3.5 border border-[#C9A96E] text-[#C9A96E] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A96E] hover:text-white transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
          >
            Browse All Interests
          </Link>
        </div>
      </div>
    </section>
  );
}
