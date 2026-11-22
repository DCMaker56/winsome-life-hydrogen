/*
 * Cart: "Sending this as a gift?" (Sydney, Nov 2026). The choices are saved
 * on the cart (they show on the order); the cart adds or removes the gift
 * charges to match (~/lib/gift-options.server).
 */
import {useEffect, useState} from 'react';
import {CartForm} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {isAddOnHandle} from '~/lib/addons';
import {
  GIFT_ATTR,
  GIFT_MESSAGE_ATTR,
  GIFT_MESSAGE_MAX,
  GIFT_PRICES,
  GIFT_WRAP_ATTR,
  giftWrapTotal,
} from '~/lib/gift-options';

type Cart = {
  attributes?: CartApiQueryFragment['attributes'];
  lines?: {nodes: Array<{quantity: number; attributes?: {key: string}[] | null; merchandise: {product: {handle: string}}}>};
} | null | undefined;
const money = (n: number) => `$${n.toFixed(2)}`;

function Check({on}: {on: boolean}) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 w-[18px] h-[18px] shrink-0 border-[1.5px] border-[#2D2D2D] flex items-center justify-center text-[12px] ${on ? 'bg-[#2D2D2D] text-white' : 'bg-white'}`}
    >
      {on ? '✓' : ''}
    </span>
  );
}

/** A checkbox row that saves cart attributes when tapped. */
function Toggle({
  on,
  attributes,
  children,
}: {
  on: boolean;
  attributes: {key: string; value: string}[];
  children: React.ReactNode;
}) {
  return (
    <CartForm route="/cart" action={CartForm.ACTIONS.AttributesUpdateInput} inputs={{attributes}}>
      {(fetcher) => (
        <button
          type="submit"
          role="checkbox"
          aria-checked={on}
          disabled={fetcher.state !== 'idle'}
          className="w-full flex gap-3 text-left disabled:opacity-60"
        >
          <Check on={on} />
          <span className="flex-1 min-w-0">{children}</span>
        </button>
      )}
    </CartForm>
  );
}

export function GiftOptions({cart}: {cart: Cart}) {
  const attr = (k: string) => cart?.attributes?.find((a) => a.key === k)?.value ?? '';
  const isGift = attr(GIFT_ATTR) === 'Yes';
  const savedMessage = attr(GIFT_MESSAGE_ATTR);
  const wrap = attr(GIFT_WRAP_ATTR) === 'Yes';
  const [message, setMessage] = useState(savedMessage);
  const [writing, setWriting] = useState(!!savedMessage);
  useEffect(() => setMessage(savedMessage), [savedMessage]);

  const items = (cart?.lines?.nodes ?? [])
    .filter(
      (l) =>
        !isAddOnHandle(l.merchandise.product.handle) &&
        !(l.attributes ?? []).some((a) => a.key === 'For'),
    )
    .reduce((n, l) => n + l.quantity, 0);

  return (
    <section aria-label="Gift options" className="mb-5">
      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[#2D2D2D]/50 mb-2">
        Sending this as a gift?
      </p>
      <div className="bg-white border border-[#C9A96E]/40 p-4 font-sans text-[#2D2D2D]">
        <Toggle
          on={isGift}
          attributes={
            isGift
              ? [
                  {key: GIFT_ATTR, value: ''},
                  {key: GIFT_MESSAGE_ATTR, value: ''},
                  {key: GIFT_WRAP_ATTR, value: ''},
                ]
              : [{key: GIFT_ATTR, value: 'Yes'}]
          }
        >
          <span className="block font-semibold text-[15px]">This is a gift</span>
          <span className="block text-[13px] text-[#2D2D2D]/60 mt-0.5">
            Ships with no prices on the packing slip.
          </span>
        </Toggle>

        {isGift && (
          <>
            <div className="mt-4 pt-4 border-t border-[#C9A96E]/25">
              <button
                type="button"
                role="checkbox"
                aria-checked={writing || !!savedMessage}
                onClick={() => setWriting(!writing)}
                className="w-full flex gap-3 text-left"
              >
                <Check on={writing || !!savedMessage} />
                <span className="flex-1">
                  <span className="flex justify-between gap-2 font-semibold text-[15px]">
                    Add a gift message <span>+{money(GIFT_PRICES.message)}</span>
                  </span>
                  <span className="block text-[13px] text-[#2D2D2D]/60 mt-0.5">
                    Printed on a Winsome notecard and tucked inside.
                  </span>
                </span>
              </button>
              {(writing || savedMessage) && (
                <CartForm
                  route="/cart"
                  action={CartForm.ACTIONS.AttributesUpdateInput}
                  inputs={{attributes: [{key: GIFT_MESSAGE_ATTR, value: message.trim()}]}}
                >
                  {(fetcher) => (
                    <div className="pl-[30px] mt-2.5">
                      <textarea
                        value={message}
                        maxLength={GIFT_MESSAGE_MAX}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="Merry Christmas! Love, Annie"
                        aria-label="Gift message"
                        className="w-full border border-[#C9A96E]/40 bg-[#FAF8F5] p-2.5 font-serif text-[15px] leading-snug outline-none focus:border-[#C9A96E]"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-[#2D2D2D]/50">
                          {message.length} / {GIFT_MESSAGE_MAX}
                        </span>
                        <button
                          type="submit"
                          disabled={fetcher.state !== 'idle' || message.trim() === savedMessage}
                          className="px-3 py-1.5 border border-[#2D2D2D] text-[11px] font-medium uppercase tracking-wider hover:bg-[#2D2D2D] hover:text-white transition-colors disabled:opacity-40"
                        >
                          {savedMessage && message.trim() === savedMessage
                            ? 'Saved'
                            : message.trim()
                              ? 'Save message'
                              : 'Remove message'}
                        </button>
                      </div>
                    </div>
                  )}
                </CartForm>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#C9A96E]/25">
              <Toggle on={wrap} attributes={[{key: GIFT_WRAP_ATTR, value: wrap ? '' : 'Yes'}]}>
                <span className="flex justify-between gap-2 font-semibold text-[15px]">
                  Add gift wrap <span>+{money(giftWrapTotal(Math.max(items, 1)))}</span>
                </span>
                <span className="block text-[13px] text-[#2D2D2D]/60 mt-0.5">
                  Each item wrapped individually: {money(GIFT_PRICES.wrapFirst)} for the first,{' '}
                  {money(GIFT_PRICES.wrapEach)} for each one after
                  {items > 1 ? ` (${items} items)` : ''}.
                </span>
              </Toggle>
            </div>

            <p className="mt-4 bg-[#F3EBDD] px-3 py-2.5 text-[12.5px] leading-snug">
              Gift orders are wrapped by hand and ship <strong>2&ndash;3 business days later</strong>{' '}
              than our usual 5&ndash;7 business days.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
