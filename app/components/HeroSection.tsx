/*
 * Hero — a slideshow of the brand's authentic desk-scene photography
 * (matches thewinsomelife.com). Slides cross-fade; the tagline "Uniquely You.
 * On Paper." sits on whichever side reads best against each slide — LEFT for
 * the blue floral/seaside scenes, RIGHT for the warm autumn scene (per Sydney).
 * The tagline animates in word-by-word and the honeybee flies a figure-eight
 * around "You" then lands top-right. All motion respects reduced-motion.
 */
import { useEffect, useState } from "react";
import { HoneyBee } from "./HoneyBee";

const CDN = "https://www.thewinsomelife.com/cdn/shop/files";

// Slide order + which side the tagline sits on for each.
const SLIDES = [
  {
    image: `${CDN}/Winsome_Banner_01_13972622-0426-4773-b922-928098ab2bda.png?width=2400`,
    alt: "Personalized autumn plaid Thanksgiving cards and fall stationery on a writing desk",
    side: "left" as const,
  },
  {
    image: `${CDN}/03.png?v=1758893929&width=2400`,
    alt: "Personalized floral notecards arranged on an elegant writing desk",
    side: "left" as const,
  },
  {
    image: `${CDN}/04.png?v=1758894113&width=2400`,
    alt: "Personalized seaside notecards with a gold pen on a writing desk",
    // Seaside sits on a warm yellow ground — tagline reads best on the right.
    side: "right" as const,
  },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;
    const t = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, []);

  const side = SLIDES[active].side;

  return (
    <section className="relative w-full overflow-hidden">
      <style>{HERO_CSS}</style>
      <div className="relative w-full min-h-[72vh] lg:min-h-[80vh] flex flex-col">
        {/* Backdrop — cross-fading slides */}
        <div className="absolute inset-0 overflow-hidden bg-[#F3ECDD]">
          {SLIDES.map((s, i) => (
            <img
              key={s.image}
              src={s.image}
              alt={s.alt}
              className="wl-kenburns absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ease-in-out"
              style={{opacity: i === active ? 1 : 0}}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>

        {/* Soft light wash behind the tagline — flips to the active side so the
            black type always reads without darkening the product photo. */}
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{
            background:
              side === "right"
                ? "linear-gradient(255deg, rgba(250,248,245,0.88) 0%, rgba(250,248,245,0.55) 34%, rgba(250,248,245,0.12) 56%, rgba(250,248,245,0) 74%)"
                : "linear-gradient(105deg, rgba(250,248,245,0.88) 0%, rgba(250,248,245,0.55) 34%, rgba(250,248,245,0.12) 56%, rgba(250,248,245,0) 74%)",
          }}
          aria-hidden
        />

        {/* Content */}
        <div
          className={`relative z-10 flex-1 flex items-center container py-14 lg:py-16 transition-all duration-700 ${
            side === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="max-w-xl text-left">
            <p className="wl-word wl-eyebrow font-sans font-medium text-[11px] md:text-xs tracking-[0.32em] uppercase text-[#2D2D2D] mb-5">
              Personalized Stationery
            </p>
            <h1 className="font-serif font-medium text-[#2D2D2D] leading-[1.05] text-5xl md:text-6xl lg:text-[4.5rem]">
              <span className="wl-word wl-w1 inline-block">Uniquely</span>{" "}
              <span className="relative inline-block">
                <span
                  className="wl-word wl-w2 inline-block text-[#2D2D2D]"
                  style={{
                    fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                    fontSize: "1.4em",
                    lineHeight: "1",
                    verticalAlign: "-0.06em",
                    paddingRight: "0.08em",
                  }}
                >
                  You.
                </span>
                {/* Honeybee — flies a figure-eight around "You" then lands at
                    its top-right, slanted ~20° left. */}
                <span className="wl-bee absolute -right-4 -top-9 md:-right-6 md:-top-12">
                  <HoneyBee size={58} slant={-20} />
                </span>
              </span>
              <br />
              <span className="wl-word wl-w3 inline-block">On</span>{" "}
              <span className="wl-word wl-w4 inline-block">Paper.</span>
            </h1>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-6 bg-[#2D2D2D]/70" : "w-2 bg-[#2D2D2D]/25 hover:bg-[#2D2D2D]/45"
              }`}
            />
          ))}
        </div>

        {/* Bottom gold hairline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent z-10" />
      </div>
    </section>
  );
}

const HERO_CSS = `
@keyframes wl-kenburns { 0% { transform: scale(1.05); } 100% { transform: scale(1.12); } }
.wl-kenburns { animation: wl-kenburns 20s ease-in-out infinite alternate; will-change: transform; }

/* Word-by-word entrance — quick sequence, all four words. */
@keyframes wl-word-in {
  0%   { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
}
.wl-word { opacity: 0; animation: wl-word-in 0.5s cubic-bezier(0.22,0.61,0.36,1) both; }
.wl-eyebrow { animation-delay: 0.05s; }
.wl-w1 { animation-delay: 0.25s; }
.wl-w2 { animation-delay: 0.55s; }
.wl-w3 { animation-delay: 0.85s; }
.wl-w4 { animation-delay: 1.15s; }

/* Honeybee: rests at the top-right of "You", then traces a smooth horizontal
   figure-eight (infinity) — the left lobe sweeps up around the "Y" — looping
   twice before settling back at rest. The path starts and ends at (0,0), so two
   iterations = two clean loops with no jump. The inner <img> holds the resting
   slant. Kept a single continuous transform (no scale/opacity jitter) so the
   motion reads as smooth. */
@keyframes wl-bee-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes wl-bee-fig8 {
  0%    { transform: translate(0, 0) rotate(0deg); }
  12.5% { transform: translate(19px, -14px) rotate(7deg); }
  25%   { transform: translate(34px, 0) rotate(0deg); }
  37.5% { transform: translate(19px, 14px) rotate(-7deg); }
  50%   { transform: translate(0, 0) rotate(0deg); }
  62.5% { transform: translate(-19px, -14px) rotate(7deg); }
  75%   { transform: translate(-34px, 0) rotate(0deg); }
  87.5% { transform: translate(-19px, 14px) rotate(-7deg); }
  100%  { transform: translate(0, 0) rotate(0deg); }
}
.wl-bee {
  opacity: 0;
  animation:
    wl-bee-in 0.5s ease-out 1.15s both,
    wl-bee-fig8 3.6s cubic-bezier(0.45, 0, 0.55, 1) 1.6s 2 both;
}

@media (prefers-reduced-motion: reduce) {
  .wl-kenburns { animation: none; }
  .wl-word, .wl-bee { animation: none; opacity: 1; }
}
`;
