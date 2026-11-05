/*
 * Printable partner catalog — /partners/<handle>/catalog (see ~/lib/catalog).
 *
 * Letter pages: cover, contents, products 4 per page (product type, then
 * collection), then personalization options. Chrome → Print → Save as PDF.
 * ?pick=1 shows the candidate photos for each options page, numbered, so
 * Sydney can choose which to use.
 */
import {useLoaderData} from 'react-router';
import type {Route} from './+types/partners.$handle_.catalog';
import {PARTNERS} from '~/lib/partners';
import {loadFilteredProducts} from '~/lib/collection-filters.server';
import type {CardData} from '~/lib/collection-filters.server';
import {groupByTypeThenCollection} from '~/lib/collection-sections';
import {
  CATALOG_OPTION_PAGES,
  CATALOG_PER_PAGE,
  printImage,
  shortTitle,
} from '~/lib/catalog';

/** Print without the website header and footer (see root.tsx). */
export const handle = {bare: true};

export const meta: Route.MetaFunction = ({data}) => [
  {title: `${data?.partner.name ?? 'Partner'} × The Winsome Life — Catalog`},
  {name: 'robots', content: 'noindex'},
];

const MEDIA_QUERY = `
  query CatalogMedia($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        media(first: 40) {
          nodes {
            ... on MediaImage { image { url altText } }
          }
        }
      }
    }
  }
`;

type MediaProduct = {
  id: string;
  title: string;
  media: {nodes: Array<{image?: {url: string; altText: string | null}}>};
};

type Item = {card: CardData; collection: string};
type Page =
  | {kind: 'cover'}
  | {kind: 'toc'; entries: TocEntry[]}
  | {kind: 'products'; type: string; items: Item[]}
  | {kind: 'option'; title: string; note?: string; image: string | null};

type TocEntry = {title: string; page: number; level: 1 | 2};

/**
 * Splits contents lines into pages by their printed height (points): a
 * product-type line with its gap above is taller than a collection line.
 */
const TOC_PAGE_HEIGHT = 600;
function splitToc(entries: TocEntry[]) {
  const pages: TocEntry[][] = [[]];
  let used = 0;
  for (const e of entries) {
    const h = e.level === 1 ? 30 : 17.5;
    if (used + h > TOC_PAGE_HEIGHT && pages[pages.length - 1].length) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(e);
    used += h;
  }
  return pages;
}

export async function loader({context, params, request}: Route.LoaderArgs) {
  const partner = params.handle ? PARTNERS[params.handle] : undefined;
  if (!partner) throw new Response(null, {status: 404});
  const pick = new URL(request.url).searchParams.get('pick') === '1';

  const [{cards, collectionsById}, media] = await Promise.all([
    loadFilteredProducts(
      context.storefront as never,
      new Request(new URL(`/partners/${partner.handle}`, request.url)),
      partner.collection,
      {withCollections: true},
    ),
    context.storefront.query<{nodes: Array<MediaProduct | null>}>(MEDIA_QUERY, {
      variables: {ids: [...new Set(CATALOG_OPTION_PAGES.flatMap((o) => o.candidates))]},
    }),
  ]);
  const mediaById = new Map(
    media.nodes.filter((n): n is MediaProduct => !!n?.id).map((n) => [n.id, n]),
  );

  // Picker: every candidate photo, numbered per option.
  if (pick) {
    const options = CATALOG_OPTION_PAGES.map((o) => ({
      key: o.key,
      title: o.title,
      photos: o.candidates.flatMap((id) => {
        const p = mediaById.get(id);
        return (p?.media.nodes ?? [])
          .filter((m) => m.image)
          .map((m) => ({product: shortTitle(p!.title), url: m.image!.url, alt: m.image!.altText ?? ''}));
      }),
    }));
    return {partner, pick: true as const, options, pages: [] as Page[]};
  }

  // Product pages: each product type starts a new page; within it, products
  // run in collection order, 4 per page, each labeled with its collection.
  const groups = groupByTypeThenCollection(cards, collectionsById);
  const productPages: Array<{type: string; items: Item[]; collections: string[]}> = [];
  for (const g of groups) {
    const items: Item[] = (g.subsections ?? [{handle: g.handle, title: '', cards: g.cards}]).flatMap(
      (s) => s.cards.map((card) => ({card, collection: s.title})),
    );
    for (let i = 0; i < items.length; i += CATALOG_PER_PAGE) {
      const chunk = items.slice(i, i + CATALOG_PER_PAGE);
      productPages.push({
        type: g.title,
        items: chunk,
        collections: [...new Set(chunk.map((c) => c.collection))],
      });
    }
  }

  // One page per chosen photo; options without a photo yet are left out.
  const options: Array<{title: string; note?: string; image: string; first: boolean}> = [];
  for (const o of CATALOG_OPTION_PAGES) {
    let images = o.images ?? [];
    if (!images.length && o.fromAlt) {
      const p = mediaById.get(o.fromAlt.product);
      const found = p?.media.nodes.find((m) => m.image && o.fromAlt!.alt.test(m.image.altText ?? ''));
      images = found?.image ? [found.image.url] : [];
    }
    images.forEach((image, i) =>
      options.push({
        title: images.length > 1 ? `${o.title} (${i + 1} of ${images.length})` : o.title,
        note: o.note,
        image,
        first: i === 0,
      }),
    );
  }

  // Contents: product types, their collections, then options. Page numbers
  // depend on how many contents pages there are, so settle that first.
  const buildEntries = (tocPages: number) => {
    const firstProductPage = 2 + tocPages;
    const entries: TocEntry[] = [];
    let seen = new Set<string>();
    productPages.forEach((p, i) => {
      const page = firstProductPage + i;
      if (i === 0 || productPages[i - 1].type !== p.type) {
        entries.push({title: p.type, page, level: 1});
        seen = new Set();
      }
      for (const c of p.collections) {
        if (c && !seen.has(c)) {
          seen.add(c);
          entries.push({title: c, page, level: 2});
        }
      }
    });
    const firstOptionPage = firstProductPage + productPages.length;
    entries.push({title: 'Personalization Options', page: firstOptionPage, level: 1});
    options.forEach((o, i) => {
      if (o.first)
        entries.push({
          title: o.title.replace(/ \(1 of \d+\)$/, ''),
          page: firstOptionPage + i,
          level: 2,
        });
    });
    return entries;
  };
  let tocPages = 1;
  let toc = splitToc(buildEntries(tocPages));
  while (toc.length !== tocPages) {
    tocPages = toc.length;
    toc = splitToc(buildEntries(tocPages));
  }

  const pages: Page[] = [
    {kind: 'cover'},
    ...toc.map((entries) => ({kind: 'toc' as const, entries})),
    ...productPages.map((p) => ({kind: 'products' as const, type: p.type, items: p.items})),
    ...options.map((o) => ({kind: 'option' as const, title: o.title, note: o.note, image: o.image})),
  ];
  return {partner, pick: false as const, options: [], pages};
}

const SCRIPT = "'Parisian Script', 'Great Vibes', cursive";

export default function PartnerCatalog() {
  const data = useLoaderData<typeof loader>();
  const {partner} = data;

  if (data.pick) return <Picker data={data} />;

  return (
    <div className="catalog">
      <style>{CATALOG_CSS}</style>
      <div className="catalog-toolbar">
        <p>
          <strong>{partner.name} catalog</strong> · {data.pages.length} pages · Letter size (8.5 × 11 in)
        </p>
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
      {data.pages.map((page, i) => (
        <section key={i} className="catalog-page">
          {page.kind === 'cover' && (
            <div className="cover" style={{background: partner.colors.background, color: partner.colors.text}}>
              <p className="cover-eyebrow">The Winsome Life × {partner.name}</p>
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className={`cover-logo ${partner.logoRound ? 'round' : ''}`}
                />
              ) : (
                <p className="cover-name">{partner.name}</p>
              )}
              <p className="cover-script" style={{fontFamily: SCRIPT}}>
                Personalized Stationery
              </p>
              <p className="cover-sub">A Curated Collection</p>
              <p className="cover-foot">Every piece is personalized and made to order by The Winsome Life</p>
            </div>
          )}
          {page.kind === 'toc' && (
            <div className="toc">
              <h1>{data.pages[i - 1]?.kind === 'toc' ? 'Contents (continued)' : 'Contents'}</h1>
              <ul>
                {page.entries.map((e, j) => (
                  <li key={j} className={e.level === 1 ? 'toc-1' : 'toc-2'}>
                    <span>{e.title}</span>
                    <span className="dots" />
                    <span>{e.page}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {page.kind === 'products' && (
            <div className="products">
              <header>
                <span>{page.type}</span>
                <span>The Winsome Life × {partner.name}</span>
              </header>
              <ul className="grid">
                {page.items.map(({card, collection}) => (
                  <li key={card.id}>
                    <div className="photo">
                      {card.image && <img src={printImage(card.image)} alt="" />}
                    </div>
                    {collection && <p className="collection">{collection}</p>}
                    <p className="title">{shortTitle(card.title)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {page.kind === 'option' && (
            <div className="option">
              <header>
                <span>Personalization Options</span>
                <span>The Winsome Life × {partner.name}</span>
              </header>
              <h1>{page.title}</h1>
              {page.note && <p className="note">{page.note}</p>}
              <div className="option-photo">
                {page.image ? (
                  <img src={printImage(page.image, 1600)} alt={page.title} />
                ) : (
                  <p className="pending">Photo to be chosen</p>
                )}
              </div>
            </div>
          )}
          {page.kind !== 'cover' && <footer className="page-number">{i + 1}</footer>}
        </section>
      ))}
    </div>
  );
}

function Picker({data}: {data: Extract<ReturnType<typeof useLoaderData<typeof loader>>, {pick: true}>}) {
  return (
    <div style={{padding: 24, fontFamily: 'system-ui, sans-serif', background: '#FAF8F5'}}>
      <h1 style={{fontSize: 24, marginBottom: 8}}>Choose the options photos</h1>
      <p style={{marginBottom: 24, color: '#555'}}>
        Reply with the number for each, e.g. “Dog 6, Cat 5, Flower 3”.
      </p>
      {data.options.map((o) => (
        <section key={o.key} style={{marginBottom: 40}}>
          <h2 style={{fontSize: 20, margin: '0 0 12px'}}>{o.title}</h2>
          <ul style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16}}>
            {o.photos.map((p, i) => (
              <li key={i} style={{background: '#fff', padding: 8, border: '1px solid #ddd'}}>
                <img src={printImage(p.url, 500)} alt="" style={{width: '100%', height: 220, objectFit: 'contain'}} />
                <p style={{fontWeight: 700, marginTop: 6}}>
                  {o.title.replace(/ Options$/, '').replace(/ Breed$/, '')} {i + 1}
                </p>
                <p style={{fontSize: 12, color: '#666'}}>
                  {p.product}
                  {p.alt ? ` — ${p.alt}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const CATALOG_CSS = `
@page { size: letter; margin: 0; }
.catalog { background: #E9E5DF; padding: 24px 0 48px; color: #2D2D2D; }
.catalog-toolbar { position: sticky; top: 0; z-index: 10; max-width: 8.5in; margin: 0 auto 20px; display: flex; gap: 16px; align-items: center; justify-content: space-between; background: #fff; padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.08); font-family: Montserrat, system-ui, sans-serif; font-size: 14px; }
.catalog-toolbar button { background: #2D2D2D; color: #fff; padding: 10px 18px; border-radius: 4px; font-weight: 600; letter-spacing: .04em; }
.catalog-page { position: relative; width: 8.5in; height: 11in; margin: 0 auto 24px; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.12); overflow: hidden; break-after: page; page-break-after: always; }
.page-number { position: absolute; bottom: .35in; left: 0; right: 0; text-align: center; font-family: Montserrat, sans-serif; font-size: 11pt; color: #8a8a8a; }
.cover { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: .75in; }
.cover-eyebrow { font-family: Montserrat, sans-serif; font-size: 13pt; letter-spacing: .28em; text-transform: uppercase; opacity: .85; }
.cover-logo { height: 2.6in; width: auto; max-width: 6in; object-fit: contain; margin-top: .45in; }
.cover-logo.round { border-radius: 50%; box-shadow: 0 0 0 6px rgba(255,255,255,.85); }
.cover-name { font-family: 'Cormorant Garamond', serif; font-size: 48pt; margin-top: .4in; }
.cover-script { font-size: 44pt; line-height: 1.1; margin-top: .4in; }
.cover-sub { font-family: 'Cormorant Garamond', serif; font-size: 20pt; letter-spacing: .14em; text-transform: uppercase; margin-top: .25in; }
.cover-foot { font-family: Montserrat, sans-serif; font-size: 11pt; margin-top: auto; opacity: .8; }
.toc { padding: .8in .9in; }
.toc h1, .option h1 { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 34pt; color: #1B294E; margin-bottom: .25in; }
.toc li { display: flex; align-items: baseline; gap: 8px; font-family: 'Cormorant Garamond', serif; }
.toc .toc-1 { font-size: 17pt; font-weight: 700; margin-top: .14in; color: #1B294E; }
.toc .toc-2 { font-size: 14pt; padding-left: .35in; }
.toc .dots { flex: 1; border-bottom: 1.5px dotted #b9b2a6; transform: translateY(-4px); }
.products, .option { height: 100%; padding: .45in .5in .8in; display: flex; flex-direction: column; }
.products header, .option header { display: flex; justify-content: space-between; font-family: Montserrat, sans-serif; font-size: 11pt; letter-spacing: .14em; text-transform: uppercase; color: #8a7a5c; border-bottom: 1.5px solid #e4dccd; padding-bottom: 8px; margin-bottom: .25in; }
.products header span:first-child { color: #1B294E; font-weight: 700; }
.grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: .3in .35in; }
.grid li { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.grid .photo { flex: 1; min-height: 0; background: #FAF8F5; display: flex; align-items: center; justify-content: center; }
.grid .photo { position: relative; }
.grid .photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.grid .collection { font-family: Montserrat, sans-serif; font-size: 10pt; letter-spacing: .14em; text-transform: uppercase; color: #8a7a5c; margin-top: 8px; }
.grid .title { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 17pt; line-height: 1.15; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.option .note { font-family: Montserrat, sans-serif; font-size: 13pt; color: #555; margin: -.1in 0 .2in; }
.option-photo { flex: 1; min-height: 0; position: relative; }
.option-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.option-photo .pending { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.pending { font-family: Montserrat, sans-serif; color: #b33; font-size: 14pt; }
@media print {
  .catalog { background: none; padding: 0; }
  .catalog-toolbar { display: none; }
  .catalog-page { margin: 0; box-shadow: none; }
  html, body { background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
