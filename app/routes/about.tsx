/*
 * Design: The Stationery Atelier
 * About Page: Authentic brand origin story with editorial layout.
 * Sections: Hero, Brand Mission, Winsome Definition, Honeybee Story, Meet the Team, Our Process, Values, CTA.
 * Ported from winsome-life/client/src/pages/AboutPage.tsx to Hydrogen + React Router 7.
 */
import type {Route} from './+types/about';
import {motion} from 'framer-motion';
import {Link} from 'react-router';
import {useEffect} from 'react';
import {Heart, Palette, Sparkles, Gift} from 'lucide-react';
import {useInView} from '~/hooks/useInView';
import Newsletter from '~/components/Newsletter';

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
  'https://www.thewinsomelife.com/cdn/shop/files/03.png?v=1758893929&width=1800';
const FOUNDER_IMG =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1100&q=80';
const PROCESS_IMG =
  'https://www.thewinsomelife.com/cdn/shop/files/04.png?v=1758894113&width=1600';
const VALUES_IMG =
  'https://www.thewinsomelife.com/cdn/shop/files/03.png?v=1758893929&width=1600';

const values = [
  {
    icon: Heart,
    title: 'Gentle & Gracious',
    description:
      'Every interaction — from browsing our collections to the day your order arrives — is designed to feel personal, warm, and genuinely caring. We treat every customer like a friend.',
  },
  {
    icon: Palette,
    title: 'Quiet Sophistication',
    description:
      'From the texture of the paper to the richness of the print, each detail reflects our commitment to quality and understated elegance. Nothing loud, nothing rushed — just beautifully intentional design.',
  },
  {
    icon: Sparkles,
    title: 'Beautifully Intentional',
    description:
      'Every piece is thoughtfully designed with purpose. We believe that a handwritten note is more than words on paper — it’s a gesture of grace, connection, and intention.',
  },
  {
    icon: Gift,
    title: 'Sweet with Purpose',
    description:
      'Inspired by our symbol, the honeybee, we believe in creating things that endure. Every card, note, or letter you send is a small act of connection that, like honey, never goes out of style.',
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Original Artwork',
    description:
      'Many of our illustrations are original pieces created exclusively for The Winsome Life by our artist-in-residence, Darlene Redfoot, whose watercolors bring flora, fauna, and seaside scenes to life with striking realism.',
  },
  {
    number: '02',
    title: 'Thoughtful Design',
    description:
      'Each original painting is carefully composed into stationery layouts that balance beauty with function. Every element — from typography to spacing — is considered to ensure quiet sophistication on the page.',
  },
  {
    number: '03',
    title: 'Premium Materials',
    description:
      'We print on luxe card stock using rich, archival-quality inks. From the texture of the paper to the vibrancy of each color, we never compromise on the details that make our stationery feel special in your hands.',
  },
  {
    number: '04',
    title: 'Personalization & Care',
    description:
      'Your personalization is added with precision and care — from custom monograms to hand-selected details. Every order is packaged thoughtfully, because we believe the experience should be as memorable as the note inside.',
  },
];

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

function BrandMission() {
  const {ref, inView} = useInView({threshold: 0.15});

  return (
    <section className="py-16 lg:py-24 bg-[#FAF8F5]" ref={ref}>
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 25}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.8, ease: 'easeOut'}}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mx-auto mb-8" />
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
            Welcome to The Winsome Life
          </p>
          <p className="font-serif text-xl lg:text-2xl text-[#2D2D2D]/80 leading-relaxed mb-8">
            At The Winsome Life, we believe in the quiet beauty of putting pen
            to paper&mdash;where a handwritten note becomes a gesture of grace,
            connection, and intention.
          </p>
          <div className="space-y-5 mb-10">
            <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed">
              Inspired by the honeybee&mdash;symbol of community, sweetness,
              and purpose&mdash;we craft luxury stationery that is gentle,
              gracious, and beautifully intentional.
            </p>
            <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed">
              From the texture of the paper to the richness of the print, each
              detail reflects our commitment to quality and quiet
              sophistication&mdash;and we aim to make every interaction as
              personal and memorable as the note inside.
            </p>
          </div>
          <p
            className="text-lg lg:text-xl text-[#2D2D2D] font-medium"
            style={{fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic'}}
          >
            This is The Winsome Life&mdash;thoughtful, timeless, and sweet with
            purpose.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function WinsomeDefinition() {
  const {ref, inView} = useInView({threshold: 0.2});

  return (
    <section className="py-16 lg:py-24 bg-white" ref={ref}>
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.7, ease: 'easeOut'}}
          className="max-w-2xl mx-auto text-center"
        >
          <p
            className="text-4xl lg:text-5xl text-[#C9A96E] mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500,
              fontStyle: 'italic',
            }}
          >
            Winsome
          </p>
          <p className="font-sans font-medium text-xs tracking-[0.2em] uppercase text-[#2D2D2D]/40 mb-6">
            Adjective
          </p>
          <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed mb-4">
            <span className="font-medium text-[#2D2D2D]/85">Definition:</span>{' '}
            Attractive or appealing in appearance or character. Generally
            pleasing and engaging.
          </p>
          <p
            className="text-sm text-[#2D2D2D]/50 mb-8"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 300,
              fontStyle: 'italic',
            }}
          >
            Synonyms: cheerful, lighthearted, bright, sunny, upbeat
          </p>
          <div className="w-12 h-[1px] bg-[#C9A96E]/30 mx-auto mb-8" />
          <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed">
            The word <em className="font-serif">winsome</em> captures the
            essence of our brand&mdash;charming, joyful, and quietly uplifting.
            It reflects the spirit of our stationery, our symbol the honeybee,
            and the kind of life we aspire to inspire: one filled with grace,
            warmth, and meaningful connection.
          </p>
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
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border border-[#C9A96E]/20" />
              <img
                src={FOUNDER_IMG}
                alt="Original watercolor artwork being created for The Winsome Life stationery"
                className="w-full h-[500px] lg:h-[600px] object-cover relative z-10"
                loading="lazy"
              />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#C9A96E]/10 z-0" />
            </div>
          </motion.div>

          {/* Right: Honeybee narrative */}
          <motion.div
            initial={{opacity: 0, x: 30}}
            animate={inView ? {opacity: 1, x: 0} : {}}
            transition={{duration: 0.8, ease: 'easeOut', delay: 0.15}}
          >
            <div className="gold-rule w-16 mb-8" />
            <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
              Our Symbol
            </p>
            <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-8 leading-tight">
              The Honeybee&mdash;{' '}
              <span className="text-[#C9A96E]" style={{fontStyle: 'italic'}}>
                sweet with intention
              </span>
            </h2>
            <div className="space-y-5">
              <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed">
                At the heart of our brand is the honeybee&mdash;nature&rsquo;s
                perfect symbol of connection, community, and lasting sweetness.
                Just as bees thrive through collaboration and create honey that
                never spoils, meaningful handwritten correspondence builds
                lasting bonds between people.
              </p>
              <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed">
                Bees are always communicating, always connected&mdash;just like
                us when we pause to write and share meaningful sentiments. Our
                stationery is designed to capture that same spirit: thoughtful,
                enduring, and sweet with intention. Every card, note, or letter
                you send is a small act of connection that, like honey, never
                goes out of style.
              </p>
              <div className="pt-4">
                <blockquote className="border-l-2 border-[#C9A96E] pl-5">
                  <p
                    className="text-base text-[#2D2D2D]/55 leading-relaxed"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;How sweet your words are to my taste&mdash;sweeter
                    than honey.&rdquo;
                  </p>
                  <p className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#C9A96E] mt-2">
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

function MeetTheTeam() {
  const {ref, inView} = useInView({threshold: 0.15});

  return (
    <section className="py-16 lg:py-24 bg-white" ref={ref}>
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.6, ease: 'easeOut'}}
          className="text-center mb-12 lg:mb-16"
        >
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
            The People Behind the Paper
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            Meet Our Team
          </h2>
        </motion.div>

        {/* Team grid */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-4xl mx-auto">
          {/* Sydney */}
          <motion.div
            initial={{opacity: 0, y: 25}}
            animate={inView ? {opacity: 1, y: 0} : {}}
            transition={{duration: 0.6, ease: 'easeOut', delay: 0.1}}
            className="text-center"
          >
            <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-2 border-[#C9A96E]/20 bg-[#FAF8F5]">
              <img
                src="https://www.thewinsomelife.com/cdn/shop/files/Screen_Shot_2025-09-08_at_00.10.png?width=600"
                alt="Sydney Wilson, founder of The Winsome Life"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-serif font-medium text-xl text-[#2D2D2D] mb-1">
              Sydney Wilson
            </h3>
            <p className="font-sans font-medium text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-4">
              Founder
            </p>
            <p className="font-sans font-light text-sm text-[#2D2D2D]/75 leading-relaxed max-w-xs mx-auto">
              Wife. Mother of three. Stationery fan. Sydney founded The Winsome
              Life with a belief that the most meaningful things in life are
              personal&mdash;and that a beautifully crafted note can carry more
              than words.
            </p>
          </motion.div>

          {/* Darlene */}
          <motion.div
            initial={{opacity: 0, y: 25}}
            animate={inView ? {opacity: 1, y: 0} : {}}
            transition={{duration: 0.6, ease: 'easeOut', delay: 0.2}}
            className="text-center"
          >
            <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-2 border-[#C9A96E]/20 bg-[#FAF8F5]">
              <img
                src="https://www.thewinsomelife.com/cdn/shop/files/Dar_with_Painting.heic?width=600"
                alt="Darlene Redfoot, artist-in-residence, with one of her paintings"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-serif font-medium text-xl text-[#2D2D2D] mb-1">
              Darlene Redfoot
            </h3>
            <p className="font-sans font-medium text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-4">
              Artist-in-Residence
            </p>
            <p className="font-sans font-light text-sm text-[#2D2D2D]/75 leading-relaxed max-w-xs mx-auto">
              For over five decades, Darlene has worked across watercolor,
              pencil, clay, and paint, bringing flora, fauna, and seaside
              scenes to life with striking realism. Many of the illustrations
              in our collections are her original pieces, created exclusively
              for The Winsome Life.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const {ref, inView} = useInView({threshold: 0.1});

  return (
    <section className="py-16 lg:py-24 bg-[#FAF8F5]" ref={ref}>
      <div className="container">
        {/* Full-width process image */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.7, ease: 'easeOut'}}
          className="mb-12 lg:mb-16"
        >
          <div className="relative overflow-hidden">
            <img
              src={PROCESS_IMG}
              alt="From original watercolor paintings to finished luxury stationery"
              className="w-full h-[300px] lg:h-[450px] object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/20 to-transparent" />
          </div>
        </motion.div>

        {/* Section header */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={inView ? {opacity: 1, y: 0} : {}}
          transition={{duration: 0.6, ease: 'easeOut', delay: 0.1}}
          className="text-center mb-12 lg:mb-16"
        >
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
            From Studio to Doorstep
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
            Our Process
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed max-w-2xl mx-auto">
            Every piece of Winsome stationery passes through these four stages
            of care before it arrives at your door.
          </p>
        </motion.div>

        {/* Process steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {processSteps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{opacity: 0, y: 25}}
              animate={inView ? {opacity: 1, y: 0} : {}}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                delay: 0.15 + i * 0.1,
              }}
              className="relative"
            >
              {/* Step number */}
              <span className="font-serif text-5xl lg:text-6xl text-[#C9A96E]/15 font-bold leading-none block mb-3">
                {step.number}
              </span>
              <h3 className="font-serif font-medium text-lg text-[#2D2D2D] mb-3">
                {step.title}
              </h3>
              <p className="font-sans font-light text-sm text-[#2D2D2D]/75 leading-relaxed">
                {step.description}
              </p>
              {/* Connector line (except last) */}
              {i < processSteps.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-3 w-6 h-[1px] bg-[#C9A96E]/25" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  const {ref, inView} = useInView({threshold: 0.15});

  return (
    <section className="py-16 lg:py-24 bg-white" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Left: Values content (3 cols) */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{opacity: 0, y: 20}}
              animate={inView ? {opacity: 1, y: 0} : {}}
              transition={{duration: 0.6, ease: 'easeOut'}}
              className="mb-12"
            >
              <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
                What We Stand For
              </p>
              <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
                Our Values
              </h2>
              <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed max-w-lg">
                These principles guide every decision we make, from the paper we
                choose to the way we wrap your order.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-8">
              {values.map((value, i) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.title}
                    initial={{opacity: 0, y: 20}}
                    animate={inView ? {opacity: 1, y: 0} : {}}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                      delay: 0.15 + i * 0.1,
                    }}
                    className="group"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#C9A96E]/30 flex items-center justify-center mb-4 group-hover:bg-[#C9A96E]/10 transition-colors duration-300">
                      <Icon size={20} className="text-[#C9A96E]" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-serif font-medium text-lg text-[#2D2D2D] mb-2">
                      {value.title}
                    </h3>
                    <p className="font-sans font-light text-sm text-[#2D2D2D]/75 leading-relaxed">
                      {value.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Image (2 cols) */}
          <motion.div
            initial={{opacity: 0, x: 20}}
            animate={inView ? {opacity: 1, x: 0} : {}}
            transition={{duration: 0.8, ease: 'easeOut', delay: 0.2}}
            className="lg:col-span-2"
          >
            <div className="relative sticky top-32">
              <div className="absolute -top-3 -right-3 w-full h-full border border-[#C9A96E]/20" />
              <img
                src={VALUES_IMG}
                alt="Luxury stationery with wax seal and silk ribbon — attention to detail"
                className="w-full h-[450px] lg:h-[580px] object-cover relative z-10"
                loading="lazy"
              />
            </div>
          </motion.div>
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
            Looking for your next gift or personalized stationery?
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/75 leading-relaxed mb-8">
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
            className="font-sans font-medium inline-flex items-center justify-center px-8 py-3.5 border border-[#C9A96E] text-[#C9A96E] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A96E] hover:text-white transition-colors duration-300"
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
      <MeetTheTeam />
      <ProcessSection />
      <ValuesSection />
      <ShopCTA />
      <Newsletter />
    </div>
  );
}
