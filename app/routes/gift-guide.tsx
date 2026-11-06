/**
 * The Holiday Gift Guide — /gift-guide (Sydney, Nov 2026).
 *
 * "Who are you shopping for?" circles (each opens a collection), Shop by
 * Budget (Shop All with the price filter), and Finishing Touches (gift tags).
 * Recipients and budgets live in ~/lib/gift-guide.
 */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/gift-guide';
import {RecipientCircles} from '~/components/GiftGuideTeaser';
import {BUDGETS, loadRecipients} from '~/lib/gift-guide';
import {absoluteUrl} from '~/lib/seo';

export const meta: Route.MetaFunction = () => {
  const title = 'Holiday Gift Guide | The Winsome Life';
  const description =
    'Personalized gifts for everyone on your list: teachers, hostesses, couples, dog lovers, sports fans and more. Shop by recipient or by budget.';
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: absoluteUrl('/gift-guide')},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  const recipients = await loadRecipients(context.storefront as never);
  return {recipients};
}

const script = {
  fontFamily: "'Parisian Script', 'Great Vibes', cursive",
  fontSize: '1.3em',
  lineHeight: '0.9',
  verticalAlign: '-0.05em',
  display: 'inline-block',
  padding: '0 0.08em 0 0.18em',
} as const;

export default function GiftGuide() {
  const {recipients} = useLoaderData<typeof loader>();
  return (
    <main id="main" className="bg-[#FAF8F5]">
      {/* Header */}
      <section className="bg-[#0B5D3B] text-white">
        <div className="container max-w-4xl mx-auto px-5 py-16 lg:py-20 text-center">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-white/70 mb-4">
            The Winsome Life
          </p>
          <h1 className="font-serif font-medium text-4xl md:text-6xl leading-tight">
            The Holiday <span style={script}>Gift</span> Guide
          </h1>
          <p className="font-sans font-light text-base md:text-lg text-white/80 max-w-2xl mx-auto mt-5 leading-relaxed">
            Personalized gifts they&rsquo;ll treasure, for everyone on your list.
            Pick who you&rsquo;re shopping for, or shop by budget.
          </p>
        </div>
      </section>

      {/* Who are you shopping for? */}
      <section className="py-16 lg:py-20" aria-labelledby="gg-who">
        <div className="container">
          <h2 id="gg-who" className="text-center font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-12">
            Who are you <span className="text-[#0B5D3B]" style={script}>shopping</span> for?
          </h2>
          <RecipientCircles recipients={recipients} className="max-w-4xl mx-auto" />
        </div>
      </section>

      {/* Shop by budget */}
      <section className="py-16 lg:py-20 bg-[#F3ECDD]" aria-labelledby="gg-budget">
        <div className="container max-w-5xl mx-auto">
          <h2 id="gg-budget" className="text-center font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-10">
            Shop by <span className="text-[#0B5D3B]" style={script}>Budget</span>
          </h2>
          <ul className="grid sm:grid-cols-3 gap-5">
            {BUDGETS.map((b) => (
              <li key={b.label}>
                <Link
                  to={b.href}
                  className="group block h-full text-center bg-white px-6 py-9 ring-1 ring-[#C9A96E]/25 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:ring-[#0B5D3B]/40 transition-all"
                >
                  <span className="block font-serif text-[2rem] leading-none text-[#0B5D3B]">{b.label}</span>
                  <span className="block font-sans text-sm text-[#2D2D2D]/60 mt-3">{b.note}</span>
                  <span className="inline-block mt-5 font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-[#2D2D2D] border-b border-[#2D2D2D]/40 group-hover:border-[#0B5D3B] group-hover:text-[#0B5D3B]">
                    Shop &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Finishing touches */}
      <section className="py-16 lg:py-20" aria-labelledby="gg-finish">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 id="gg-finish" className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            Finishing <span className="text-[#0B5D3B]" style={script}>Touches</span>
          </h2>
          <p className="font-sans font-light text-base text-[#2D2D2D]/70 mt-4 max-w-xl mx-auto">
            Wrap every gift with a personalized tag or sticker, and send your
            greetings on a family photo card.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/collections/christmas-holiday?type=gift-tags-stickers"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#0B5D3B] transition-colors"
            >
              Christmas Gift Tags <span aria-hidden>&rarr;</span>
            </Link>
            <Link
              to="/collections/holiday-photo-cards"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2D2D2D] ring-1 ring-[#2D2D2D]/30 font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:ring-[#0B5D3B] hover:text-[#0B5D3B] transition-colors"
            >
              Holiday Photo Cards <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
