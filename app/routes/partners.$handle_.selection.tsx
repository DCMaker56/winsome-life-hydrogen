/**
 * /partners/<handle>/selection — data + submit endpoint for the partner's
 * "Edit my selection" panel (Sydney, Nov 2026).
 *
 * GET: the partner's current products and every other product they could
 * add. POST: saves a `partner_selection_request` metaobject in Shopify admin
 * (Content → Metaobjects → Partner Selection Request) listing the products
 * to add and remove. Nothing changes on the partner page until The Winsome
 * Life approves the request and updates the partner collection.
 */
import type {Route} from './+types/partners.$handle_.selection';
import {loadFilteredProducts, type CardData} from '~/lib/collection-filters.server';
import {saveMetaobjectEntry} from '~/lib/corporate-inquiry.server';
import {PARTNERS} from '~/lib/partners';

export type SelectionCard = Pick<CardData, 'id' | 'slug' | 'title' | 'image' | 'price'>;
export type SelectionData = {inCollection: SelectionCard[]; others: SelectionCard[]};
export type SelectionResult = {ok: boolean; error?: string};

async function loadSelection(
  context: Route.LoaderArgs['context'],
  request: Request,
  collection: string,
): Promise<SelectionData> {
  const base = new Request(new URL('/', request.url));
  const [mine, all] = await Promise.all([
    loadFilteredProducts(context.storefront as never, base, collection),
    loadFilteredProducts(context.storefront as never, base),
  ]);
  const slim = (c: CardData): SelectionCard => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    image: c.image,
    price: c.price,
  });
  const inSet = new Set(mine.cards.map((c) => c.slug));
  return {
    inCollection: mine.cards.map(slim),
    others: all.cards.filter((c) => !inSet.has(c.slug)).map(slim),
  };
}

function partnerFor(handle?: string) {
  const partner = handle ? PARTNERS[handle] : undefined;
  // Only partners with their own curated collection can edit a selection.
  if (!partner?.collection) throw new Response(null, {status: 404});
  return partner as typeof partner & {collection: string};
}

export async function loader({context, params, request}: Route.LoaderArgs) {
  const partner = partnerFor(params.handle);
  const data = await loadSelection(context, request, partner.collection);
  return Response.json(data, {headers: {'Cache-Control': 'private, no-store'}});
}

export async function action({context, params, request}: Route.ActionArgs) {
  const partner = partnerFor(params.handle);
  const form = await request.formData();
  const parseList = (k: string) => {
    try {
      const v = JSON.parse(String(form.get(k) ?? '[]'));
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 300) : [];
    } catch {
      return [];
    }
  };
  const add = parseList('add');
  const remove = parseList('remove');
  const note = String(form.get('note') ?? '').trim().slice(0, 3000);
  if (!add.length && !remove.length) {
    return {ok: false, error: 'Choose at least one product to add or remove.'} satisfies SelectionResult;
  }

  // Only real products, listed by name (and handle, for applying the change).
  const {inCollection, others} = await loadSelection(context, request, partner.collection);
  const bySlug = new Map([...inCollection, ...others].map((c) => [c.slug, c]));
  const inSet = new Set(inCollection.map((c) => c.slug));
  const line = (slug: string) => `${bySlug.get(slug)!.title.split('|')[0].trim()} (${slug})`;
  const addLines = add.filter((s) => bySlug.has(s) && !inSet.has(s)).map(line);
  const removeLines = remove.filter((s) => inSet.has(s)).map(line);
  if (!addLines.length && !removeLines.length) {
    return {ok: false, error: 'Those products could not be found. Please try again.'} satisfies SelectionResult;
  }

  const ok = await saveMetaobjectEntry(context.env, 'partner_selection_request', [
    {key: 'partner_name', value: partner.name},
    {key: 'partner_handle', value: partner.handle},
    {key: 'collection', value: partner.collection},
    {key: 'add_products', value: addLines.join('\n')},
    {key: 'remove_products', value: removeLines.join('\n')},
    {key: 'note', value: note},
    {key: 'submitted_at', value: new Date().toISOString()},
    {key: 'status', value: 'New'},
  ]);
  return (ok
    ? {ok: true}
    : {ok: false, error: 'Sorry, your request could not be sent. Please try again in a moment.'}) satisfies SelectionResult;
}
