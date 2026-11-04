/*
 * Partner store page — /partners/<handle> (e.g. /partners/ellie-bing).
 *
 * Co-branded header, the partner's curated collection with search + sort,
 * and the partner's discount code put on the cart automatically. See
 * ~/lib/partners for how partners are set up.
 */
import {data, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/partners.$handle';
import {CollectionFilters, FilteredProductGrid} from '~/components/CollectionFilters';
import {loadFilteredProducts} from '~/lib/collection-filters.server';
import {PARTNERS} from '~/lib/partners';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${data?.partner.name ?? 'Partner'} × The Winsome Life`},
  {
    name: 'description',
    content: `Personalized stationery from The Winsome Life, curated for ${data?.partner.name ?? 'our partner'}.`,
  },
  // Unlisted: partners share the link with their own customers.
  {name: 'robots', content: 'noindex'},
];

export async function loader({context, params, request}: Route.LoaderArgs) {
  const partner = params.handle ? PARTNERS[params.handle] : undefined;
  if (!partner) throw new Response(null, {status: 404});

  const products = await loadFilteredProducts(
    context.storefront as never,
    request,
    partner.collection,
  );

  // Put the partner's code on the cart (keeping any others) so it's applied
  // at checkout. Only on a normal page view, not on every filter change.
  let headers: Headers | undefined;
  if (partner.discountCode) {
    const cart = await context.cart.get();
    const codes = (cart?.discountCodes ?? []).map((d) => d.code);
    const has = codes.some(
      (c) => c.toUpperCase() === partner.discountCode.toUpperCase(),
    );
    if (!has) {
      const result = await context.cart.updateDiscountCodes([
        ...codes,
        partner.discountCode,
      ]);
      if (result.cart?.id) headers = context.cart.setCartId(result.cart.id);
    }
  }

  return data({partner, ...products}, headers ? {headers} : undefined);
}

export default function PartnerPage() {
  const {partner, cards, facets, sort, q} = useLoaderData<typeof loader>();
  const {colors} = partner;

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      {/* Co-branded header in the partner's colors */}
      <section
        className="border-b border-[#111111]/10"
        style={{background: colors.background, color: colors.text}}
      >
        <div className="container max-w-5xl mx-auto px-5 lg:px-8 py-12 lg:py-16 text-center">
          <p className="font-sans font-medium text-[11px] tracking-[0.3em] uppercase opacity-70">
            The Winsome Life <span aria-hidden>×</span>
            <span className="sr-only">and</span> {partner.name}
          </p>
          <h1 className="mt-5 flex flex-col items-center gap-3">
            {partner.logo ? (
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-24 md:h-32 w-auto max-w-full object-contain"
              />
            ) : (
              <span className="font-serif font-medium text-4xl md:text-6xl leading-none tracking-wide">
                {partner.name}
              </span>
            )}
            <span
              className="text-[1.9rem] md:text-[2.4rem] leading-none"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                color: colors.accent,
              }}
            >
              Personalized Stationery
            </span>
          </h1>
          <p className="mt-5 max-w-xl mx-auto font-sans font-light text-[15px] md:text-base leading-relaxed opacity-85">
            {partner.intro}
          </p>
          {partner.discountCode && (
            <p
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 border font-sans text-[13px] tracking-wide"
              style={{borderColor: colors.accent}}
            >
              <span aria-hidden style={{color: colors.accent}}>✦</span>
              {partner.discountPercent
                ? `Your exclusive ${partner.discountPercent}% ${partner.name} discount`
                : `Your exclusive ${partner.name} discount`}{' '}
              is applied automatically at checkout
            </p>
          )}
        </div>
      </section>

      <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-10">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-6">
          <h2 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D]">
            The {partner.name} Collection
          </h2>
          <p className="font-sans text-sm text-[#2D2D2D]/45">
            {cards.length} {cards.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        <CollectionFilters
          facets={facets}
          sort={sort}
          resultCount={cards.length}
          q={q}
          searchPlaceholder={`Search the ${partner.name} collection`}
        />
        <FilteredProductGrid cards={cards} />
        <p className="mt-16 text-center font-sans font-light text-[13px] text-[#2D2D2D]/55">
          Every piece is personalized and made to order by{' '}
          <Link to="/" className="underline decoration-[#C9A96E] underline-offset-2 hover:text-[#C9A96E]">
            The Winsome Life
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
