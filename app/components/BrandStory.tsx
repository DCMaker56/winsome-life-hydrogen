/*
 * BrandStory — the Founder's Welcome.
 *
 * Two columns on larger screens: a layered photo composition (Sydney's
 * bird-of-paradise watercolor behind, her photo with her daughter in front,
 * framed like a print) beside the welcome copy, signature and Learn More.
 * On phones the composition sits above the copy.
 */
import {Link} from 'react-router';
import {ResponsiveImg} from '~/components/ResponsiveImg';
import founderPhoto from '~/assets/home/founder-sydney.jpg';
import birdOfParadise from '~/assets/home/bird-of-paradise-painting.jpg';

const script = {
  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
  lineHeight: '0.9',
} as const;

const copy = 'font-sans font-light text-base lg:text-[17px] text-[#2D2D2D]/75 leading-relaxed';

export default function BrandStory() {
  return (
    <section
      id="brand-story"
      className="relative py-20 lg:py-28 overflow-hidden bg-[#F6F0E7]"
      aria-label="Founder's Welcome"
    >
      <div className="container relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-14 lg:gap-20 items-center">
          {/* Layered photos: the painting behind, Sydney's photo in front */}
          <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[520px] aspect-[1/1.08]">
            {/* Painting, like a watercolor sheet laid on the table */}
            <div className="absolute top-0 left-0 w-[72%] aspect-square -rotate-[4deg] bg-white p-2 sm:p-3 shadow-[0_18px_40px_-18px_rgba(45,45,45,0.35)] ring-1 ring-[#C9A96E]/20">
              <ResponsiveImg
                src={birdOfParadise}
                sizes="(min-width: 1024px) 360px, 70vw"
                alt="Sydney's original watercolor painting of a bird of paradise flower"
                width={1400}
                height={1400}
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-cover select-none"
              />
            </div>
            {/* Thin gold frame offset behind the portrait */}
            <div
              aria-hidden
              className="absolute bottom-[-14px] right-[-14px] w-[54%] aspect-[4/5] border border-[#C9A96E]/60 rotate-[2deg]"
            />
            {/* Portrait, matted like a print */}
            <div className="absolute bottom-0 right-0 w-[54%] aspect-[4/5] rotate-[2deg] bg-white p-2 sm:p-3 shadow-[0_24px_50px_-20px_rgba(45,45,45,0.45)]">
              <ResponsiveImg
                src={founderPhoto}
                sizes="(min-width: 1024px) 290px, 54vw"
                alt="Sydney, founder of The Winsome Life, with her daughter on the beach"
                width={1066}
                height={1333}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Gold script tag on the photo corner */}
            <p
              className="absolute left-[4%] bottom-[4%] text-[#C9A96E] text-[2.1rem] sm:text-[2.4rem] -rotate-[6deg] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]"
              style={script}
              aria-hidden
            >
              with love
            </p>
          </div>

          {/* Welcome copy */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <p className="font-sans font-medium text-[11px] tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
              From Our Founder
            </p>
            <h2 className="font-serif font-medium text-[#2D2D2D] text-3xl md:text-4xl lg:text-[2.9rem] tracking-wide mb-7 uppercase leading-tight">
              <span className="text-[#C9A96E]" style={{...script, fontSize: '1.5em'}}>
                F
              </span>
              ounder&rsquo;s{' '}
              <span className="text-[#C9A96E]" style={{...script, fontSize: '1.5em'}}>
                W
              </span>
              elcome
            </h2>
            <div
              aria-hidden
              className="mx-auto lg:mx-0 mb-7 h-px w-20 bg-gradient-to-r from-[#C9A96E] to-[#C9A96E]/0"
            />

            <div className="space-y-5">
              <p className={copy}>Welcome. We are so happy you&rsquo;re here.</p>
              <p className={copy}>
                At The Winsome Life, we believe the most meaningful things are
                personal. We create luxury stationery designed not just to be used,
                but to be treasured.
              </p>
              <p className={copy}>
                Every piece is crafted with care, with fine materials, made to
                reflect your unique style, passions, and purpose. Whether
                you&rsquo;re writing a note, giving a gift, or creating a moment,
                we&rsquo;re here to help you make it beautifully personal.
              </p>
            </div>

            <div className="mt-8">
              <p className={`${copy} mb-1`}>Welcome again,</p>
              <p className="text-[2.8rem] text-[#2D2D2D] leading-none" style={script}>
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
      </div>
    </section>
  );
}
