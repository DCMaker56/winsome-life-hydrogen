/*
 * TwoUpFeature — the two large feature squares directly under the hero,
 * matching thewinsomelife.com (currently "Summer Camp Days" / "Best Sellers").
 *
 * Per Sydney: left = Holiday Card Shop (was Best Sellers until Nov 2026),
 * right = The Holiday Table (was Holiday Essentials). Images are
 * placeholders pulled from the brand's own CDN for now (she'll supply final
 * art — a dog + floral notecard for Best Sellers, holiday products for the
 * other).
 */
import { Link } from "react-router";
import { ResponsiveImg } from "~/components/ResponsiveImg";
import holidayCardShop from "~/assets/home/holiday-card-shop.webp";
import holidayTable from "~/assets/home/holiday-table.webp";

export default function TwoUpFeature() {
  const tiles = [
    {
      // Holiday cards are the big-ticket item for the season (Sydney, Nov
      // 2026). Sydney's green tartan photo card artwork (1600x1200).
      title: "Holiday Card Shop",
      subtitle: "Personalized Christmas photo cards",
      href: "/collections/holiday-photo-cards",
      image: holidayCardShop,
      contain: false,
      cta: "Shop Holiday Cards",
      // Deep-green fade (instead of charcoal) keeps the green rich.
      fade: "3,62,37",
    },
    {
      // Hosting: place cards, wine tags & coasters (Sydney, Nov 2026).
      title: "The Holiday Table",
      subtitle: "Place cards, wine tags & coasters for hosting",
      href: "/collections/holiday-table",
      image: holidayTable,
      contain: false,
      cta: "Shop the Table",
      fade: "3,62,37",
    },
  ];
  return (
    <section className="py-12 lg:py-16 bg-[#FAF8F5]" aria-label="Featured">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-5 lg:gap-7">
          {tiles.map((tile) => (
            <Link
              key={tile.title}
              to={tile.href}
              className="group relative block overflow-hidden aspect-[4/3] bg-[#FAF8F5] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
            >
              <ResponsiveImg
                src={tile.image}
                sizes="(min-width: 1280px) 620px, (min-width: 768px) 50vw, 100vw"
                alt={tile.title}
                loading="lazy"
                className={`absolute inset-0 w-full h-full ${
                  tile.contain ? "object-contain p-6" : "object-cover"
                } transition-transform duration-700 group-hover:scale-[1.04]`}
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    `linear-gradient(to top, rgba(${tile.fade},0.6) 0%, rgba(${tile.fade},0.15) 45%, rgba(${tile.fade},0) 72%)`,
                }}
                aria-hidden
              />
              <span className="absolute inset-x-0 bottom-0 p-6 lg:p-8 text-center">
                <span className="block font-serif font-medium text-2xl lg:text-3xl text-white leading-tight">
                  {tile.title}
                </span>
                <span className="block font-sans font-light text-[13px] text-white/80 mt-1">
                  {tile.subtitle}
                </span>
                <span className="font-sans font-medium inline-block mt-4 px-7 py-2.5 bg-white text-[#2D2D2D] text-[11px] tracking-[0.18em] uppercase group-hover:bg-[#C9A96E] group-hover:text-white transition-colors">
                  {tile.cta}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
