/*
 * Product Builder — landing / product picker.
 *
 * The separate "design your own" experience (distinct from the classic
 * existing-product PDPs). The customer picks a product here, then the
 * full-screen editor at /studio/<format> lets them choose an illustration and
 * personalize it with a live preview. Each card shows a real StudioCanvas
 * preview of the default design so they see exactly what they'll be making.
 */
import type {Route} from './+types/studio._index';
import {Link} from 'react-router';
import {STUDIO_OPEN} from '~/lib/features';
import {ArrowRight, Sparkles, Palette, Type, Package} from 'lucide-react';
import {
  STUDIO_FORMATS,
  defaultStudioConfig,
  type StudioFormatKey,
} from '~/lib/studio';
import {StudioCanvas} from '~/components/studio/StudioCanvas';

export const meta: Route.MetaFunction = () =>
  STUDIO_OPEN
    ? [
        {title: 'Design Your Own | The Winsome Life Product Builder'},
        {
          name: 'description',
          content:
            'Design your own personalized stationery from scratch — pick a product, choose an illustration, and make it yours with a live preview.',
        },
      ]
    : [
        {title: 'Design Your Own: Coming Soon | The Winsome Life'},
        {
          name: 'description',
          content:
            'Coming soon: design your own personalized stationery from scratch with The Winsome Life.',
        },
        {name: 'robots', content: 'noindex'},
      ];

// Order shown in the picker — lead with the core writing pieces.
const ORDER: StudioFormatKey[] = [
  'notecard',
  'notepad',
  'gift-tag',
  'wine-tag',
  'place-card',
];

const STEPS = [
  {icon: Package, title: 'Pick your product', copy: 'Notecards, notepads, gift tags, and more.'},
  {icon: Palette, title: 'Choose an illustration', copy: 'Search hundreds of designs across every interest.'},
  {icon: Type, title: 'Make it yours', copy: 'Add a name, pick a font and ink — see it live.'},
];

export default function StudioIndexRoute() {
  return STUDIO_OPEN ? <ProductBuilderIndex /> : <StudioComingSoon />;
}

/** Shown at /studio while the Product Builder is closed (see ~/lib/features). */
function StudioComingSoon() {
  return (
    <main id="main" className="bg-[#FAF8F5] text-[#2D2D2D]">
      <section className="container max-w-3xl mx-auto px-5 lg:px-8 py-20 lg:py-28 text-center">
        <p className="font-sans font-medium text-[11px] md:text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
          Coming Soon
        </p>
        <h1 className="font-serif font-medium text-[2.6rem] md:text-6xl leading-[1.05] text-[#2D2D2D]">
          Design Your{' '}
          <span
            style={{
              fontFamily: "'Parisian Script', 'Great Vibes', cursive",
              fontSize: '1.2em',
              lineHeight: 1,
            }}
          >
            Own
          </span>
        </h1>
        <div aria-hidden className="flex items-center justify-center gap-3 mt-8">
          <span className="h-px w-12 bg-[#C9A96E]/60" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A96E]/70" />
          <span className="h-px w-12 bg-[#C9A96E]/60" />
        </div>
        <p className="font-sans font-light text-base md:text-lg leading-relaxed text-[#2D2D2D]/75 mt-8 max-w-xl mx-auto">
          We&rsquo;re putting the finishing touches on something special: a
          way to design your own personalized stationery from scratch. Soon
          you&rsquo;ll be able to choose a piece, pick an illustration and make
          it entirely yours.
        </p>
        <p className="font-sans font-light text-base leading-relaxed text-[#2D2D2D]/75 mt-4 max-w-xl mx-auto">
          In the meantime, every piece in our collection can be personalized
          with your name, monogram, font and ink color.
        </p>
        <Link
          to="/collections/all"
          className="mt-10 inline-flex items-center gap-2 bg-[#2D2D2D] text-white font-sans font-medium text-sm tracking-[0.15em] uppercase px-9 py-4 hover:bg-[#C9A96E] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
        >
          Shop Personalized Stationery
          <ArrowRight size={15} strokeWidth={1.75} />
        </Link>
      </section>
    </main>
  );
}

function ProductBuilderIndex() {
  const formats = ORDER.filter((k) => STUDIO_FORMATS[k]).map(
    (k) => STUDIO_FORMATS[k],
  );

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#C9A96E]/15">
        <div className="container max-w-6xl mx-auto px-4 lg:px-8 py-16 lg:py-20 text-center">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4 flex items-center justify-center gap-2">
            <Sparkles size={14} /> The Product Builder
          </p>
          <h1 className="font-serif font-medium text-4xl md:text-5xl lg:text-6xl text-[#2D2D2D] leading-[1.05] mb-4">
            Design{' '}
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                fontSize: '1.25em',
                lineHeight: '0.9',
                verticalAlign: '-0.06em',
              }}
            >
              your own
            </span>
          </h1>
          <p className="font-sans font-light text-base md:text-lg text-[#2D2D2D]/65 max-w-xl mx-auto">
            Start from a blank piece and make it entirely yours — choose any
            illustration, add your name, and watch it come together with a live
            preview.
          </p>

          {/* How it works */}
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-10 max-w-3xl mx-auto mt-12">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="w-12 h-12 rounded-full border border-[#C9A96E]/30 flex items-center justify-center mx-auto mb-3 relative">
                  <s.icon size={20} className="text-[#C9A96E]" strokeWidth={1.5} />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#2D2D2D] text-white text-[10px] font-sans font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-serif font-medium text-base text-[#2D2D2D] mb-1">
                  {s.title}
                </h3>
                <p className="font-sans font-light text-[13px] text-[#2D2D2D]/55 leading-relaxed">
                  {s.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product picker */}
      <section className="container max-w-6xl mx-auto px-4 lg:px-8 py-14 lg:py-18">
        <div className="text-center mb-10">
          <h2 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D]">
            What would you like to make?
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
          {formats.map((format) => (
            <Link
              key={format.key}
              to={`/studio/${format.key}`}
              prefetch="intent"
              className="group flex flex-col bg-white ring-1 ring-[#C9A96E]/15 hover:ring-[#C9A96E] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] overflow-hidden"
            >
              <div className="flex items-center justify-center p-6 lg:p-8 bg-gradient-to-b from-[#FAF8F5] to-[#F1ECE3] aspect-[4/3]">
                <StudioCanvas
                  format={format}
                  config={defaultStudioConfig(format)}
                  flat
                  className="max-h-full max-w-full drop-shadow-sm transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 border-t border-[#C9A96E]/12 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-medium text-lg text-[#2D2D2D] leading-tight group-hover:text-[#C9A96E] transition-colors">
                    {format.label}
                  </h3>
                  <p className="font-sans font-light text-[12px] text-[#2D2D2D]/50 mt-0.5">
                    {format.sizeNote}
                  </p>
                </div>
                <span className="shrink-0 w-9 h-9 rounded-full bg-[#FAF8F5] ring-1 ring-[#C9A96E]/20 flex items-center justify-center text-[#C9A96E] group-hover:bg-[#C9A96E] group-hover:text-white transition-colors">
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Reassurance / second track */}
        <div className="text-center mt-14">
          <p className="font-sans font-light text-sm text-[#2D2D2D]/55">
            Prefer to shop our ready-made designs?{' '}
            <Link
              to="/collections/all"
              className="font-medium text-[#C9A96E] hover:text-[#2D2D2D] border-b border-[#C9A96E]/40 hover:border-[#2D2D2D] transition-colors"
            >
              Browse all products
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
