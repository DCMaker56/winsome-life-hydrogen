/*
 * Partner store page — /partners/<handle> (e.g. /partners/ellie-bing).
 *
 * Co-branded header, the partner's curated collection with search + sort,
 * and the partner's discount code put on the cart automatically. See
 * ~/lib/partners for how partners are set up.
 */
import {data, useLoaderData, useSearchParams, Link} from 'react-router';
import type {Route} from './+types/partners.$handle';
import {CollectionFilters, FilteredProductGrid} from '~/components/CollectionFilters';
import {loadFilteredProducts} from '~/lib/collection-filters.server';
import {
  PARTNERS,
  PARTNER_PLACEMENTS,
  PARTNER_SECTION_ORDER,
  PARTNER_SECTION_RULES,
  PARTNER_SECTION_TITLES,
} from '~/lib/partners';
import {groupIntoSections} from '~/lib/collection-sections';
import {absoluteUrl} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) => {
  const name = data?.partner.name ?? 'Partner';
  const title = `${name} × The Winsome Life`;
  const description = data?.partner.collection
    ? `A curated collection of personalized stationery from The Winsome Life, chosen especially for ${name} customers.`
    : `Personalized stationery from The Winsome Life, especially for ${name} customers.`;
  const image = data?.partner.shareImage;
  return [
    {title},
    {name: 'description', content: description},
    // Unlisted: partners share the link with their own customers.
    {name: 'robots', content: 'noindex'},
    // Link preview when texted / shared: the partner's header picture.
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: absoluteUrl(`/partners/${data?.partner.handle ?? ''}`)},
    ...(image
      ? [
          {property: 'og:image', content: absoluteUrl(image)},
          {property: 'og:image:width', content: '1200'},
          {property: 'og:image:height', content: '630'},
          {property: 'og:image:alt', content: `The Winsome Life × ${name} — Personalized Stationery, a curated collection`},
          {name: 'twitter:card', content: 'summary_large_image'},
          {name: 'twitter:image', content: absoluteUrl(image)},
        ]
      : []),
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const partner = params.handle ? PARTNERS[params.handle] : undefined;
  if (!partner) throw new Response(null, {status: 404});

  const products = await loadFilteredProducts(
    context.storefront as never,
    request,
    partner.collection ?? undefined,
    {withCollections: true},
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

  // Group the (searched / filtered / sorted) results under collection headings.
  const {collectionsById, ...rest} = products;
  const sections = groupIntoSections(rest.cards, collectionsById, {
    order: PARTNER_SECTION_ORDER,
    titles: PARTNER_SECTION_TITLES,
    rules: PARTNER_SECTION_RULES,
    placements: PARTNER_PLACEMENTS,
    moreTitle: 'More Favorites',
  });

  // Customer view (?view=customer): no prices or discount, for browsing with
  // customers. Store view (default) shows prices and the partner discount.
  const customerView =
    !!partner.viewToggle && new URL(request.url).searchParams.get('view') === 'customer';

  return data({partner, ...rest, sections, customerView}, headers ? {headers} : undefined);
}

export default function PartnerPage() {
  const {partner, cards, facets, sort, q, sections, customerView} =
    useLoaderData<typeof loader>();
  const {colors} = partner;

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      {/* Co-branded header in the partner's colors */}
      <section
        className="border-b border-[#111111]/10"
        style={{background: colors.background, color: colors.text}}
      >
        <div className="container max-w-5xl mx-auto px-5 lg:px-8 py-12 lg:py-16 text-center">
          <p className="font-sans font-medium text-[13px] md:text-sm tracking-[0.25em] uppercase opacity-80">
            The Winsome Life <span aria-hidden>×</span>
            <span className="sr-only">and</span> {partner.name}
          </p>
          {partner.photo && (
            <div className="mt-6 mx-auto w-56 md:w-64 bg-white p-2 shadow-[0_14px_30px_-14px_rgba(0,0,0,0.35)]">
              <img
                src={partner.photo}
                alt={`${partner.name} storefront`}
                className="w-full aspect-[360/292] object-cover"
              />
            </div>
          )}
          <h1 className="mt-5 flex flex-col items-center gap-3">
            {partner.logo ? (
              <img
                src={partner.logo}
                alt={partner.name}
                className={`h-24 md:h-32 w-auto max-w-full object-contain ${
                  partner.logoRound ? 'rounded-full ring-4 ring-white/85 shadow-md' : ''
                }`}
              />
            ) : (
              <span className="font-serif font-medium text-4xl md:text-6xl leading-none tracking-wide">
                {partner.name}
              </span>
            )}
            <span
              className="text-[2.3rem] md:text-[3rem] leading-none"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                color: colors.text,
              }}
            >
              Personalized Stationery
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto font-sans text-[17px] md:text-[19px] leading-relaxed opacity-90">
            {partner.intro}
          </p>
          {partner.discountCode && !customerView && (
            <p
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 border font-sans font-medium text-[15px] md:text-base tracking-wide"
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
        {partner.viewToggle && <ViewToggle customerView={customerView} />}
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
        {cards.length === 0 ? (
          <FilteredProductGrid cards={cards} hidePrices={customerView} />
        ) : (
          <div className="space-y-14">
            {sections.map((s) => (
              <section key={s.handle} aria-labelledby={`sec-${s.handle}`}>
                <div className="flex items-baseline gap-3 mb-5 pb-3 border-b border-[#2D2D2D]/10">
                  <h3
                    id={`sec-${s.handle}`}
                    className="font-serif font-medium text-2xl md:text-[1.75rem] text-[#2D2D2D]"
                  >
                    {s.title}
                  </h3>
                  <span className="font-sans text-xs text-[#2D2D2D]/45">
                    {s.cards.length}
                  </span>
                </div>
                <FilteredProductGrid
                  cards={s.cards}
                  hideEnd
                  discountPercent={partner.discountPercent}
                  hidePrices={customerView}
                />
              </section>
            ))}
          </div>
        )}
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

/** Customer view (no prices) ↔ Store view (prices and discount). */
function ViewToggle({customerView}: {customerView: boolean}) {
  const [params] = useSearchParams();
  const href = (customer: boolean) => {
    const next = new URLSearchParams(params);
    if (customer) next.set('view', 'customer');
    else next.delete('view');
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
  };
  const option = (customer: boolean, label: string) => {
    const active = customer === customerView;
    return (
      <Link
        to={href(customer)}
        replace
        preventScrollReset
        aria-current={active ? 'true' : undefined}
        className={`px-4 py-2 rounded-full font-sans text-[13px] tracking-wide transition-colors ${
          active ? 'bg-[#2D2D2D] text-white' : 'text-[#2D2D2D]/70 hover:text-[#2D2D2D]'
        }`}
      >
        {label}
      </Link>
    );
  };
  return (
    <div className="flex justify-center sm:justify-end mb-6">
      <div
        role="group"
        aria-label="Page view"
        className="inline-flex p-1 rounded-full bg-white ring-1 ring-[#2D2D2D]/15"
      >
        {option(true, 'Customer view')}
        {option(false, 'Store view')}
      </div>
    </div>
  );
}
