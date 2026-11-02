/*
 * ComingSoon — elegant placeholder page for features that are switched off in
 * ~/lib/features (the Design Your Own studio, the Build Your Own gift set
 * builder). Points visitors to the collection instead.
 */
import {Link} from 'react-router';
import {ArrowRight} from 'lucide-react';

export default function ComingSoon({
  title,
  scriptWord,
  paragraphs,
}: {
  title: string;
  scriptWord: string;
  paragraphs: string[];
}) {
  return (
    <main id="main" className="bg-[#FAF8F5] text-[#2D2D2D]">
      <section className="container max-w-3xl mx-auto px-5 lg:px-8 py-20 lg:py-28 text-center">
        <p className="font-sans font-medium text-[11px] md:text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-4">
          Coming Soon
        </p>
        <h1 className="font-serif font-medium text-[2.6rem] md:text-6xl leading-[1.05] text-[#2D2D2D]">
          {title}{' '}
          <span
            style={{
              fontFamily: "'Parisian Script', 'Great Vibes', cursive",
              fontSize: '1.2em',
              lineHeight: 1,
            }}
          >
            {scriptWord}
          </span>
        </h1>
        <div aria-hidden className="flex items-center justify-center gap-3 mt-8">
          <span className="h-px w-12 bg-[#C9A96E]/60" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A96E]/70" />
          <span className="h-px w-12 bg-[#C9A96E]/60" />
        </div>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={`font-sans font-light text-base ${i === 0 ? 'md:text-lg mt-8' : 'mt-4'} leading-relaxed text-[#2D2D2D]/75 max-w-xl mx-auto`}
          >
            {p}
          </p>
        ))}
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
