/*
 * TwoUpFeature — the two large feature squares directly under the hero,
 * matching thewinsomelife.com (currently "Summer Camp Days" / "Best Sellers").
 *
 * Per Sydney: left = Holiday Card Shop (was Best Sellers until Nov 2026),
 * right = Holiday Essentials. Images are
 * placeholders pulled from the brand's own CDN for now (she'll supply final
 * art — a dog + floral notecard for Best Sellers, holiday products for the
 * other).
 */
import { Link } from "react-router";

const HOLIDAY_FALLBACK =
  "https://caatee-kr.myshopify.com/cdn/shop/files/Red_Christmas_More_Stripes_421ce7fa-ba02-4a17-8d6d-bc69cd220c5b.png?v=1763493159&width=2400";

export default function TwoUpFeature({
  holidayImage,
}: {
  holidayImage?: string | null;
}) {
  const tiles = [
    {
      // Holiday cards are the big-ticket item for the season (Sydney, Nov
      // 2026). Placeholder image: the Red & Green Tartan Plaid photo card,
      // until Sydney's 1600x1200 artwork is ready.
      title: "Holiday Card Shop",
      subtitle: "Personalized Christmas photo cards",
      href: "/collections/holiday-photo-cards",
      image:
        "https://cdn.shopify.com/s/files/1/0938/6203/5753/files/il_fullxfull.7120336134_t18n.jpg?v=1762824480&width=1300",
      contain: false,
      cta: "Shop Holiday Cards",
    },
    {
      title: "Holiday Essentials",
      subtitle: "Cards & gifts for the season",
      href: "/collections/christmas-holiday",
      // A real product image from the Christmas/Holiday collection.
      image: holidayImage ?? HOLIDAY_FALLBACK,
      contain: !!holidayImage,
      cta: "Shop Now",
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
              <img
                src={tile.image}
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
                    "linear-gradient(to top, rgba(45,45,45,0.55) 0%, rgba(45,45,45,0.12) 45%, rgba(45,45,45,0) 72%)",
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
