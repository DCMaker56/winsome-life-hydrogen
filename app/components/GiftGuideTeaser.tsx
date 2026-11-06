/*
 * Home page Holiday Gift Guide teaser (replaces "Shop by Interest", Sydney,
 * Nov 2026): "Who are you shopping for?" circles in deep holiday green, each
 * opening that collection, plus a button to the full guide (/gift-guide).
 */
import {Link} from 'react-router';

export type RecipientTile = {label: string; href: string; image: string | null};

const script = {
  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
  fontSize: '1.3em',
  lineHeight: '0.9',
  verticalAlign: '-0.05em',
  display: 'inline-block',
  padding: '0 0.08em 0 0.18em',
} as const;

export function RecipientCircles({
  recipients,
  className = '',
  dark = false,
}: {
  recipients: RecipientTile[];
  className?: string;
  /** White labels for a dark background. */
  dark?: boolean;
}) {
  return (
    <ul className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-9 ${className}`}>
      {recipients.map((r) => (
        <li key={r.label}>
          <Link to={r.href} prefetch="intent" className="group flex flex-col items-center text-center focus-visible:outline-none">
            <span
              className={`relative w-28 h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-[#FAF8F5] shadow-sm transition-all duration-300 ${
                dark ? 'ring-2 ring-white/70 group-hover:ring-white' : 'ring-1 ring-[#C9A96E]/30 group-hover:ring-2 group-hover:ring-[#C9A96E]'
              }`}
            >
              {r.image && (
                <img
                  src={r.image}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
              )}
            </span>
            <span
              className={`mt-3 font-serif text-[1.15rem] lg:text-[1.25rem] leading-tight ${
                dark ? 'text-white' : 'text-[#2D2D2D] group-hover:text-[#C9A96E]'
              }`}
            >
              {r.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function GiftGuideTeaser({recipients}: {recipients: RecipientTile[]}) {
  if (!recipients?.length) return null;
  return (
    <section className="py-20 lg:py-24 bg-[#0B5D3B]" aria-label="Holiday gift guide">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-white/70 mb-3">
            The Holiday Gift Guide
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-[2.6rem] text-white">
            Who are you{' '}
            <span style={script}>shopping</span> for?
          </h2>
          <p className="font-sans font-light text-base text-white/75 max-w-xl mx-auto mt-4">
            Personalized gifts for everyone on your list, from teachers and
            hostesses to dog lovers and sports fans.
          </p>
        </div>
        <RecipientCircles recipients={recipients.slice(0, 8)} dark className="max-w-4xl mx-auto" />
        <div className="text-center mt-12">
          <Link
            to="/gift-guide"
            className="inline-flex items-center gap-2 px-9 py-3.5 bg-white text-[#2D2D2D] font-sans font-medium text-[12px] tracking-[0.18em] uppercase hover:bg-[#FAF8F5] transition-colors"
          >
            See the Full Gift Guide <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
