/*
 * Free-shipping progress in the cart (Sydney, Nov 2026; replaces the old
 * theme's Hextom shipping bar). Matches the Shopify automatic discount
 * "Free Shipping": orders of $75+ to the U.S. ship free. If that threshold
 * changes in Shopify, change FREE_SHIPPING_MIN here too.
 */
import {Truck} from 'lucide-react';

export const FREE_SHIPPING_MIN = 75;

export function FreeShippingProgress({subtotal}: {subtotal: number}) {
  const remaining = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  const done = remaining === 0;
  return (
    <div className="my-4 p-4 bg-[#FAF8F5] border border-[#C9A96E]/25" role="status" aria-live="polite">
      <p className="flex items-center gap-2 font-sans text-[13.5px] text-[#2D2D2D]">
        <Truck size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
        {done ? (
          <span>
            <strong className="font-semibold">You&rsquo;ve got free shipping!</strong>
          </span>
        ) : (
          <span>
            You&rsquo;re <strong className="font-semibold">${remaining.toFixed(2)}</strong> away from{' '}
            <strong className="font-semibold">free shipping</strong>
          </span>
        )}
      </p>
      <div className="mt-2.5 h-1.5 rounded-full bg-[#2D2D2D]/10 overflow-hidden" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? 'bg-[#1B5E3A]' : 'bg-[#C9A96E]'}`}
          style={{width: `${pct}%`}}
        />
      </div>
      {!done && (
        <p className="mt-1.5 font-sans text-[11.5px] text-[#2D2D2D]/60">
          Free U.S. shipping on orders of ${FREE_SHIPPING_MIN} or more.
        </p>
      )}
    </div>
  );
}
