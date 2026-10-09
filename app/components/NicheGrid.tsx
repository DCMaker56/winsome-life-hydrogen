/*
 * NicheGrid — "Find their thing" (homepage).
 *
 * The brand's differentiator is niche coverage: gymnastics notecards for the
 * seven-year-old niece. This section puts the interests front and center on
 * the homepage as a dense, scannable tile cloud, linking through to the full
 * Shop-by-Interest browser at /collections.
 *
 * Static list of real Shopify collection handles — stable, no loader cost.
 */
import { Link } from "react-router";
import {
  PawPrint,
  Trophy,
  GraduationCap,
  Baby,
  Plane,
  Shield,
  Flower2,
  Shell,
  Users,
  Briefcase,
  Cross,
  Gift,
  Columns3,
  Leaf,
  User,
  Sparkles,
} from "lucide-react";

const NICHES = [
  { label: "Dogs & Cats", handle: "dogs", icon: PawPrint },
  { label: "Sports", handle: "sports-1", icon: Trophy },
  { label: "Teachers", handle: "teacher", icon: GraduationCap },
  { label: "Baby & Child", handle: "baby", icon: Baby },
  { label: "Travel", handle: "travel", icon: Plane },
  { label: "Military", handle: "military", icon: Shield },
  { label: "Floral", handle: "floral", icon: Flower2 },
  { label: "Seaside", handle: "seaside", icon: Shell },
  { label: "Greek Life", handle: "greek-life-sorority-fraternity", icon: Columns3 },
  { label: "Family & Couples", handle: "family-couples", icon: Users },
  { label: "Business", handle: "business-professional", icon: Briefcase },
  { label: "Christian", handle: "christian-1", icon: Cross },
  { label: "Nature", handle: "nature-1", icon: Leaf },
  { label: "For Him", handle: "mens", icon: User },
  { label: "Hobbies", handle: "affinity-hobbies", icon: Sparkles },
  { label: "Gift Ideas", handle: "gift-ideas", icon: Gift },
];

export default function NicheGrid() {
  return (
    <section className="py-20 lg:py-24 bg-white" aria-label="Shop by interest">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Every Niche, Covered
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
            Find{" "}
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                fontSize: "1.3em",
                lineHeight: "0.9",
                verticalAlign: "-0.05em",
              }}
            >
              their thing
            </span>
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/65 max-w-xl mx-auto">
            Pickleball aunts. Golden-retriever dads. Gymnastics nieces. Whatever
            they love, we make personalized stationery for it.
          </p>
          <div className="gold-rule w-24 mx-auto mt-5" />
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {NICHES.map((n) => (
            <li key={n.handle}>
              <Link
                to={`/collections/${n.handle}`}
                prefetch="intent"
                className="group flex items-center gap-3 px-4 py-3.5 bg-[#FAF8F5] ring-1 ring-[#C9A96E]/15 hover:ring-[#C9A96E] hover:bg-white transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
              >
                <n.icon
                  size={18}
                  strokeWidth={1.5}
                  className="text-[#C9A96E] shrink-0"
                />
                <span className="font-serif font-medium text-[15px] text-[#2D2D2D] leading-tight group-hover:text-[#C9A96E] transition-colors">
                  {n.label}
                </span>
                <span className="ml-auto font-sans text-[#C9A96E] opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="text-center mt-10">
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
