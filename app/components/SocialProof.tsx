/*
 * SocialProof — customer reviews, restyled to match thewinsomelife.com.
 *
 * Per Sydney: no headings. Each review is just the name (first letter in
 * Parisian script, the rest in print), the quote, then five stars below.
 * One large review shows at a time and advances on its own every 6 seconds
 * (long enough to read one). Visitors can swipe, use the arrows or tap a dot;
 * auto-advance pauses while they hover, focus or touch the reviews, while the
 * section is off screen, and entirely for reduced-motion users.
 * Reviews are placeholders for now.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const ADVANCE_MS = 6000;

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
    <div className="flex gap-1.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={20} className="fill-[#C9A96E] text-[#C9A96E]" />
      ))}
    </div>
  );
}

function ReviewSlide({
  review,
  index,
  total,
}: {
  review: (typeof reviews)[number];
  index: number;
  total: number;
}) {
  const first = review.name.charAt(0);
  const rest = review.name.slice(1);
  return (
    <figure
      className="snap-center shrink-0 w-full flex flex-col items-center text-center px-14 sm:px-16 lg:px-24"
      role="group"
      aria-roledescription="slide"
      aria-label={`Review ${index + 1} of ${total}`}
    >
      <span
        aria-hidden
        className="font-serif text-[#C9A96E]/50 text-7xl md:text-8xl leading-none h-10 md:h-12 select-none"
      >
        &ldquo;
      </span>
      <blockquote className="font-serif text-[#2D2D2D] text-2xl md:text-[2rem] lg:text-[2.4rem] leading-snug max-w-3xl text-balance">
        {review.text}
      </blockquote>
      <figcaption className="mt-8 flex flex-col items-center gap-3">
        <span className="font-medium text-[#2D2D2D] leading-none">
          <span
            className="text-[2.6rem] align-middle"
            style={{ fontFamily: "'Parisian Script', 'Great Vibes', cursive" }}
          >
            {first}
          </span>
          <span className="font-sans text-xl tracking-[0.04em] align-middle">
            {rest}
          </span>
        </span>
        <StarRating rating={review.rating} />
      </figcaption>
    </figure>
  );
}

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const n = (i + reviews.length) % reviews.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
    setActive(n);
  }, []);

  // Keep the dots in sync when the visitor swipes.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    setReduceMotion(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    );
    const el = sectionRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView || reduceMotion) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") goTo(active + 1);
    }, ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, inView, reduceMotion, goTo]);

  const arrow =
    "flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-12 md:h-12 items-center justify-center rounded-full bg-white ring-1 ring-[#C9A96E]/25 text-[#2D2D2D] hover:bg-[#C9A96E] hover:text-white transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]";

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28 bg-[#CADEEA]"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="container relative max-w-6xl">
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label="Previous review"
          className={`${arrow} left-1 md:left-0 md:-translate-x-2`}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label="Next review"
          className={`${arrow} right-1 md:right-0 md:translate-x-2`}
        >
          <ChevronRight size={20} />
        </button>

        {/* Track: one review per view, swipeable */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-live={paused ? "polite" : "off"}
        >
          {reviews.map((review, i) => (
            <ReviewSlide
              key={review.name}
              review={review}
              index={i}
              total={reviews.length}
            />
          ))}
        </div>

        {/* Dots */}
        <div className="mt-10 flex justify-center gap-2.5">
          {reviews.map((r, i) => (
            <button
              key={r.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show review ${i + 1}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all ${
                i === active
                  ? "w-6 bg-[#2D2D2D]/70"
                  : "w-2 bg-[#2D2D2D]/25 hover:bg-[#2D2D2D]/45"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
