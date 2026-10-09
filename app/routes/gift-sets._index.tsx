/*
 * Gift Sets — single-showcase overhaul.
 *
 * Daniel's direction: don't dump a grid of sets. Showcase ONE gift set (the
 * Seahorse) up front; clicking it opens the build page where every piece and
 * personalization option lives. Below the hero set we offer the same complete
 * set in a handful of other illustrations — "build it in any design."
 */
import type {Route} from './+types/gift-sets._index';
import {Link} from 'react-router';
import {useEffect} from 'react';
import {Check, Gift, ArrowRight, Star} from 'lucide-react';
import Newsletter from '~/components/Newsletter';
import {giftSets, type GiftSet} from '~/lib/bundles';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Gift Sets | The Winsome Life'},
    {
      name: 'description',
      content:
        'One design, a complete coordinated gift set — notecards, notepad, calendar, mug, and gift tags. Build yours in any illustration.',
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: 'https://thewinsomelife.com/gift-sets',
    },
  ];
};

/** The hero set we lead with — the Seahorse, or the first bestseller. */
function featuredSet(): GiftSet {
  return (
    giftSets.find((s) => s.slug === 'seahorse-gift-set') ??
    giftSets.find((s) => s.badge === 'Bestseller') ??
    giftSets[0]
  );
}

function Showcase({giftSet}: {giftSet: GiftSet}) {
  const totalIndividual = giftSet.items.reduce(
    (sum, item) => sum + item.individualPrice,
    0,
  );
  return (
    <section className="container pt-8 lg:pt-12 pb-16 lg:pb-20">
      <nav className="text-[11px] uppercase tracking-wider text-[#2D2D2D]/45 mb-8">
        <Link to="/" className="hover:text-[#C9A96E]">
          Home
        </Link>{' '}
        / <span className="text-[#2D2D2D]/70">Gift Sets</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Image */}
        <Link
          to={`/gift-sets/${giftSet.slug}`}
          className="group relative block overflow-hidden bg-white ring-1 ring-[#C9A96E]/12 focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
        >
          <div className="aspect-[4/3]">
            <img
              src={giftSet.image}
              alt={giftSet.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          </div>
          <span className="font-sans font-semibold absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-[#C9A96E] text-[10px] tracking-[0.15em] uppercase">
            Save ${giftSet.savings}
          </span>
        </Link>

        {/* Details */}
        <div>
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3 flex items-center gap-2">
            <Star size={13} fill="currentColor" strokeWidth={0} /> The Signature
            Gift Set
          </p>
          <h1 className="font-serif font-medium text-4xl md:text-5xl text-[#2D2D2D] leading-tight mb-3">
            {giftSet.name}
          </h1>
          <p className="font-serif italic text-lg text-[#2D2D2D]/55 mb-5">
            {giftSet.tagline}
          </p>
          <p className="font-sans font-light text-base text-[#2D2D2D]/70 leading-relaxed mb-7">
            One illustration, five coordinated pieces — the complete collection,
            ready to personalize and give.
          </p>

          {/* What's inside — the pieces you build */}
          <ul className="space-y-2.5 mb-8">
            {giftSet.items.map((item) => (
              <li key={item.type} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#C9A96E]/12 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-[#C9A96E]" strokeWidth={2.5} />
                </span>
                <span className="font-sans text-sm text-[#2D2D2D]/80">
                  {item.label}
                </span>
                <span className="font-sans text-xs text-[#2D2D2D]/35 ml-auto">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline gap-3 mb-7">
            <span className="font-serif font-semibold text-3xl text-[#2D2D2D]">
              ${giftSet.setPrice}
            </span>
            <span className="font-sans font-light text-lg text-[#2D2D2D]/35 line-through">
              ${totalIndividual}
            </span>
            <span className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#C9A96E]">
              Set price · save ${giftSet.savings}
            </span>
          </div>

          <Link
            to={`/gift-sets/${giftSet.slug}`}
            className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto bg-[#2D2D2D] text-white font-sans font-medium text-sm tracking-[0.15em] uppercase px-10 py-4 hover:bg-[#C9A96E] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
          >
            Build This Gift Set
            <ArrowRight
              size={16}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
          <p className="font-sans font-light text-xs text-[#2D2D2D]/45 mt-3">
            Choose your pieces and personalize in the next step.
          </p>
        </div>
      </div>
    </section>
  );
}

function OtherDesigns({featured}: {featured: GiftSet}) {
  const others = giftSets.filter((s) => s.slug !== featured.slug);
  if (others.length === 0) return null;
  return (
    <section className="py-16 lg:py-20 bg-white border-t border-[#C9A96E]/12">
      <div className="container">
        <div className="text-center mb-10">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Prefer Another Design?
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            Build the set in any illustration
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/60 max-w-lg mx-auto mt-3">
            Same five coordinated pieces — pick the watercolor that suits them
            best.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {others.map((set) => (
            <Link
              key={set.slug}
              to={`/gift-sets/${set.slug}`}
              prefetch="intent"
              className="group block focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF8F5] ring-1 ring-[#C9A96E]/12 group-hover:ring-[#C9A96E]/50 transition-all">
                <img
                  src={set.image}
                  alt={set.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                {set.badge && (
                  <span className="font-sans font-medium absolute top-3 left-3 px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase bg-[#C9A96E] text-white">
                    {set.badge}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-medium text-base text-[#2D2D2D] mt-3 leading-tight group-hover:text-[#C9A96E] transition-colors">
                {set.name.replace(/^The /, '')}
              </h3>
              <p className="font-sans text-xs text-[#2D2D2D]/50 mt-1 flex items-center gap-1.5">
                Build the set
                <ArrowRight
                  size={12}
                  className="text-[#C9A96E] group-hover:translate-x-0.5 transition-transform"
                />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Pick Your Design',
      description:
        'Start with the Seahorse or choose any of our original watercolor illustrations — sports, coastal, pets, and more.',
    },
    {
      number: '02',
      title: 'Personalize It',
      description:
        'Add a name, monogram, or message. Every notecard in the set is personalized to make it uniquely theirs.',
    },
    {
      number: '03',
      title: 'Gift the Full Collection',
      description:
        'Five coordinated pieces — notecards, notepad, desk calendar, ceramic mug, and gift tags — packaged and ready to give.',
    },
  ];

  return (
    <section className="py-16 lg:py-22 bg-[#FAF8F5]">
      <div className="container">
        <div className="text-center mb-12 lg:mb-14">
          <div className="w-12 h-12 rounded-full border border-[#C9A96E]/30 flex items-center justify-center mx-auto mb-5">
            <Gift size={22} className="text-[#C9A96E]" strokeWidth={1.5} />
          </div>
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            How Gift Sets Work
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            Three Simple Steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <span className="font-serif text-5xl text-[#C9A96E]/15 font-bold leading-none block mb-3">
                {step.number}
              </span>
              <h3 className="font-serif font-medium text-lg text-[#2D2D2D] mb-2">
                {step.title}
              </h3>
              <p className="font-sans font-light text-sm text-[#2D2D2D]/55 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function GiftSetsRoute() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const featured = featuredSet();

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Showcase giftSet={featured} />
      <OtherDesigns featured={featured} />
      <HowItWorks />
      <Newsletter />
    </div>
  );
}
