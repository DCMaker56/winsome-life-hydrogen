/*
 * BrandStory — the Founder's Welcome.
 *
 * Two columns on larger screens: a layered photo composition (Sydney's
 * honeybee watercolor behind, her photo with her daughter in front,
 * framed like a print) beside the welcome copy, signature and Learn More.
 * On phones the composition sits above the copy.
 */
import {Link} from 'react-router';
import {ResponsiveImg} from '~/components/ResponsiveImg';
import founderPhoto from '~/assets/home/founder-sydney.jpg';
import beePainting from '~/assets/home/bee-painting.jpg';

const script = {
  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
  lineHeight: '0.9',
} as const;

const copy = 'font-sans font-light text-base lg:text-[17px] text-[#2D2D2D]/85 leading-relaxed';

export default function BrandStory() {
  return (
    <section
      id="brand-story"
      className="relative py-20 lg:py-28 overflow-hidden bg-[#CADEEA]"
      aria-label="Founder's Welcome"
    >
      <div className="container relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-14 lg:gap-20 items-center">
          {/* Layered photos: the painting behind, Sydney's photo in front */}
          <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[520px] aspect-[1/1.1]">
            {/* Painting behind, smaller */}
            <div className="absolute top-0 left-0 w-[56%] aspect-square bg-white p-2 sm:p-3 shadow-[0_18px_40px_-18px_rgba(45,45,45,0.35)] ring-1 ring-[#2D2D2D]/10">
              <ResponsiveImg
                src={beePainting}
                sizes="(min-width: 1024px) 300px, 56vw"
                alt="Sydney's original watercolor painting of a honeybee with gold detailing"
                width={1400}
                height={1400}
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-cover select-none"
              />
            </div>
            {/* Portrait in front, the larger of the two */}
            <div className="absolute bottom-0 right-0 w-[64%] aspect-[4/5] bg-white p-2 sm:p-3 shadow-[0_24px_50px_-20px_rgba(45,45,45,0.45)]">
              <ResponsiveImg
                src={founderPhoto}
                sizes="(min-width: 1024px) 340px, 64vw"
                alt="Sydney, founder of The Winsome Life, with her daughter on the beach"
                width={1066}
                height={1333}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            {/* The brand's script tagline (from the store signage) */}
            <p
              className="absolute left-[3%] top-[55%] w-[34%] text-[#2D2D2D] text-[1.35rem] sm:text-[1.9rem] lg:text-[2.1rem] leading-[1.1]"
              style={{fontFamily: script.fontFamily}}
              aria-hidden
            >
              sweeter
              <br />
              than honey
            </p>
          </div>

          {/* Welcome copy */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <p className="font-sans font-medium text-[11px] tracking-[0.3em] uppercase text-[#2D2D2D]/60 mb-10">
              From Our Founder
            </p>
            {/* Script "F", the rest in print; one line on larger screens */}
            <h2 className="font-serif font-medium text-[#2D2D2D] text-[2.4rem] md:text-5xl lg:text-[3.1rem] leading-[1.15] mb-7 lg:whitespace-nowrap">
              <span
                className="inline-block -mr-[0.3em] align-[-0.04em]"
                style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive", fontSize: '1.2em', lineHeight: 1}}
              >
                F
              </span>
              ounder&rsquo;s Welcome
            </h2>
            <div aria-hidden className="mx-auto lg:mx-0 mb-7 h-px w-20 bg-[#2D2D2D]/30" />

            <div className="space-y-5">
              <p className={copy}>Welcome. We are so happy you&rsquo;re here.</p>
              <p className={copy}>
                At The Winsome Life, we believe the most meaningful things are
                personal. We create luxury stationery designed not just to be
                used, but to be treasured.
              </p>
              <p className={copy}>
                Whether you&rsquo;re writing a note, giving a gift, or
                celebrating a moment, we&rsquo;re here to help you make it
                beautifully personal.
              </p>
            </div>

            <div className="mt-8">
              <p className={copy}>Welcome again,</p>
              <p
                className="mt-4 text-[2.8rem] text-[#2D2D2D]"
                style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive", lineHeight: 1.2}}
              >
                Sydney
              </p>
            </div>

            <div className="mt-9">
              <Link
                to="/about"
                className="font-sans font-medium inline-flex items-center text-sm tracking-[0.15em] uppercase text-white bg-[#2D2D2D] px-9 py-3.5 hover:bg-[#1B294E] transition-colors duration-300"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
