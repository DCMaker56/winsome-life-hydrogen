/*
 * TrendingPopular — "Trending & Popular" (homepage, above Shop by Interest).
 *
 * Seasonally smart: the heading + curated picks shift with the calendar
 * (graduations near graduation season, summer motifs in summer, holiday in
 * winter), with thank-you notes as a year-round staple. Matching is done
 * against the loaded catalog by keyword; if a season is thin we backfill with
 * bestsellers so the row is never sparse.
 */
import { useMemo } from "react";
import { Link } from "react-router";
import { TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useAllProducts } from "@/hooks/useProducts";
import { formatPrice, type Product } from "@/lib/products";

interface Season {
  eyebrow: string;
  title: string;
  blurb: string;
  keywords: string[];
}

/** Resolve the seasonal theme from the current month (0 = Jan). */
function currentSeason(month: number): Season {
  // Thank-you notes are always in the mix — the year-round staple.
  const thanks = ["thank you", "thank-you", "gratitude"];
  switch (month) {
    case 11:
    case 0:
      return {
        eyebrow: "In Season",
        title: "Holiday & New Year",
        blurb: "Gifts they'll open twice — once now, once every day they use it.",
        keywords: ["christmas", "holiday", "wreath", "winter", "new year", "calendar", ...thanks],
      };
    case 1:
      return {
        eyebrow: "In Season",
        title: "Valentine's & Galentine's",
        blurb: "A little love, personalized — for sweethearts and best friends alike.",
        keywords: ["love", "heart", "valentine", "xoxo", ...thanks],
      };
    case 2:
    case 3:
      return {
        eyebrow: "In Season",
        title: "Spring & Easter",
        blurb: "Fresh florals and bright motifs for the season of new beginnings.",
        keywords: ["spring", "easter", "floral", "bunny", "botanical", "garden", ...thanks],
      };
    case 4:
      return {
        eyebrow: "In Season",
        title: "Graduation & Mother's Day",
        blurb: "For the grad turning the page — and the mom who got them there.",
        keywords: ["graduation", "grad", "mom", "mother", "teacher", ...thanks],
      };
    case 5:
      return {
        eyebrow: "In Season",
        title: "Grads, Weddings & Summer",
        blurb: "Congratulations season — diplomas, 'I dos,' and long sunny days.",
        keywords: ["graduation", "grad", "wedding", "bride", "summer", "coastal", ...thanks],
      };
    case 6:
    case 7:
      return {
        eyebrow: "In Season",
        title: "Summer Favorites",
        blurb: "Coastal, nautical, and sun-soaked designs made for the season.",
        keywords: ["summer", "beach", "coastal", "seaside", "nautical", "seahorse", "crab", "watermelon", "lemon", ...thanks],
      };
    case 8:
      return {
        eyebrow: "In Season",
        title: "Back to School",
        blurb: "Teacher gifts and fresh notepads for a brand-new school year.",
        keywords: ["teacher", "school", "notepad", "apple", "pencil", ...thanks],
      };
    case 9:
      return {
        eyebrow: "In Season",
        title: "Autumn & Fall",
        blurb: "Warm tones, pumpkins, and everything that says sweater weather.",
        keywords: ["fall", "autumn", "pumpkin", "harvest", "halloween", "leaves", ...thanks],
      };
    default: // 10 = Nov
      return {
        eyebrow: "In Season",
        title: "Gratitude & Gathering",
        blurb: "Thanksgiving hosts, gratitude notes, and a head start on holiday gifting.",
        keywords: ["thanksgiving", "gratitude", "grateful", "fall", "hostess", ...thanks],
      };
  }
}

function matches(p: Product, keywords: string[]): boolean {
  const hay = `${p.title} ${p.categories.join(" ")}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

export default function TrendingPopular() {
  const { data: products } = useAllProducts();
  const season = useMemo(() => currentSeason(new Date().getMonth()), []);

  const picks = useMemo(() => {
    const seen = new Set<string>();
    const seasonal = products.filter((p) => matches(p, season.keywords));
    const bestsellers = products.filter((p) => p.badge === "Bestseller");
    const out: Product[] = [];
    for (const p of [...seasonal, ...bestsellers, ...products]) {
      if (out.length >= 8) break;
      if (!p.images[0] || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
    return out.slice(0, 8);
  }, [products, season]);

  if (picks.length === 0) return null;

  const scriptStyle = {
    fontFamily: "'Parisian Script', 'Great Vibes', cursive",
    fontSize: "1.35em",
    lineHeight: "0.9",
    verticalAlign: "-0.06em",
  } as const;

  return (
    <section className="py-20 lg:py-24 bg-[#FAF8F5]" aria-label="Trending and popular">
      <div className="container">
        {/* Centered header — first letter of each word in Parisian script,
            with a small gold flourish underneath so the section pops. */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            <span className="text-[#C9A96E]" style={scriptStyle}>T</span>rending
            &amp;{" "}
            <span className="text-[#C9A96E]" style={scriptStyle}>P</span>opular
          </h2>
          <div className="flex items-center justify-center gap-2.5 mt-3" aria-hidden>
            <span className="h-px w-10 bg-[#C9A96E]/40" />
            <Sparkles size={15} className="text-[#C9A96E]" strokeWidth={1.8} />
            <span className="h-px w-10 bg-[#C9A96E]/40" />
          </div>
          <p className="font-sans font-light text-base text-[#2D2D2D]/60 mt-3">
            Hottest items of the season
          </p>
        </div>

        {/* Left copy block + right scrolling product carousel */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 lg:gap-8 items-stretch">
          <div className="flex flex-col justify-center bg-[#CADEEA] ring-1 ring-[#9cbdd0]/40 p-8 lg:p-10">
            <p className="font-sans font-medium text-[11px] tracking-[0.25em] uppercase text-[#C9A96E] mb-3 flex items-center gap-2">
              <TrendingUp size={14} strokeWidth={2} /> In Season
            </p>
            <p className="font-serif text-2xl lg:text-[1.7rem] text-[#2D2D2D] leading-snug mb-6">
              Get them before they fly off the shelves.
            </p>
            <Link
              to="/collections/all"
              className="font-sans font-medium inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-[#C9A96E] hover:text-[#2D2D2D] transition-colors"
            >
              Shop all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex gap-4 lg:gap-6 overflow-x-auto snap-x pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {picks.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.slug}`}
                prefetch="intent"
                className="group snap-start shrink-0 w-[210px] lg:w-[240px] focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-white ring-1 ring-[#C9A96E]/12 group-hover:ring-[#C9A96E]/50 transition-all">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {p.badge && (
                    <span className="font-sans font-medium absolute top-3 left-3 px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase bg-[#C9A96E] text-white">
                      {p.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-[14px] text-[#2D2D2D] leading-snug mt-3 line-clamp-2 group-hover:text-[#C9A96E] transition-colors">
                  {p.title}
                </h3>
                <p className="font-sans text-xs text-[#2D2D2D]/55 mt-0.5">
                  {p.type === "notecard" || p.type === "gift-tag" || p.type === "wine-tag"
                    ? `From ${formatPrice(p.price)}`
                    : formatPrice(p.price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
