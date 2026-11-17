/*
 * Loader for a partner's page, shared by the Store link
 * (routes/partners.$handle) and the customer link (routes/shop.$handle).
 */
import {data} from 'react-router';
import type {AppLoadContext} from 'react-router';
import {loadFilteredProducts} from '~/lib/collection-filters.server';
import {groupIntoSections} from '~/lib/collection-sections';
import {
  PARTNERS,
  PARTNER_PLACEMENTS,
  PARTNER_SECTION_ORDER,
  PARTNER_SECTION_RULES,
  PARTNER_SECTION_TITLES,
  REFERRAL_ATTRIBUTE,
  whiteLabelPartnerFor,
} from '~/lib/partners';

/**
 * Store link (/partners/<handle>, customerLink false): the partner's own
 * page, with their discount and "Edit my selection". Customer link
 * (/shop/<handle>, routes/shop.$handle): the page the partner forwards to
 * customers, at full price, marking the cart so we can pay the partner
 * their commission.
 */
export async function partnerPageLoader(
  {context, params, request}: {context: AppLoadContext; params: {handle?: string}; request: Request},
  customerLink: boolean,
) {
  const partner = params.handle ? PARTNERS[params.handle] : undefined;
  if (!partner) throw new Response(null, {status: 404});
  if (customerLink && !partner.commission) throw new Response(null, {status: 404});

  const products = await loadFilteredProducts(
    context.storefront as never,
    request,
    partner.collection ?? undefined,
    {withCollections: true},
  );

  // Put the partner's code on the cart (keeping any others) so it's applied
  // at checkout. Only on a normal page view, not on every filter change.
  let headers: Headers | undefined;
  if (customerLink) {
    // Full price: take off the partner's code if this cart has it (e.g. the
    // partner opened their Store link on this phone), and mark the cart so
    // the order is credited to the partner.
    const cart = await context.cart.get();
    const codes = (cart?.discountCodes ?? []).map((d) => d.code);
    const keep = codes.filter((c) => c.toUpperCase() !== partner.discountCode.toUpperCase());
    let cartId = cart?.id;
    if (keep.length !== codes.length) {
      const result = await context.cart.updateDiscountCodes(keep);
      cartId = result.cart?.id ?? cartId;
    }
    const attrs = (cart?.attributes ?? []).filter((a) => a.key !== REFERRAL_ATTRIBUTE);
    const current = cart?.attributes?.find((a) => a.key === REFERRAL_ATTRIBUTE)?.value;
    if (current !== partner.name) {
      const result = await context.cart.updateAttributes(
        [...attrs.map((a) => ({key: a.key, value: a.value ?? ''})), {key: REFERRAL_ATTRIBUTE, value: partner.name}],
        cartId ? {cartId} : undefined,
      );
      cartId = result.cart?.id ?? cartId;
    }
    if (cartId && cartId !== cart?.id) headers = context.cart.setCartId(cartId);
  } else if (partner.discountCode) {
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

  return data(
    {
      partner,
      ...rest,
      sections,
      customerView,
      customerLink,
      whiteLabelPartner: whiteLabelPartnerFor(partner.handle, customerLink),
    },
    headers ? {headers} : undefined,
  );
}
