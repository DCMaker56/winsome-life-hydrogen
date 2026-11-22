/*
 * Gift options in the cart (Sydney, Nov 2026). "This is a gift" (packing
 * slip without prices), a gift message printed on a Winsome notecard
 * ($1.50), and gift wrap: every item wrapped individually, $5.00 for the
 * first and $2.50 for each one after. Gift orders come through Sydney to be
 * wrapped, so they ship a little later.
 *
 * The choices are cart attributes (they show on the order in Shopify); the
 * charges are add-on products the cart keeps in step with them
 * (~/lib/gift-options.server).
 */
export const GIFT_ATTR = 'Gift';
export const GIFT_MESSAGE_ATTR = 'Gift message';
export const GIFT_WRAP_ATTR = 'Gift wrap';
export const GIFT_MESSAGE_MAX = 200;
export const GIFT_PRICES = {message: 1.5, wrapFirst: 5, wrapEach: 2.5};

/** Gift wrap total for this many items. */
export const giftWrapTotal = (items: number) =>
  items <= 0 ? 0 : GIFT_PRICES.wrapFirst + GIFT_PRICES.wrapEach * (items - 1);
