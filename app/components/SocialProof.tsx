/*
 * SocialProof — customer reviews, restyled to match thewinsomelife.com.
 *
 * Per Sydney: no headings. Each review is just the name (first letter in
 * Parisian script, the rest in print), the quote, then five stars below.
 * Three show at once; you scroll/page to the next three. Reviews are
 * placeholders for now.
 */
import { useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const reviews = [
  {
    name: "Alyssa",
    text: "This is my only source for personalized stationery cards. Love their product!",
    rating: 5,
  },
  {
    name: "Cali",
    text: "Absolutely obsessed with these — so, so impressed with the quality.",
    rating: 5,
  },
  {
    name: "Diane",
    text: "I'm a repeat buyer… for life! Heavy stock, crisp printing. The quality is obvious.",
    rating: 5,
  },
  {
    name: "Sarah",
    text: "Absolutely beautiful stationery. The watercolor designs are stunning and the personalization is perfect. Everyone I gift them to loves them.",
    rating: 5,
  },
  {
    name: "Jennifer",
    text: "Exceptional quality — the paper is thick and luxurious and the florals are gorgeous. Sydney was so helpful with my custom order!",
    rating: 5,
  },
  {
    name: "Rebecca",
    text: "Ordered a personalized set for my daughter's teacher and she was thrilled. The packaging was beautiful too. Will absolutely order again.",
    rating: 5,
  },
  {
    name: "Meredith",
    text: "The prettiest notecards I've ever sent. I get compliments every single time I mail one.",
    rating: 5,
  },
  {
    name: "Grace",
    text: "Beautifully made and truly personal. This is my go-to gift for weddings and new babies now.",
    rating: 5,
  },
  {
    name: "Paige",
    text: "Obsessed with my monogram notepads. The whole experience felt luxe from start to finish.",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={16} className="fill-[#C9A96E] text-[#C9A96E]" />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
  const first = review.name.charAt(0);
  const rest = review.name.slice(1);
  return (
    <figure className="snap-start shrink-0 w-full sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-4rem)/3)] bg-white px-8 py-9 flex flex-col items-center text-center ring-1 ring-[#C9A96E]/12">
      <figcaption className="font-medium text-[#2D2D2D] leading-none mb-4">
        <span
          className="text-[2rem] align-middle text-[#2D2D2D]"
          style={{ fontFamily: "'Parisian Script', 'Great Vibes', cursive" }}
        >
          {first}
        </span>
        <span className="font-sans text-lg tracking-[0.04em] align-middle">
          {rest}
        </span>
      </figcaption>
      <blockquote className="font-sans font-light text-[#2D2D2D]/70 leading-relaxed text-[15px] mb-6">
        &ldquo;{review.text}&rdquo;
      </blockquote>
      <div className="mt-auto">
        <StarRating rating={review.rating} />
      </div>
    </figure>
  );
}

export default function SocialProof() {
  const trackRef = useRef<HTMLDivElement>(null);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="py-20 lg:py-24 bg-[#ECF2F5]" aria-label="Customer reviews">
      <div className="container relative">
        {/* Arrows */}
        <button
          type="button"
          onClick={() => page(-1)}
          aria-label="Previous reviews"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white ring-1 ring-[#C9A96E]/25 text-[#2D2D2D] hover:bg-[#C9A96E] hover:text-white transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          aria-label="Next reviews"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white ring-1 ring-[#C9A96E]/25 text-[#2D2D2D] hover:bg-[#C9A96E] hover:text-white transition-colors shadow-sm"
        >
          <ChevronRight size={20} />
        </button>

        {/* Track — 3 per view, snap to the next 3 */}
        <div
          ref={trackRef}
          className="flex gap-4 lg:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
