/*
 * BrandStory — the Founder's Welcome, rebuilt to match thewinsomelife.com:
 * a centered single column with a "Founder's Welcome" title (script F & W),
 * the welcome copy centered, Sydney's signature, and a Learn More link — with
 * the brand's bird-of-paradise floral as a decorative accent.
 */
import { Link } from "react-router";

const FLORAL =
  "https://www.thewinsomelife.com/cdn/shop/files/birdofparadise.jpg?v=1772037256&width=600";

const script = {
  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
  lineHeight: "0.9",
} as const;

export default function BrandStory() {
  return (
    <section
      id="brand-story"
      className="relative py-20 lg:py-28 overflow-hidden bg-[#F6F0E7]"
      aria-label="Founder's Welcome"
    >
      <div className="container relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          {/* Bird-of-paradise floral accent */}
          <img
            src={FLORAL}
            alt=""
            aria-hidden
            loading="lazy"
            className="w-28 h-28 lg:w-32 lg:h-32 object-contain mx-auto mb-4 mix-blend-multiply"
          />

          {/* "Founder's Welcome" title — F & W in Parisian script */}
          <h2 className="font-serif font-medium text-[#2D2D2D] text-3xl md:text-4xl lg:text-5xl tracking-wide mb-8 uppercase">
            <span className="text-[#C9A96E]" style={{...script, fontSize: "1.5em"}}>
              F
            </span>
            ounder&rsquo;s{" "}
            <span className="text-[#C9A96E]" style={{...script, fontSize: "1.5em"}}>
              W
            </span>
            elcome
          </h2>

          <div className="space-y-5">
            <p className="font-serif text-2xl md:text-3xl text-[#2D2D2D] leading-snug">
              Welcome.{" "}
              <span className="text-[#2D2D2D]/55">
                We are so happy you&rsquo;re here.
              </span>
            </p>
            <p className="font-sans font-light text-base lg:text-lg text-[#2D2D2D]/75 leading-relaxed">
              At The Winsome Life, we believe the most meaningful things are
              personal. We create luxury stationery designed not just to be used,
              but to be <em className="font-serif not-italic">treasured</em>.
            </p>
            <p className="font-sans font-light text-base lg:text-lg text-[#2D2D2D]/75 leading-relaxed">
              Every piece is crafted with care, with fine materials, made to
              reflect your unique style, passions, and purpose. Whether
              you&rsquo;re writing a note, giving a gift, or creating a moment,
              we&rsquo;re here to help you make it beautifully personal.
            </p>
          </div>

          <div className="mt-8">
            <p className="font-sans text-base text-[#2D2D2D]/60 mb-1">
              Welcome again,
            </p>
            <p className="text-[2.4rem] text-[#2D2D2D] leading-none" style={script}>
              Sydney
            </p>
          </div>

          <div className="mt-9">
            <Link
              to="/about"
              className="font-sans font-medium inline-flex items-center text-sm tracking-[0.15em] uppercase text-white bg-[#2D2D2D] px-9 py-3.5 hover:bg-[#C9A96E] transition-colors duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
