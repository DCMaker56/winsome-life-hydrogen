/*
 * CompleteTheSet — "Complete the set" on a product page: the other pieces of
 * the same artwork (e.g. the Duck Hunting Notecards under the Duck Hunting
 * Notepad), plus a few accessories ("Also pairs well").
 *
 * "Add the Notecards" opens QuickAddSheet: a slide-in panel showing that
 * product's own buy box (sizes, sets, envelopes, the "I approve my design"
 * step, Add to Cart), with personalization pre-filled from the item it
 * completes. Nothing is added without the customer's own choices and
 * approval, because everything is made to order and final sale.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {X} from 'lucide-react';
import {ProductView, type ProductViewData} from '~/components/ProductView';
import {SET_DISCOUNT_PERCENT, findSet, type SetCardProduct} from '~/lib/matching-sets';

/** Personalization carried over from the item being completed. */
export type PersonalizationPrefill = {
  text?: string;
  fontLabel?: string;
  inkLabel?: string;
};

export function CompleteTheSet({
  matches,
  accessories,
  fromLabel,
  prefill,
}: {
  matches: SetCardProduct[];
  accessories: SetCardProduct[];
  fromLabel: string;
  prefill: PersonalizationPrefill;
}) {
  const [open, setOpen] = useState<SetCardProduct | null>(null);
  if (!matches.length && !accessories.length) return null;

  const summary = [prefill.text?.trim(), prefill.fontLabel, prefill.inkLabel && `${prefill.inkLabel} ink`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mt-8 space-y-6">
      {matches.length > 0 && (
        <section
          aria-labelledby="complete-set-title"
          className="bg-white border border-[#C9A96E] p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="complete-set-title" className="font-serif text-2xl text-[#1B294E]">
              Complete the set
            </h2>
            <span className="shrink-0 px-2.5 py-1 bg-[#1B294E] text-white font-sans font-semibold text-[10px] tracking-[0.12em] uppercase">
              Save {SET_DISCOUNT_PERCENT}%
            </span>
          </div>
          <ul className="space-y-4">
            {matches.map((m) => (
              <li key={m.handle} className="space-y-3">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 shrink-0 bg-[#FAF8F5] border border-[#C9A96E]/20 overflow-hidden">
                    {m.image && (
                      <img
                        src={`${m.image}${m.image.includes('?') ? '&' : '?'}width=200`}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans font-medium text-[15px] text-[#2D2D2D] leading-snug">
                      {shortTitle(m.title)}
                    </p>
                    <p className="font-sans text-[13px] text-[#2D2D2D]/60 mt-0.5">
                      The same artwork as your {fromLabel.toLowerCase() || 'item'} · from $
                      {m.price.toFixed(2)}
                    </p>
                    {summary && (
                      <p className="font-sans text-[12px] text-[#2D2D2D]/55 mt-0.5">
                        Personalized like your {fromLabel.toLowerCase() || 'item'}: {summary}{' '}
                        <span className="text-[#2D2D2D]/45">(you can change it)</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(m)}
                  className="w-full h-12 bg-[#1B294E] text-white font-sans font-medium text-[12px] tracking-[0.14em] uppercase hover:bg-[#2D2D2D] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]"
                >
                  Add the {m.label} · from ${m.price.toFixed(2)}
                </button>
              </li>
            ))}
          </ul>
          <p className="font-sans text-[12px] text-[#2D2D2D]/60 text-center">
            Buy two or more pieces of a matching set and save {SET_DISCOUNT_PERCENT}% at
            checkout.
          </p>
        </section>
      )}

      {accessories.length > 0 && (
        <section aria-labelledby="pairs-well-title" className="space-y-3">
          <h2 id="pairs-well-title" className="font-serif text-xl text-[#1B294E]">
            Also pairs well
          </h2>
          <ul className="space-y-2">
            {accessories.map((a) => (
              <li key={a.handle}>
                <button
                  type="button"
                  onClick={() => setOpen(a)}
                  className="w-full flex gap-3 items-center text-left bg-white border border-[#C9A96E]/20 hover:border-[#C9A96E] p-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                >
                  <span className="w-14 h-14 shrink-0 bg-[#FAF8F5] overflow-hidden">
                    {a.image && (
                      <img
                        src={`${a.image}${a.image.includes('?') ? '&' : '?'}width=160`}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-[13px] font-medium text-[#2D2D2D] leading-snug line-clamp-2">
                      {shortTitle(a.title)}
                    </span>
                    <span className="block font-sans text-[12px] text-[#2D2D2D]/55">
                      from ${a.price.toFixed(2)}
                    </span>
                  </span>
                  <span className="shrink-0 font-sans font-semibold text-[11px] tracking-[0.12em] uppercase text-[#1B294E] px-2">
                    Add
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {open && (
        <QuickAddSheet
          product={open}
          prefill={prefill}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/**
 * Slide-in panel with another product's buy box. Loads that product page's
 * own data, so its options, questions and approval match its product page.
 */
export function QuickAddSheet({
  product,
  prefill,
  onClose,
}: {
  product: Pick<SetCardProduct, 'handle' | 'title'>;
  prefill?: PersonalizationPrefill;
  onClose: () => void;
}) {
  const fetcher = useFetcher<ProductViewData>();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetcher.load(`/products/${product.handle}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.handle]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onAdded = useCallback(() => setAdded(true), []);
  const data = fetcher.data;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Add ${shortTitle(product.title)}`}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-[#2D2D2D]/40 cursor-default"
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-[520px] bg-[#FAF8F5] shadow-[-24px_0_48px_-24px_rgba(0,0,0,0.35)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9A96E]/20 bg-white">
          <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-[#2D2D2D]/70">
            Complete the set
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center text-[#2D2D2D] hover:text-[#C9A96E] focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {added ? (
            <div role="status" className="px-6 py-16 text-center space-y-4">
              <p
                className="text-[2.2rem] text-[#2D2D2D] leading-none"
                style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
              >
                Added
              </p>
              <p className="font-serif text-xl text-[#2D2D2D]">
                {shortTitle(product.title)} is in your cart.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center justify-center h-12 px-8 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#C9A96E] transition-colors"
              >
                Keep Shopping
              </button>
            </div>
          ) : data ? (
            <ProductView data={data} embedded prefill={prefill} onAdded={onAdded} />
          ) : (
            <p className="px-6 py-16 text-center font-sans text-sm text-[#2D2D2D]/60">
              {fetcher.state === 'idle' ? 'Sorry, this item couldn’t be loaded.' : 'Loading…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Product titles carry Etsy-style "A | B | C" keyword runs; show the first part. */
function shortTitle(title: string) {
  return title.split('|')[0].trim();
}

/**
 * Cart: "Complete the collection" — when a pilot set piece is in the cart
 * and its match isn't, suggest the match. "Add" opens the same quick-add
 * sheet, pre-filled from the cart line's personalization.
 */
export function CartCompleteTheSet({
  lines,
}: {
  lines: Array<{
    merchandise: {product: {handle: string}};
    attributes?: Array<{key: string; value?: string | null}>;
  }>;
}) {
  const inCart = new Set(lines.map((l) => l.merchandise.product.handle));
  const suggestion = (() => {
    for (const line of lines) {
      const set = findSet(line.merchandise.product.handle);
      const missing = set?.others.find((o) => !inCart.has(o.handle));
      if (set && missing) return {line, piece: missing, fromLabel: set.self.label};
    }
    return null;
  })();
  const preview = useFetcher<ProductViewData>();
  const [open, setOpen] = useState(false);
  const handle = suggestion?.piece.handle;

  useEffect(() => {
    if (handle) preview.load(`/products/${handle}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  if (!suggestion) return null;
  const app = preview.data?.appProduct;
  const attrs = suggestion.line.attributes ?? [];
  const attr = (k: string) => attrs.find((a) => a.key === k)?.value ?? undefined;
  const prefill: PersonalizationPrefill = {
    text: attr('Text'),
    // Stored as "Font 3 – Pinyon Script".
    fontLabel: attr('Font')?.split('–').pop()?.trim(),
    inkLabel: attr('Text Color'),
  };
  const title = app?.title ?? '';

  return (
    <div className="mx-0 my-4 p-4 bg-[#FAF8F5] border border-[#C9A96E]/25 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-serif text-lg text-[#1B294E]">Complete the set</p>
        <span className="px-2 py-0.5 bg-[#1B294E] text-white font-sans font-semibold text-[10px] tracking-[0.12em] uppercase">
          Save {SET_DISCOUNT_PERCENT}%
        </span>
      </div>
      <div className="flex gap-3 items-center">
        <div className="w-14 h-14 shrink-0 bg-white border border-[#C9A96E]/15 overflow-hidden">
          {app?.images?.[0] && (
            <img
              src={`${app.images[0]}${app.images[0].includes('?') ? '&' : '?'}width=160`}
              alt=""
              loading="lazy"
              className="w-full h-full object-contain"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[13px] font-medium text-[#2D2D2D] leading-snug line-clamp-2">
            {title ? shortTitle(title) : `Matching ${suggestion.piece.label}`}
          </p>
          <p className="font-sans text-[12px] text-[#2D2D2D]/55">
            Matches your {suggestion.fromLabel.toLowerCase()}
            {app ? ` · from $${Number(app.price).toFixed(2)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 h-9 px-3.5 border border-[#1B294E] bg-white text-[#1B294E] font-sans font-semibold text-[11px] tracking-[0.12em] uppercase hover:bg-[#1B294E] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
        >
          Add
        </button>
      </div>
      {prefill.text && (
        <p className="font-sans text-[12px] text-[#2D2D2D]/55">
          Personalized like your {suggestion.fromLabel.toLowerCase()}: {prefill.text}. You can change
          it before adding.
        </p>
      )}
      {open && (
        <QuickAddSheet
          product={{handle: suggestion.piece.handle, title: title || suggestion.piece.label}}
          prefill={prefill}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
