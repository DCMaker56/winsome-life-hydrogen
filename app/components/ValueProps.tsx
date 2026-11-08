/*
 * ValueProps — the beige "brand promise" bar (replaces the old "Why We're
 * Different" cards). Mirrors thewinsomelife.com's strip: four short pillars,
 * each an icon + label, on a warm ivory band (Sydney, Nov 2026).
 */
import { Heart, Gem, Palette, Gift } from "lucide-react";

const props = [
  { icon: Heart, title: "Exceptional", subtitle: "Customer Service" },
  { icon: Gem, title: "Fine Quality", subtitle: "Luxury Materials" },
  { icon: Palette, title: "Original Art", subtitle: "Stunning Watercolors" },
  { icon: Gift, title: "Personalized", subtitle: "Gifts for All Interests" },
];

export default function ValueProps() {
  return (
    <section className="bg-[#F6F1E8] py-10 lg:py-14" aria-label="Our promise">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 divide-[#C9A96E]/25 lg:divide-x">
          {props.map((p) => (
            <div
              key={p.title}
              className="flex flex-col items-center text-center px-2"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full border border-[#8a6a3a]/30 mb-3">
                <p.icon size={22} strokeWidth={1.4} className="text-[#8a6a3a]" />
              </span>
              <h3 className="font-sans font-semibold text-[12.5px] lg:text-[13px] tracking-[0.2em] uppercase text-[#2D2D2D]">
                {p.title}
              </h3>
              <p className="font-sans font-light text-[15px] lg:text-base text-[#2D2D2D]/75 mt-1">
                {p.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
