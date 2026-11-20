/*
 * Holiday Sale (Sydney, Nov 2026): 20% off the Christmas / Holiday
 * collection, Nov 20 – Nov 30, 2026. The discount itself is Shopify's
 * automatic discount "Holiday 2026: 20% off"; this file only drives the
 * site's promotion (announcement bar + countdown, home banner, product
 * badge, collection banner). Everything hides itself after `endsAt`.
 * Keep the dates in step with the Shopify discount.
 */
export const HOLIDAY_SALE = {
  percent: 20,
  collection: 'christmas-holiday',
  href: '/collections/christmas-holiday',
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
