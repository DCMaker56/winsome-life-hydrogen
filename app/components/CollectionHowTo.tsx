/*
 * CollectionHowTo — a compact "how it works" band for browse pages.
 *
 * Uses the header height to set expectations: click a design, personalize it
 * right on the page, and (optionally) set it to reorder on a schedule.
 */
import { MousePointerClick, Wand2, Repeat } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick a design",
    body: "Browse the collection and open any piece you love.",
  },
  {
    icon: Wand2,
    title: "Personalize it",
    body: "Swap the illustration, add your text, choose a font and ink color — with a live preview.",
  },
  {
    icon: Repeat,
    title: "Subscribe & save",
    body: "Set it to reorder on a schedule and never run out.",
  },
];

export default function CollectionHowTo() {
  return (
    <div className="bg-white ring-1 ring-[#C9A96E]/15 mb-8">
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#C9A96E]/12">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-start gap-3 p-4 lg:p-5">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FAF8F5] ring-1 ring-[#C9A96E]/25 shrink-0">
              <s.icon size={16} strokeWidth={1.6} className="text-[#C9A96E]" />
            </span>
            <div>
              <p className="font-sans font-medium text-[10px] tracking-[0.16em] uppercase text-[#C9A96E] mb-0.5">
                Step {i + 1}
              </p>
              <p className="font-serif font-medium text-[15px] text-[#2D2D2D] leading-tight">
                {s.title}
              </p>
              <p className="font-sans font-light text-[12.5px] text-[#2D2D2D]/60 leading-snug mt-1">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
