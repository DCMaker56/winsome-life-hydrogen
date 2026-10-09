/*
 * Design: The Stationery Atelier
 * Marquee: Elegant scrolling ticker with brand messaging + icons.
 * Per Sydney's feedback: "maybe we do little icons to sort of call out
 * the actual words more" — each phrase pairs with a matching icon so the
 * eye has something to latch onto.
 */
import { Sparkles, Gem, Gift, Palette, Feather, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const items: { label: string; icon: LucideIcon }[] = [
  { label: "Luxury Stationery", icon: Gem },
  { label: "Elegance on Paper", icon: Feather },
  { label: "Personalized Gifts", icon: Gift },
  { label: "Signature Watercolor Style", icon: Palette },
  { label: "Crafted with Care", icon: Heart },
  { label: "Made to Be Treasured", icon: Sparkles },
];

export default function Marquee() {
  return (
    <section className="bg-[#CADEEA] py-5 overflow-hidden" aria-label="Brand values">
      <div className="flex items-center animate-marquee whitespace-nowrap gap-10">
        {[...items, ...items, ...items, ...items].map(({ label, icon: Icon }, i) => (
          <div key={i} className="flex items-center gap-6 shrink-0">
            <Icon
              size={16}
              className="text-[#2D2D2D]/55 shrink-0"
              strokeWidth={1.2}
              aria-hidden
            />
            <span className="font-serif text-sm md:text-base tracking-[0.2em] uppercase text-[#2D2D2D]/85">
              {label}
            </span>
            <span className="text-[#2D2D2D]/35 text-lg leading-none shrink-0" aria-hidden>
              ✦
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
