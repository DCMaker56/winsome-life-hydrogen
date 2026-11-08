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
import {Check, Gift, Heart, MessageCircle, PenLine} from 'lucide-react';
import {useInView} from '~/hooks/useInView';
import Newsletter from '~/components/Newsletter';
import {ResponsiveImg} from '~/components/ResponsiveImg';
import beeWatercolor from '~/assets/about/bee-watercolor.jpg';
import founderPhoto from '~/assets/home/founder-sydney.jpg';
import SocialProof from '~/components/SocialProof';
import scallopShell from '~/assets/about/scallop-shell-watercolor.jpg';
// Small copy from the Retail Partners page; swap for the full-size original when we have it.
import hydrangea from '~/assets/retail/art-hydrangea.webp';

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
                Inspired by the honeybee, a symbol of community, sweetness and
                purpose, we craft luxury stationery that is beautifully made and
                deeply personal.
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
                We chose the word <em>winsome</em> because it captures the
                essence of our brand: charming, joyful, and quietly uplifting. It
                reflects the spirit of our stationery, our symbol the honeybee,
                and the kind of life we hope to inspire, one filled with grace,
                warmth, and meaningful connection.
              </p>
              <div className="border-l-2 border-[#C9A96E] pl-5 text-left mx-auto max-w-md lg:mx-0">
                <p className={`${storyText} text-[#2D2D2D]`}>
                  <span className="font-serif italic text-2xl">winsome</span>{' '}
                  <span className="font-sans text-xs tracking-[0.2em] uppercase">adjective</span>
                </p>
                <p className={`${storyText} font-light text-[#2D2D2D] mt-1`}>
                  Attractive or appealing in appearance or character. Generally
                  pleasing and engaging.
                </p>
                <p className={`${storyText} font-light italic text-[#2D2D2D] mt-1`}>
                  Cheerful, lighthearted, bright, sunny, upbeat.
                </p>
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
                handwritten note is much the same: a small act of connection
                that lasts. That is the spirit we bring to every piece&mdash;
                thoughtful, enduring, and sweet with intention.
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
                Today, Sydney personally oversees every collection and the
                customer experience behind it, ensuring timeless design,
                impeccable quality, and exceptional service. Her hope is simple:
                that every piece brings a little more beauty and joy to
                someone&rsquo;s day.
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
                For over five decades, Darlene has worked across watercolor,
                pencil, clay and paint, bringing flora, fauna and seaside scenes
                to life with striking realism.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                She painted the very first artwork The Winsome Life printed,
                and much of our collection today is her original work, painted
                especially for us.
              </p>
              <p className={`${storyText} font-light text-[#2D2D2D]`}>
                Darlene&rsquo;s artistry has shaped The Winsome Life from the very
                beginning. The patience, skill and care in every brushstroke set
                the standard for everything we make, and we are endlessly
                grateful to have her extraordinary talent at the heart of our
                story.
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

const PROMISES = [
  {
    icon: PenLine,
    title: 'Personalization made easy',
    text: 'Choose your name, font and colors in a few simple steps, and get it exactly the way you want it.',
  },
  {
    icon: Check,
    title: 'You approve before we print',
    text: 'Every personalized order is approved by you, or you can ask for a proof first.',
  },
  {
    icon: Heart,
    title: 'If we make a mistake, we make it right',
    text: 'Your order should be exactly what you approved. If we get something wrong, we will fix it.',
  },
  {
    icon: MessageCircle,
    title: 'Real people, here to help',
    text: 'Questions about a design or an order? Our small team answers personally.',
    link: {to: '/contact', label: 'Contact us'},
  },
  {
    icon: Gift,
    title: 'Sets that save',
    text: 'Buy two or more pieces of a matching set and save 10%, automatically at checkout.',
  },
];

function PromisesSection() {
  const {ref, inView} = useInView({threshold: 0.15});
  return (
    <section className="py-16 lg:py-24 bg-[#F3ECDD]" ref={ref}>
      <div className="container max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="w-44 sm:w-52 mx-auto mb-8">
            <CircleArt
              src={hydrangea}
              paper="#F6F2EB"
              alt="Sydney's original watercolor painting of a blue hydrangea"
            />
          </div>
          <p className={sectionEyebrow}>Our Promises</p>
          <h2 className={sectionTitle}>
            What you can{' '}
            <span className="inline-block text-[1.3em] leading-none relative top-[0.32em] ml-[0.1em]" style={scriptFont}>
              count on
            </span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{opacity: 0, y: 20}}
              animate={inView ? {opacity: 1, y: 0} : {}}
              transition={{duration: 0.5, ease: 'easeOut', delay: 0.1 + i * 0.08}}
              className="bg-white p-6 text-center shadow-sm"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full ring-1 ring-[#C9A96E]">
                <p.icon size={20} className="text-[#2D2D2D]" strokeWidth={1.5} />
              </span>
              <h3 className="font-serif font-medium text-xl text-[#2D2D2D] mt-4 mb-2">{p.title}</h3>
              <p className="font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]">{p.text}</p>
              {p.link && (
                <Link
                  to={p.link.to}
                  className="mt-3 inline-block font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-[#2D2D2D] border-b border-[#2D2D2D]/40 hover:border-[#2D2D2D]"
                >
                  {p.link.label}
                </Link>
              )}
            </motion.div>
          ))}
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
