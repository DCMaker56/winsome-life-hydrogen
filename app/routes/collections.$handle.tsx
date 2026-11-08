/**
 * Collection page — Hydrogen + Winsome brand UI.
 *
 * Hero image + scrollable product sampler on top, full filterable grid below.
 */
import {useLoaderData, useSearchParams, Link} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {Analytics} from '@shopify/hydrogen';
import {CollectionFilters, FilteredProductGrid} from '~/components/CollectionFilters';
import {loadFilteredProducts} from '~/lib/collection-filters.server';
import {
  GROUPED_PAGES,
  MIN_TO_GROUP,
  PRODUCT_TYPE_SECTION_ORDER,
  PRODUCT_TYPE_SECTION_RULES,
  groupIntoSections,
  type Section,
} from '~/lib/collection-sections';
import {JsonLd} from '~/components/JsonLd';
import {isPartnerCollection} from '~/lib/partners';
import {PRODUCT_TYPE_COLLECTIONS} from '~/lib/collection-filters';
import {SectionJumpNav, SectionList} from '~/components/CollectionSections';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) => {
  const title = `${data?.collection?.title ?? 'Collection'} | The Winsome Life`;
  const description =
    data?.collection?.description ||
    `Shop ${data?.collection?.title ?? 'our'} — personalized luxury stationery from The Winsome Life.`;
  return [
    {title},
    {name: 'description', content: description},
    {
      tagName: 'link',
      rel: 'canonical',
      href: absoluteUrl(`/collections/${data?.collection?.handle}`),
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
  ];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  // Partner-only collections (partner-…) are private to their partner page.
  if (!handle || isPartnerCollection(handle)) throw new Response(null, {status: 404});

  const [{collection}, filtered] = await Promise.all([
    context.storefront.query(COLLECTION_QUERY, {
      variables: {handle, first: 1},
    }),
    loadFilteredProducts(context.storefront as never, request, handle, {
      withCollections: true,
    }),
  ]);
  if (!collection) throw new Response(null, {status: 404});

  // Product-type pages (Notecards, Notepads, …) group their products under
  // collection headings: Monograms, Floral, Sports, … (Sydney).
  const {collectionsById, ...rest} = filtered;
  let sections: Section[] | null = null;
  if (GROUPED_PAGES.has(handle) && rest.total >= MIN_TO_GROUP) {
    sections = groupIntoSections(rest.cards, collectionsById, {
      order: PRODUCT_TYPE_SECTION_ORDER,
      rules: PRODUCT_TYPE_SECTION_RULES,
    });
    if (sections.length < 2) sections = null;
  }

  // Theme and season pages (Floral, Sports, Fall, …): grouped by product
  // type, with a heading for each (Notecards, Notepads, Gift Tags, …) and
  // a "Jump to" row (Sydney, Nov 2026).
  if (!sections && !PRODUCT_TYPE_COLLECTIONS.includes(handle)) {
    const byType = groupIntoSections(rest.cards, collectionsById, {
      order: PRODUCT_TYPE_COLLECTIONS,
      moreTitle: 'More Designs',
    });
    if (byType.length >= 2) sections = byType;
  }
  return {collection, ...rest, sections};
}

export default function CollectionRoute() {
  const {collection, cards, facets, sort, q, sections, total} =
    useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  // Product-type choices with counts (from the Product Type filter), shown
  // as tabs on theme/season pages — they stay visible after one is chosen.
  const typeFacet = facets.find((f) => f.key === 'type');
  const typeChoices =
    !sections && typeFacet && typeFacet.options.length >= 2 ? typeFacet.options : null;
  const anyTypeSelected = !!typeChoices?.some((o) => o.selected);
  const allCount = total;
  const typeHref = (h: string | null) => {
    const next = new URLSearchParams(params);
    if (h) next.set('type', h);
    else next.delete('type');
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
  };
  const count = cards.length;

  const listProducts = cards.slice(0, 24).map((p) => ({
    slug: p.slug,
    title: p.title,
    image: p.image ?? undefined,
    price: p.price || undefined,
  }));

  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            {name: 'Home', path: '/'},
            {name: 'Collections', path: '/collections/all'},
            {name: collection.title},
          ]),
          itemListJsonLd(listProducts, `/collections/${collection.handle}`),
        ]}
      />
      {/* Compact header — breadcrumb, then title · count on one baseline */}
      <section className="container max-w-7xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-[#2D2D2D]/45 mb-4">
          <Link to="/" className="hover:text-[#C9A96E]">
            Home
          </Link>{' '}
          /{' '}
          <Link to="/collections/all" className="hover:text-[#C9A96E]">
            Collections
          </Link>{' '}
          / <span className="text-[#2D2D2D]/70" aria-current="page">{collection.title}</span>
        </nav>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[#C9A96E]/15 pb-5 mb-8">
          <h1 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] leading-none">
            {collection.title.replace(/ Collection$/i, '')}
          </h1>
          <p className="font-sans text-sm text-[#2D2D2D]/45">
            {count} {count === 1 ? 'piece' : 'pieces'}
          </p>
          {collection.description && (
            <p className="font-sans font-light text-sm text-[#2D2D2D]/60 leading-relaxed w-full max-w-2xl mt-1">
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Filters + product grid */}
      <section className="container max-w-7xl mx-auto px-4 lg:px-8">
        <CollectionFilters
          facets={facets}
          sort={sort}
          resultCount={count}
          q={q}
          searchPlaceholder={`Search ${collection.title.replace(/ Collection$/i, '').toLowerCase()}`}
        />
        {sections ? (
          <>
            <SectionJumpNav sections={sections} />
            <SectionList sections={sections} />
          </>
        ) : typeChoices ? (
          <>
            {/* Product-type tabs: "All" plus each type with its count. The
                chosen one is filled dark; tap again (or All) to show all. */}
            <nav aria-label="Filter by product type" className="mb-8 -mt-2">
              <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-[#2D2D2D]/60 mb-3">
                Tap a product type to filter
              </p>
              <ul className="flex flex-wrap gap-2">
                {[{value: '', label: 'All', count: allCount, selected: !anyTypeSelected}, ...(typeChoices ?? [])].map(
                  (t) => (
                    <li key={t.value || 'all'}>
                      <Link
                        to={typeHref(t.value && !t.selected ? t.value : null)}
                        preventScrollReset
                        aria-current={t.selected ? 'true' : undefined}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-sans font-medium text-[13.5px] shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow ${
                          t.selected
                            ? 'bg-[#2D2D2D] text-white ring-1 ring-[#2D2D2D]'
                            : 'bg-white text-[#2D2D2D] ring-1 ring-[#2D2D2D]/20 hover:ring-[#2D2D2D]/50'
                        }`}
                      >
                        {t.label}
                        <span
                          className={`min-w-[1.4rem] px-1.5 rounded-full text-[11px] leading-5 text-center ${
                            t.selected ? 'bg-white/20 text-white' : 'bg-[#2D2D2D]/[0.07] text-[#2D2D2D]/70'
                          }`}
                        >
                          {t.count}
                        </span>
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
            <FilteredProductGrid cards={cards} />
          </>
        ) : (
          <FilteredProductGrid cards={cards} />
        )}
      </section>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </main>
  );
}

const PRODUCT_FRAGMENT = `#graphql
  fragment ProductItem on Product {
    id
    handle
    title
    descriptionHtml
    productType
    tags
    featuredImage { url altText }
    images(first: 3) { nodes { url } }
    variants(first: 3) {
      nodes {
        price { amount }
        compareAtPrice { amount }
        availableForSale
      }
    }
  }
` as const;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
      ) {
        nodes { ...ProductItem }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
` as const;
