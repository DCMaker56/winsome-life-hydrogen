/*
 * Design: The Stationery Atelier
 * About Page: Authentic brand origin story with editorial layout.
 * Sections: Hero, Welcome, Why Winsome, Honeybee, Our Founder (Sydney's Story
 * page not linked yet, per Sydney), Artist in Residence (links to the Darlene Redfoot
 * Originals collection), Our Promises, reviews, CTA.
 * Ported from winsome-life/client/src/pages/AboutPage.tsx to Hydrogen + React Router 7.
 */
import type {Route} from './+types/about';
import {motion} from 'framer-motion';
import {Link} from 'react-router';
import {useEffect} from 'react';
import {Check, Gift, Heart, MessageCircle, PenLine, Truck} from 'lucide-react';
import {useInView} from '~/hooks/useInView';
import Newsletter from '~/components/Newsletter';
import {ResponsiveImg} from '~/components/ResponsiveImg';
import beeWatercolor from '~/assets/about/bee-watercolor.jpg';
import founderPhoto from '~/assets/home/founder-sydney.jpg';
import SocialProof from '~/components/SocialProof';
import scallopShell from '~/assets/about/scallop-shell-watercolor.jpg';
import hydrangea from '~/assets/about/hydrangea-watercolor.jpg';

export const meta: Route.MetaFunction = () => [
  {title: 'Our Story | The Winsome Life'},
  {
    name: 'description',
    content:
      'Meet Sydney, the founder of The Winsome Life, and learn how a love for fine paper became a studio for luxury personalized stationery.',
  },
  {tagName: 'link', rel: 'canonical', href: 'https://thewinsomelife.com/about'},
];

// CDN images
// The original cloudfront placeholders 404'd (broken images). Swapped for the
// brand's real desk-scene photography + a warm writing-desk lifestyle shot.
const STUDIO_IMG =
  'https://caatee-kr.myshopify.com/cdn/shop/files/03.png?v=1758893929&width=1800';
function HeroBanner() {
  return (
    <section className="relative h-[50vh] min-h-[400px] max-h-[550px] overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${STUDIO_IMG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D2D2D]/50 via-[#2D2D2D]/35 to-[#2D2D2D]/60" />
      <div className="container relative z-10 h-full flex flex-col justify-end pb-12 lg:pb-16">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="font-sans flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-white/60">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li className="text-white/30">/</li>
            <li className="text-white/90">Our Story</li>
          </ol>
        </nav>
        <h1 className="font-serif font-medium text-4xl md:text-5xl lg:text-6xl text-white leading-tight max-w-2xl">
          Our Story
        </h1>
        <p className="font-sans font-light text-lg text-white/70 mt-4 max-w-lg">
          Thoughtful, timeless, and sweet with purpose
        </p>
      </div>
    </section>
  );
}

/** About text: one size throughout (Sydney); emphasis by weight/italics only. */
const storyText = 'font-sans text-[17px] lg:text-lg leading-relaxed';

/**
 * Sydney's watercolors in a circle frame (white mat, thin gold ring) on a
 * background matching the painting's paper. Protected from casual saving:
 * no right-click / drag / long-press, and a clear layer over the image.
 */
function CircleArt({src, alt, paper}: {src: string; alt: string; paper: string}) {
  return (
    <div className="mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px]">
      <div
        className="relative rounded-full bg-white p-2.5 sm:p-3 shadow-[0_24px_50px_-22px_rgba(45,45,45,0.4)] select-none [-webkit-touch-callout:none]"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="relative aspect-square rounded-full overflow-hidden ring-1 ring-[#C9A96E]/70 flex items-center justify-center"
          style={{background: paper}}
        >
          <ResponsiveImg
            src={src}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 330px, 280px"
            alt={alt}
            loading="lazy"
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
        <span aria-hidden className="absolute inset-0 rounded-full" />
      </div>
    </div>
  );
}

function BrandMission() {
  const {ref, inView} = useInView({threshold: 0.15});

  return (
    <section className="py-16 lg:py-24 bg-[#FAF8F5]" ref={ref}>
      <div className="container max-w-6xl">
        <motion.div
          initial={{opacity: 0, y: 25}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.8, ease: 'easeOut'}}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mx-auto mb-8" />
            <h2 className="mb-7">
              <span className="block font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#2D2D2D] mb-3">
                Welcome to
              </span>
              <span
                className="block text-[2.6rem] md:text-[3.2rem] text-[#2D2D2D] leading-[1.05]"
                style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
              >
                The Winsome Life
              </span>
            </h2>
            <div className="space-y-5">
              <p className={`${storyText} font-normal text-[#2D2D2D]`}>
                At The Winsome Life, we believe a handwritten note is a gesture
                of grace, connection and intention.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                We craft luxury stationery that is beautifully made and deeply
                personal.
              </p>
              <p className={`${storyText} font-normal italic text-[#2D2D2D]`}>
                Thoughtful, timeless, and sweet with purpose.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WinsomeDefinition() {
  const {ref, inView} = useInView({threshold: 0.2});

  return (
    <section className="py-16 lg:py-24 bg-white" ref={ref}>
      <div className="container max-w-6xl">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.7, ease: 'easeOut'}}
          className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center"
        >
          {/* Shell first on phones, on the right on larger screens (mirrors the bee). */}
          <div className="lg:order-2">
            <CircleArt
              src={scallopShell}
              paper="#D5D3C7"
              alt="Sydney's original watercolor painting of a scallop shell in gold"
            />
          </div>

          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <h2 className={`${sectionTitle} mb-6`}>
              Why{' '}
              <span className="inline-block text-[1.3em] leading-none relative top-[0.32em] ml-[0.1em]" style={scriptFont}>
                Winsome?
              </span>
            </h2>
            <div className="space-y-5">
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                The word <em>winsome</em> captures the essence of our brand:
                charming, joyful, and quietly uplifting. It reflects the spirit
                of our stationery and the kind of life we hope to inspire&mdash;one
                filled with grace, warmth, and meaningful connection.
              </p>
              {/* A dictionary entry, set apart so it reads as a definition
                  followed by synonyms (Sydney, Nov 2026). */}
              <div className="text-left mx-auto max-w-md lg:mx-0 bg-[#FAF8F5] border border-[#C9A96E]/40 border-l-4 border-l-[#C9A96E] px-6 py-6 shadow-[0_10px_28px_-18px_rgba(45,45,45,0.35)]">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-serif font-semibold text-[2rem] leading-none text-[#1B294E]">
                    win&middot;some
                  </span>
                  <span className="font-sans text-sm text-[#2D2D2D]/60">/&#712;win-s&#601;m/</span>
                  <span className="font-sans font-medium text-[10px] tracking-[0.2em] uppercase text-[#8a6a3a] bg-[#C9A96E]/15 px-2 py-0.5">
                    adjective
                  </span>
                </p>
                <p className="mt-4 font-serif text-[1.2rem] leading-snug text-[#2D2D2D]">
                  <span className="font-sans font-semibold text-sm text-[#C9A96E] mr-1.5">1.</span>
                  Attractive or appealing in appearance or character; generally
                  pleasing and engaging.
                </p>
                <div className="mt-5 pt-4 border-t border-[#C9A96E]/30">
                  <p className="font-sans font-semibold text-[10px] tracking-[0.22em] uppercase text-[#2D2D2D]/55 mb-2">
                    Synonyms
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {['cheerful', 'lighthearted', 'bright', 'sunny', 'upbeat'].map((w) => (
                      <li
                        key={w}
                        className="font-serif italic text-[1.05rem] text-[#1B294E] bg-white ring-1 ring-[#C9A96E]/40 px-3 py-0.5 rounded-full"
                      >
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HoneybeeStory() {
  const {ref, inView} = useInView({threshold: 0.15});

  return (
    <section className="py-16 lg:py-24 bg-[#FAF8F5]" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{opacity: 0, x: -30}}
            animate={inView ? {opacity: 1, x: 0} : {}}
            transition={{duration: 0.8, ease: 'easeOut'}}
          >
            <CircleArt
              src={beeWatercolor}
              paper="#CDCED3"
              alt="Sydney's original watercolor painting of a honeybee with gold detailing"
            />
          </motion.div>

          {/* Right: Honeybee narrative */}
          <motion.div
            initial={{opacity: 0, x: 30}}
            animate={inView ? {opacity: 1, x: 0} : {}}
            transition={{duration: 0.8, ease: 'easeOut', delay: 0.15}}
          >
            <div className="gold-rule w-16 mb-8" />
            <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#2D2D2D] mb-4">
              Our Symbol
            </p>
            <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-8 leading-tight">
              The Honeybee&mdash;{' '}
              <span className="inline-block text-[1.3em] leading-none relative top-[0.32em] ml-[0.1em]" style={scriptFont}>
                sweet with intention
              </span>
            </h2>
            <div className="space-y-5">
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                At the heart of our brand is the honeybee&mdash;nature&rsquo;s
                symbol of connection, community, and lasting sweetness.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                Bees are always communicating, and their honey never spoils. A
                handwritten note is much the same: a small act of intention
                that endures. That is the spirit we bring to every
                piece&mdash;thoughtful, lasting, and made with care.
              </p>
              <div className="pt-4">
                <blockquote className="border-l-2 border-[#C9A96E] pl-5">
                  <p className={`${storyText} font-light italic text-[#2D2D2D]`}>
                    &ldquo;How sweet your words are to my taste&mdash;sweeter
                    than honey.&rdquo;
                  </p>
                  <p className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D] mt-2">
                    Psalm 119:103
                  </p>
                </blockquote>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const sectionEyebrow = 'font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#2D2D2D] mb-4';
const sectionTitle = 'font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] leading-tight';
const scriptFont = {fontFamily: "'Parisian Script', 'Great Vibes', cursive"} as const;

function FounderSection() {
  const {ref, inView} = useInView({threshold: 0.15});
  return (
    <section className="py-16 lg:py-24 bg-white" ref={ref}>
      <div className="container max-w-6xl">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.7, ease: 'easeOut'}}
          className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center"
        >
          <div className="mx-auto w-full max-w-[340px] lg:max-w-[420px]">
            <div className="bg-white p-3 shadow-[0_24px_50px_-22px_rgba(45,45,45,0.4)] ring-1 ring-[#2D2D2D]/5">
              <ResponsiveImg
                src={founderPhoto}
                sizes="(min-width: 1024px) 400px, 320px"
                alt="Sydney Wilson, founder of The Winsome Life, with her daughter"
                width={1066}
                height={1333}
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <p className={sectionEyebrow}>Our Founder</p>
            <h2
              className="text-[2.8rem] md:text-[3.4rem] text-[#2D2D2D] leading-[1.1]"
              style={scriptFont}
            >
              Sydney Wilson
            </h2>
            <div className="space-y-5 mt-6">
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                Wife, mother of three, and lifelong stationery enthusiast,
                Sydney left a successful corporate career to launch The Winsome
                Life. A rather
                unconventional&mdash;or shall we say,{' '}
                <em className="font-normal">winsome</em>&mdash;change of course.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                Today, Sydney personally oversees every collection. Her goal
                is simple: thoughtfully made pieces that bring
                connection, beauty, and joy wherever they land.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ArtistSection() {
  const {ref, inView} = useInView({threshold: 0.15});
  return (
    <section className="py-16 lg:py-24 bg-[#FAF8F5]" ref={ref}>
      <div className="container max-w-6xl">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.7, ease: 'easeOut'}}
          className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center"
        >
          <div className="lg:order-2 mx-auto w-full max-w-[340px] lg:max-w-[420px]">
            <div className="bg-white p-3 shadow-[0_24px_50px_-22px_rgba(45,45,45,0.4)] ring-1 ring-[#2D2D2D]/5">
              <img
                src="https://caatee-kr.myshopify.com/cdn/shop/files/Dar_with_Painting.heic?width=900"
                alt="Darlene Redfoot, artist-in-residence, with one of her paintings"
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <p className={sectionEyebrow}>Artist in Residence</p>
            <h2
              className="text-[2.8rem] md:text-[3.4rem] text-[#2D2D2D] leading-[1.1]"
              style={scriptFont}
            >
              Darlene Redfoot
            </h2>
            <div className="space-y-5 mt-6">
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                For more than five decades, Darlene has captured the beauty of
                the natural world across a wide range of mediums, from
                watercolor and pencil to clay and paint.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                Her work has earned numerous commissions, accolades and
                recognition in the press, yet she approaches her craft with the
                same quiet humility that has defined her career.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                We are honored to name Darlene Redfoot the official Artist in
                Residence at The Winsome Life. Many of her watercolors, from
                florals to seaside scenes to nature studies, appear throughout
                our collection.
              </p>
            </div>
            <Link
              to="/collections/darlene-redfoot-originals"
              className="mt-8 inline-flex items-center gap-2 font-sans font-medium text-[12px] tracking-[0.18em] uppercase text-white bg-[#2D2D2D] px-8 py-3.5 hover:bg-[#1B294E] transition-colors"
            >
              Shop Darlene&rsquo;s Originals <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Short and colorful so it's easy to take in at a glance (Sydney, Nov 2026).
const PROMISES = [
  {
    icon: PenLine,
    color: '#3A5A8C',
    title: 'Easy personalization',
    text: 'Your name, font and colors in a few simple steps.',
  },
  {
    icon: Check,
    color: '#6B8F71',
    title: 'You approve first',
    text: 'Nothing prints until you say yes, or ask for a proof.',
  },
  {
    icon: Heart,
    color: '#B5636B',
    title: 'We make it right',
    text: 'If we ever get something wrong, we fix it.',
  },
  {
    icon: MessageCircle,
    color: '#4F7CA8',
    title: 'Real people',
    text: 'Our small team answers every message personally.',
    link: {to: '/contact', label: 'Contact us'},
  },
  {
    icon: Truck,
    color: '#B08A4E',
    title: 'Made in 5\u20137 days',
    text: 'Made to order, then on its way. Free shipping over $75.',
  },
  {
    icon: Gift,
    color: '#123D2E',
    title: 'Sets that save',
    text: 'Two pieces of a matching set? Save 10%, automatically.',
  },
];

function PromisesSection() {
  const {ref, inView} = useInView({threshold: 0.15});
  // Split layout on navy (Sydney, Nov 2026): painting + heading on the left,
  // the six promises as compact white cards on the right.
  return (
    <section className="py-16 lg:py-24 bg-[#1B294E]" ref={ref}>
      <div className="container max-w-6xl">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <div className="w-40 sm:w-48 lg:w-56 mx-auto lg:mx-0 mb-7">
              <CircleArt
                src={hydrangea}
                paper="#D3CAB2"
                alt="Sydney's original watercolor painting of a blue hydrangea"
              />
            </div>
            <p className={`${sectionEyebrow} !text-[#E8C98E]`}>Our Promises</p>
            <h2 className="font-serif font-medium text-3xl md:text-[2.4rem] text-white leading-tight lg:whitespace-nowrap">
              What you can{' '}
              <span
                className="inline-block text-[1.3em] leading-none relative top-[0.32em] ml-[0.1em] text-[#E8C98E]"
                style={scriptFont}
              >
                count on
              </span>
            </h2>
            <p className="mt-7 font-sans font-light text-base md:text-[17px] text-white/80 leading-relaxed max-w-md mx-auto lg:mx-0">
              Six promises behind every order, from your first click to the
              moment it arrives.
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {PROMISES.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{opacity: 0, y: 16}}
                animate={inView ? {opacity: 1, y: 0} : {}}
                transition={{duration: 0.45, ease: 'easeOut', delay: 0.08 + i * 0.07}}
                className="bg-white p-5 flex gap-4 items-start border-l-4 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.5)]"
                style={{borderLeftColor: p.color}}
              >
                <span
                  className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full"
                  style={{background: p.color}}
                >
                  <p.icon size={20} className="text-white" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <h3 className="font-serif font-semibold text-[1.2rem] leading-tight" style={{color: p.color}}>
                    {p.title}
                  </h3>
                  <p className="font-sans text-[14px] leading-snug text-[#2D2D2D]/80 mt-1">{p.text}</p>
                  {p.link && (
                    <Link
                      to={p.link.to}
                      className="mt-2 inline-block font-sans font-medium text-[11px] tracking-[0.16em] uppercase text-[#2D2D2D] border-b border-[#2D2D2D]/40 hover:border-[#2D2D2D]"
                    >
                      {p.link.label}
                    </Link>
                  )}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ShopCTA() {
  const {ref, inView} = useInView({threshold: 0.2});

  return (
    <section className="py-16 lg:py-24 bg-[#FAF8F5]" ref={ref}>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={inView ? {opacity: 1, y: 0} : {}}
        transition={{duration: 0.6, ease: 'easeOut'}}
        className="container text-center"
      >
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mx-auto mb-8" />
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
            Looking for your next{' '}
            <span className="inline-block text-[1.3em] leading-none relative top-[0.32em] ml-[0.1em]" style={scriptFont}>
              gift?
            </span>
          </h2>
          <p className={`${storyText} font-light text-[#2D2D2D] mb-8`}>
            Browse our collections and discover stationery that reflects your
            unique style&mdash;thoughtful, timeless, and beautifully personal.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/collections/all"
            className="font-sans font-medium inline-flex items-center justify-center px-8 py-3.5 bg-[#2D2D2D] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#1a1a1a] transition-colors duration-300"
          >
            Shop All Collections
          </Link>
          <Link
            to="/collections/bestsellers"
            className="font-sans font-medium inline-flex items-center justify-center px-8 py-3.5 border border-[#2D2D2D] text-[#2D2D2D] text-sm tracking-[0.15em] uppercase hover:bg-[#2D2D2D] hover:text-white transition-colors duration-300"
          >
            Bestsellers
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default function AboutRoute() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <HeroBanner />
      <BrandMission />
      <WinsomeDefinition />
      <HoneybeeStory />
      <FounderSection />
      <ArtistSection />
      <PromisesSection />
      <SocialProof />
      <ShopCTA />
      <Newsletter />
    </div>
  );
}
