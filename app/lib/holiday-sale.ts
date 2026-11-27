/*
 * Holiday Sale (Sydney, Nov 2026): 20% off holiday cards (Holiday Photo
 * Cards) and the Christmas / Holiday collection, Nov 20 – Nov 30, 2026.
 * The promotion leads with holiday cards (Sydney: "sell more holiday
 * cards"). The discount itself is Shopify's
 * automatic discount "Holiday 2026: 20% off"; this file only drives the
 * site's promotion (announcement bar + countdown, home banner, product
 * badge, collection banner). Everything hides itself after `endsAt`.
 * Keep the dates in step with the Shopify discount.
 */
export const HOLIDAY_SALE = {
  percent: 20,
  /** Collections the Shopify discount covers (badges show on these). */
  collections: ['holiday-photo-cards', 'christmas-holiday'],
  /** Where the sale buttons go: the holiday cards. */
  href: '/collections/holiday-photo-cards',
  /** Nov 30, 11:59 pm Eastern — when the Shopify discount ends. */
  endsAt: '2026-12-01T04:59:00Z',
  startsAt: '2026-11-20T00:00:00Z',
};

export function holidaySaleActive(now = Date.now()) {
  return now >= Date.parse(HOLIDAY_SALE.startsAt) && now < Date.parse(HOLIDAY_SALE.endsAt);
}

/** Time left as days / hours / minutes / seconds. */
export function timeLeft(now = Date.now()) {
  const ms = Math.max(0, Date.parse(HOLIDAY_SALE.endsAt) - now);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: ms === 0,
  };
}

/*
 * Black Friday (Sydney, Nov 2026): 20% off everything, Fri Nov 27 through
 * Mon Nov 30 (Shopify automatic discount "Black Friday: 20% off everything"
 * on the "Black Friday - All Products" collection, which leaves out
 * add-on fees). Ends with the Holiday Sale, so one countdown serves both.
 * While it runs, the site's sale messages switch to Black Friday.
 */
export const BLACK_FRIDAY = {
  percent: 20,
  startsAt: '2026-11-27T13:30:00Z',
  endsAt: HOLIDAY_SALE.endsAt,
  href: '/collections/all',
};

export function blackFridayActive(now = Date.now()) {
  return now >= Date.parse(BLACK_FRIDAY.startsAt) && now < Date.parse(BLACK_FRIDAY.endsAt);
}
