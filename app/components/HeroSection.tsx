/*
 * Hero — a slideshow of the brand's authentic desk-scene photography
 * (matches thewinsomelife.com). Slides cross-fade; the tagline "Uniquely You.
 * On Paper." sits on whichever side reads best against each slide — LEFT for
 * the blue floral/seaside scenes, RIGHT for the warm autumn scene (per Sydney).
 * The tagline animates in word-by-word; the honeybee rests beside "You."
 * (its flight animation is off for now). All motion respects reduced-motion.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HoneyBee } from "./HoneyBee";
import christmasDesktop from "~/assets/hero/christmas-plaid-desktop.webp";
import fallDesktop from "~/assets/hero/fall-plaid-desktop.webp";
import christmasPhone from "~/assets/hero/christmas-plaid-phone.webp";
import fallPhone from "~/assets/hero/fall-plaid-phone.webp";

const CDN = "https://caatee-kr.myshopify.com/cdn/shop/files";

// Slide order + which side the tagline sits on for each.
// desktopImage: shown on computers (768px+) instead of `image`; phones keep
//   `image` until a phone version exists (2400x1100 desktop / 1200x1800 phone
//   templates in design/hero-templates).
// desktopOnly: skipped on phones (no phone version yet).
// phoneDesigned: `image` is a 1200x1800 phone design with a plain top, so on
//   phones the tagline moves to the top and the desktop look (white text,
//   no haze) applies there too.
// desktopSide: tagline side on computers, if different from `side`.
// desktopLight: white tagline and no haze on computers (dark backgrounds).
// desktopNoHaze: no light haze behind the tagline on computers (the image
//   already has a plain area for it).
type Slide = {
  image: string;
  alt: string;
  side: "left" | "right";
  desktopImage?: string;
  desktopAlt?: string;
  desktopOnly?: boolean;
  phoneDesigned?: boolean;
  desktopSide?: "left" | "right";
  desktopLight?: boolean;
  desktopNoHaze?: boolean;
  /** Which part of the desktop image to keep when the screen trims it. */
  desktopPosition?: string;
  /** Button under the tagline, e.g. "Shop Christmas / Holiday". */
  cta?: {label: string; href: string};
  /** Short seasonal line above the button. */
  subline?: string;
};
const SLIDES: Slide[] = [
  {
    // Christmas plaid on solid red (Sydney, Nov 2026) — computers only for now.
    image: christmasPhone,
    alt: "Personalized red tartan plaid Christmas photo card, notepad, gift tag and wine tag on a red background",
    desktopImage: christmasDesktop,
    phoneDesigned: true,
    desktopLight: true,
    // Keep the products (right side) when narrower screens trim the image.
    desktopPosition: "70% center",
    subline: "Make the season beautifully personal.",
    cta: {label: "Shop Christmas / Holiday", href: "/collections/christmas-holiday"},
    side: "left",
  },
  {
    // Fall plaid on tan (Sydney, Nov 2026); products on the right, tagline on
    // the left (phones: products below, tagline on top).
    image: fallPhone,
    alt: "Personalized fall plaid Thanksgiving photo card, pumpkin notepad, gift tags, place card and notecards on a tan background",
    desktopImage: fallDesktop,
    phoneDesigned: true,
    desktopNoHaze: true,
    // Keep the products (right side) when narrower screens trim the image.
    desktopPosition: "70% center",
    subline: "Gather, give thanks, and make it personal.",
    cta: {label: "Shop Thanksgiving / Fall", href: "/collections/fall-autumn"},
    side: "left",
  },
  {
    image: `${CDN}/03.png?v=1758893929&width=2400`,
    alt: "Personalized floral notecards arranged on an elegant writing desk",
    side: "left",
  },
  {
    image: `${CDN}/04.png?v=1758894113&width=2400`,
    alt: "Personalized seaside notecards with a gold pen on a writing desk",
    // Seaside sits on a warm yellow ground — tagline reads best on the right.
    side: "right",
  },
];

export default function HeroSection() {
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  // Computers vs phones: phones skip desktop-only slides.
  useEffect(() => {
    const mq = window.matchMedia?.("(min-width: 768px)");
    if (!mq) return;
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const shows = (i: number) => isDesktop || !SLIDES[i].desktopOnly;
  const next = (a: number) => {
    for (let k = 1; k <= SLIDES.length; k++) {
      const i = (a + k) % SLIDES.length;
      if (shows(i)) return i;
    }
    return a;
  };

  // On phones, start on the first slide that has a phone photo.
  useEffect(() => {
    if (!shows(active)) setActive((a) => next(a));
  }, [isDesktop]);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;
    const t = setInterval(() => setActive((a) => next(a)), 6500);
    return () => clearInterval(t);
  }, [isDesktop]);

  const slide = SLIDES[active];
  const side = isDesktop ? (slide.desktopSide ?? slide.side) : slide.side;
  const light = !!slide.desktopLight;
  const noHaze = light || !!slide.desktopNoHaze;
  // On phones, designed slides get the same look as on computers.
  const phone = !!slide.phoneDesigned;

  return (
    <section className="relative w-full overflow-hidden">
      <style>{HERO_CSS}</style>
      <div className="relative w-full min-h-[84vh] md:min-h-[72vh] lg:min-h-[80vh] flex flex-col">
        {/* Backdrop — cross-fading slides */}
        <div className="absolute inset-0 overflow-hidden bg-[#F3ECDD]">
          {SLIDES.map((s, i) => (
            <picture key={i}>
              {s.desktopImage && <source media="(min-width: 768px)" srcSet={s.desktopImage} />}
              <img
                src={s.image}
                alt={s.desktopAlt ?? s.alt}
                className="wl-kenburns absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ease-in-out"
                style={{
                  opacity: i === active ? 1 : 0,
                  objectPosition: isDesktop
                    ? s.desktopPosition
                    : s.phoneDesigned
                      ? "center top"
                      : undefined,
                }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </picture>
          ))}
        </div>

        {/* Soft light wash behind the tagline — flips to the active side so the
            black type always reads without darkening the product photo. */}
        <div
          className={`absolute inset-0 transition-[background,opacity] duration-700 ${noHaze ? (phone ? "opacity-0" : "md:opacity-0") : ""}`}
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
          className={`relative z-10 flex-1 flex ${phone ? "items-start md:items-center pt-10 pb-14" : "items-center py-14"} container lg:py-16 transition-all duration-700 ${
            side === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <div className={`max-w-xl text-left ${light ? "wl-light" : ""} ${light && phone ? "wl-light-phone" : ""}`}>
            <p className="wl-word wl-eyebrow font-sans font-medium text-[11px] md:text-xs tracking-[0.32em] uppercase text-[#2D2D2D] mb-8 md:mb-9">
              Personalized Stationery
            </p>
            <h1 className="font-serif font-medium text-[#2D2D2D] leading-[1.05] text-5xl md:text-6xl lg:text-[4.5rem]">
              <span className="wl-word wl-w1 inline-block">Uniquely</span>{" "}
              <span className="relative inline-block">
                {/* "You." in Parisian Script, about 15% smaller than the
                    original 1.4em so it doesn't overpower the line (Nov 2026). */}
                <span
                  className="wl-word wl-w2 inline-block text-[#2D2D2D]"
                  style={{
                    fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                    fontSize: "1.2em",
                    lineHeight: "1",
                    verticalAlign: "-0.04em",
                    paddingRight: "0.08em",
                  }}
                >
                  You.
                </span>
                {/* Honeybee perched on the upper right of the "u" in "You." (Sydney, Nov 2026).
                    Flight animation off for now; the path is kept in HERO_CSS. */}
                <span className="wl-bee absolute w-max left-[86%] top-[30%] -translate-x-1/2 -translate-y-1/2 ml-3.5 -mt-2 md:ml-6 md:-mt-3">
                  <HoneyBee size={58} slant={-20} />
                </span>
              </span>
              <br />
              <span className="wl-word wl-w3 inline-block">On</span>{" "}
              <span className="wl-word wl-w4 inline-block">Paper.</span>
            </h1>
            {slide.subline && (
              <p
                key={slide.subline}
                className="wl-sub mt-6 md:mt-7 font-serif italic text-[1.35rem] md:text-[1.6rem] leading-snug text-[#2D2D2D]"
              >
                {slide.subline}
              </p>
            )}
            {slide.cta && (
              <Link
                key={slide.cta.href}
                to={slide.cta.href}
                className={`wl-cta ${slide.subline ? "mt-4 md:mt-6" : "mt-6 md:mt-10"} inline-flex items-center gap-1.5 md:gap-2 whitespace-nowrap px-4 py-2 md:px-8 md:py-3.5 font-sans font-medium text-[10.5px] md:text-[13px] tracking-[0.1em] md:tracking-[0.15em] uppercase transition-colors duration-300 bg-[#2D2D2D] text-white hover:bg-[#C9A96E] ${
                  light ? (phone ? "bg-white hover:bg-[#FAF8F5]" : "md:bg-white md:hover:bg-[#FAF8F5]") : ""
                }`}
              >
                {slide.cta.label}
                <span aria-hidden>&rarr;</span>
              </Link>
            )}
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              hidden={!shows(i)}
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
/* White tagline on dark slides — computers, and phones when the slide has a
   phone design (wl-light-phone). */
@media (min-width: 768px) {
  .wl-light, .wl-light *:not(.wl-cta):not(.wl-cta *) { color: #fff !important; transition: color 0.7s; }
  .wl-light .wl-cta, .wl-light .wl-cta * { color: #2D2D2D !important; }
}
.wl-light-phone, .wl-light-phone *:not(.wl-cta):not(.wl-cta *) { color: #fff !important; }
.wl-light-phone .wl-cta, .wl-light-phone .wl-cta * { color: #2D2D2D !important; }
@keyframes wl-kenburns { 0% { transform: scale(1.05); } 100% { transform: scale(1.12); } }
.wl-kenburns { animation: wl-kenburns 20s ease-in-out infinite alternate; will-change: transform; }

/* Word-by-word entrance — quick sequence, all four words. */
@keyframes wl-cta-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.wl-cta, .wl-sub { animation: wl-cta-in 0.6s ease-out both; }
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

/* Honeybee: flies the path Sydney drew with the bee-flight tool (Oct 2026),
   played once at her own pace (4.1s), then stays where she let go.
   Offsets are in em of the headline (drawn at 72px), so the flight scales with
   the headline on smaller screens. The inner <img> holds the resting slant. */
@keyframes wl-bee-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes wl-bee-flight {
  0% { transform: translate(-0.111em, 0.458em); }
  1.24% { transform: translate(-0.111em, 0.458em); }
  2.49% { transform: translate(-0.097em, 0.458em); }
  3.76% { transform: translate(-0.097em, 0.458em); }
  5% { transform: translate(-0.097em, 0.458em); }
  6.25% { transform: translate(-0.056em, 0.472em); }
  7.49% { transform: translate(0.056em, 0.569em); }
  8.76% { transform: translate(0.167em, 0.639em); }
  10% { transform: translate(0.264em, 0.708em); }
  11.25% { transform: translate(0.389em, 0.778em); }
  12.49% { transform: translate(0.556em, 0.875em); }
  13.76% { transform: translate(0.708em, 0.944em); }
  15% { transform: translate(0.903em, 0.986em); }
  16.25% { transform: translate(1.167em, 1.042em); }
  17.49% { transform: translate(1.417em, 1.069em); }
  18.76% { transform: translate(1.583em, 1.069em); }
  20% { transform: translate(1.764em, 1.014em); }
  21.25% { transform: translate(1.903em, 0.903em); }
  22.49% { transform: translate(2.028em, 0.778em); }
  23.74% { transform: translate(2.097em, 0.653em); }
  25.01% { transform: translate(2.153em, 0.444em); }
  26.25% { transform: translate(2.153em, 0.222em); }
  27.49% { transform: translate(2.153em, 0.083em); }
  28.74% { transform: translate(2.125em, -0.056em); }
  30.01% { transform: translate(2.083em, -0.194em); }
  31.25% { transform: translate(2.028em, -0.306em); }
  32.5% { transform: translate(1.958em, -0.389em); }
  33.74% { transform: translate(1.889em, -0.444em); }
  35.01% { transform: translate(1.806em, -0.486em); }
  36.25% { transform: translate(1.708em, -0.5em); }
  37.5% { transform: translate(1.611em, -0.5em); }
  38.74% { transform: translate(1.528em, -0.458em); }
  40.01% { transform: translate(1.458em, -0.375em); }
  41.25% { transform: translate(1.375em, -0.25em); }
  42.5% { transform: translate(1.306em, -0.167em); }
  43.74% { transform: translate(1.25em, -0.056em); }
  45.01% { transform: translate(1.194em, 0.056em); }
  46.26% { transform: translate(1.139em, 0.181em); }
  47.5% { transform: translate(1.083em, 0.306em); }
  48.74% { transform: translate(1.028em, 0.431em); }
  49.99% { transform: translate(0.958em, 0.611em); }
  51.26% { transform: translate(0.889em, 0.75em); }
  52.5% { transform: translate(0.819em, 0.833em); }
  53.74% { transform: translate(0.722em, 0.917em); }
  54.99% { transform: translate(0.611em, 0.972em); }
  56.26% { transform: translate(0.514em, 1.014em); }
  57.5% { transform: translate(0.375em, 1.056em); }
  58.75% { transform: translate(0.25em, 1.069em); }
  59.99% { transform: translate(0.181em, 1.069em); }
  61.26% { transform: translate(0.111em, 1.042em); }
  62.5% { transform: translate(0.028em, 1em); }
  63.75% { transform: translate(-0.056em, 0.917em); }
  64.99% { transform: translate(-0.125em, 0.833em); }
  66.26% { transform: translate(-0.181em, 0.708em); }
  67.5% { transform: translate(-0.208em, 0.583em); }
  68.75% { transform: translate(-0.236em, 0.444em); }
  69.99% { transform: translate(-0.264em, 0.264em); }
  71.24% { transform: translate(-0.264em, 0.153em); }
  72.51% { transform: translate(-0.208em, 0.042em); }
  73.75% { transform: translate(-0.056em, -0.083em); }
  74.99% { transform: translate(0.125em, -0.181em); }
  76.24% { transform: translate(0.361em, -0.208em); }
  77.51% { transform: translate(0.542em, -0.194em); }
  78.75% { transform: translate(0.667em, -0.125em); }
  80% { transform: translate(0.722em, -0.028em); }
  81.24% { transform: translate(0.75em, 0.083em); }
  82.51% { transform: translate(0.75em, 0.222em); }
  83.75% { transform: translate(0.736em, 0.361em); }
  85% { transform: translate(0.667em, 0.486em); }
  86.24% { transform: translate(0.583em, 0.569em); }
  87.51% { transform: translate(0.486em, 0.611em); }
  88.75% { transform: translate(0.375em, 0.639em); }
  90% { transform: translate(0.278em, 0.639em); }
  91.24% { transform: translate(0.167em, 0.639em); }
  92.49% { transform: translate(0.111em, 0.625em); }
  93.75% { transform: translate(0.083em, 0.611em); }
  95% { transform: translate(0.056em, 0.583em); }
  96.24% { transform: translate(0.042em, 0.583em); }
  97.49% { transform: translate(0.014em, 0.556em); }
  98.76% { transform: translate(0.014em, 0.556em); }
  100% { transform: translate(0.014em, 0.556em); }
}
/* Flight turned off for now (Sydney, Nov 2026): the bee simply rests
   above the end of "You.". To bring the flight back, restore:
   opacity: 0; animation: wl-bee-in 0.5s ease-out 1.15s both,
   wl-bee-flight 4099ms linear 1.15s 1 both; */
.wl-bee { transform: none; }

@media (prefers-reduced-motion: reduce) {
  .wl-kenburns { animation: none; }
  .wl-word, .wl-bee { animation: none; opacity: 1; }
}
`;
