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

  // Theme and season pages (Floral, Sports, Fall, …): one full grid in
  // product-type order, each product labeled with its type, plus a row of
  // product-type buttons with counts. Separate headings left small types
  // with one or two products and lots of empty space (Sydney, Nov 2026).
  let typeView: {
    cards: typeof rest.cards;
    labels: Record<string, string>;
    types: Array<{handle: string; title: string; count: number}>;
  } | null = null;
  if (!sections && !PRODUCT_TYPE_COLLECTIONS.includes(handle) && rest.total >= 6) {
    const byType = groupIntoSections(rest.cards, collectionsById, {
      order: PRODUCT_TYPE_COLLECTIONS,
      moreTitle: 'More Designs',
    });
    if (byType.length >= 2) {
      const labels: Record<string, string> = {};
      for (const t of byType) for (const c of t.cards) if (t.handle !== 'more') labels[c.id] = t.title;
      typeView = {
        cards: byType.flatMap((t) => t.cards),
        labels,
        types: byType
          .filter((t) => t.handle !== 'more')
          .map((t) => ({handle: t.handle, title: t.title, count: t.cards.length})),
      };
    }
  }
  return {collection, ...rest, sections, typeView};
}

export default function CollectionRoute() {
  const {collection, cards, facets, sort, q, sections, typeView} = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
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
        ) : typeView ? (
          <>
            {/* Product types in this collection, with counts — shows at a
                glance how much there is; one tap narrows to that type. */}
            <nav aria-label="Product types in this collection" className="mb-8 -mt-2">
              <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-[#2D2D2D]/55 mb-2.5">
                {typeView.cards.length} pieces in {typeView.types.length} product types
              </p>
              <ul className="flex flex-wrap gap-2">
                {typeView.types.map((t) => (
                  <li key={t.handle}>
                    <Link
                      to={typeHref(t.handle)}
                      preventScrollReset
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#C9A96E]/40 bg-white font-sans text-[13px] text-[#2D2D2D] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors"
                    >
                      {t.title}
                      <span className="text-[11px] text-[#2D2D2D]/45">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <FilteredProductGrid cards={typeView.cards} labels={typeView.labels} />
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
