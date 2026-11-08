/*
 * Sydney's Story — /about/sydneys-story (Sydney, Nov 2026).
 *
 * The founder's journey in her own voice, linked from "Our Founder" on the
 * About page. Written from Sydney's answers; edit the STORY sections below.
 */
import type {Route} from './+types/about_.sydneys-story';
import {Link} from 'react-router';
import {ResponsiveImg} from '~/components/ResponsiveImg';
import founderPhoto from '~/assets/home/founder-sydney.jpg';
import {absoluteUrl} from '~/lib/seo';

export const meta: Route.MetaFunction = () => {
  const title = "Sydney's Story | The Winsome Life";
  const description =
    'How a mother of three left her corporate career, stepped out in faith, and started The Winsome Life.';
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: absoluteUrl('/about/sydneys-story')},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

const STORY: Array<{heading: string; paragraphs: string[]}> = [
  {
    heading: 'A leap of faith',
    paragraphs: [
      'A few years ago, life was very full: three young children and an intense corporate career. I knew something had to change.',
      'Rooted in my faith in God, I did something that still surprises me. I left my job without knowing what was on the other side. And then, one day, an idea appeared: stationery. Beautiful, personal, made to be kept. The Winsome Life was born.',
    ],
  },
  {
    heading: 'From our home office',
    paragraphs: [
      'We started small, on Etsy, from our home office. Our artist-in-residence, Darlene Redfoot, painted a series of opening artwork that became our very first stationery designs.',
      'Our first sale came just a few days after we went live. Hundreds of five-star reviews later, every order still gets the same care as that very first one.',
    ],
  },
  {
    heading: 'A family business',
    paragraphs: [
      'My kids are learning about business and entrepreneurship by watching their mom work. I hope they will work for Winsome someday. For now, they are my moral support, and my favorite distractions (sometimes needed, sometimes not).',
    ],
  },
  {
    heading: 'What I hope you feel',
    paragraphs: [
      'When you open a Winsome note, I want you to be blown away. I want the paper to feel substantial and beautifully made in your hands.',
      'Most of all, I want you, and the people you write to, to feel connection, joy, and the feeling of being someone special.',
    ],
  },
];

const body = 'font-sans font-light text-[17px] lg:text-lg leading-relaxed text-[#2D2D2D]';
const script = {fontFamily: "'Parisian Script', 'Great Vibes', cursive"} as const;

export default function SydneysStory() {
  return (
    <main className="bg-[#FAF8F5]">
      <section className="container max-w-3xl py-14 lg:py-20 text-center">
        <nav aria-label="Breadcrumb" className="font-sans text-xs tracking-[0.15em] uppercase text-[#2D2D2D]/60 mb-8">
          <Link to="/about" className="hover:text-[#2D2D2D]">Our Story</Link>
          <span aria-hidden className="mx-2">/</span>
          <span className="text-[#2D2D2D]">Sydney&rsquo;s Story</span>
        </nav>
        <h1 className="font-serif font-medium text-4xl md:text-5xl text-[#2D2D2D] leading-tight">
          Sydney&rsquo;s{' '}
          <span className="inline-block text-[1.3em] leading-none relative top-[0.14em] ml-[0.1em]" style={script}>
            Story
          </span>
        </h1>
        <p className={`${body} italic mt-3`}>Wife, mother of three, stationery fan.</p>
        <div className="mx-auto mt-10 w-full max-w-[360px] bg-white p-3 shadow-[0_24px_50px_-22px_rgba(45,45,45,0.4)] ring-1 ring-[#2D2D2D]/5">
          <ResponsiveImg
            src={founderPhoto}
            sizes="360px"
            alt="Sydney Wilson, founder of The Winsome Life, with her daughter"
            width={1066}
            height={1333}
            className="w-full h-auto"
          />
        </div>
      </section>

      <section className="bg-white">
        <div className="container max-w-2xl py-14 lg:py-20 space-y-12">
          {STORY.map((part) => (
            <div key={part.heading}>
              <h2 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D] mb-4">{part.heading}</h2>
              <div className="space-y-4">
                {part.paragraphs.map((t) => (
                  <p key={t.slice(0, 24)} className={body}>
                    {t}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className={body}>Warmly,</p>
            <p className="mt-2 text-[2.8rem] text-[#2D2D2D] leading-tight" style={script}>
              Sydney
            </p>
          </div>
        </div>
      </section>

      <section className="container max-w-3xl py-14 text-center">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/collections/all"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#1B294E] transition-colors"
          >
            Shop the Collection <span aria-hidden>&rarr;</span>
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center px-8 py-3.5 ring-1 ring-[#2D2D2D]/40 text-[#2D2D2D] font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:ring-[#2D2D2D] transition-colors"
          >
            Back to Our Story
          </Link>
        </div>
      </section>
    </main>
  );
}
