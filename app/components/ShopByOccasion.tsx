/*
 * Design: The Stationery Atelier
 * Shop by Occasion: quiet, brand-toned tiles (no stock photography —
 * mismatched photos read as off-brand). Each occasion gets a soft paper
 * tone, a fine line icon, and a serif label. Calm, neutral, Minted-like.
 */
import { Link } from "react-router";
import {
  Gift,
  GraduationCap,
  Baby,
  Trophy,
  Briefcase,
  Sparkles,
} from "lucide-react";

const occasions = [
  {
    title: "Christmas & Holiday",
    icon: Gift,
    href: "/collections/christmas-holiday",
    tone: "bg-[#EEF0EA]",
  },
  {
    title: "Teacher Gifts",
    icon: GraduationCap,
    href: "/collections/teacher",
    tone: "bg-[#F4EFE6]",
  },
  {
    title: "Baby & Child",
    icon: Baby,
    href: "/collections/baby",
    tone: "bg-[#F2EDEA]",
  },
  {
    title: "Sports",
    icon: Trophy,
    href: "/collections/sports-1",
    tone: "bg-[#ECEEF0]",
  },
  {
    title: "Business",
    icon: Briefcase,
    href: "/collections/business-professional",
    tone: "bg-[#F0EDE6]",
  },
  {
    title: "Gift Ideas",
    icon: Sparkles,
    href: "/collections/gift-ideas",
    tone: "bg-[#F3F0EA]",
  },
];

export default function ShopByOccasion() {
  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Find the Perfect Gift
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
            Shop by{" "}
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                fontSize: "1.25em",
                lineHeight: "0.9",
                verticalAlign: "-0.05em",
              }}
            >
              Occasion
            </span>
          </h2>
          <div className="gold-rule w-24 mx-auto" />
        </div>

        {/* Occasion tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {occasions.map((o) => (
            <Link
              key={o.title}
              to={o.href}
              className={`group flex flex-col items-center justify-center text-center aspect-square px-4 ${o.tone} ring-1 ring-[#C9A96E]/12 hover:ring-[#C9A96E] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E]`}
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/70 ring-1 ring-[#C9A96E]/20 mb-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                <o.icon size={20} strokeWidth={1.4} className="text-[#C9A96E]" />
              </span>
              <h3 className="font-serif font-medium text-sm lg:text-[15px] text-[#2D2D2D] leading-snug">
                {o.title}
              </h3>
              <span className="font-sans font-medium text-[9px] tracking-[0.18em] uppercase text-[#C9A96E] mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Shop →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
