/*
 * "Edit my selection" for retail partners (Sydney, Nov 2026). A full-screen
 * panel on the partner page (Store view): keep or remove the products in
 * their collection, add any other product, leave a note, and send the
 * request. The Winsome Life approves it before the partner page changes.
 * Data and saving: /partners/<handle>/selection.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {Check, Plus, Search, X} from 'lucide-react';
import type {SelectionData, SelectionResult, SelectionCard} from '~/routes/partners.$handle_.selection';

const shortTitle = (t: string) => t.split('|')[0].trim();
const sized = (url: string, w: number) => `${url}${url.includes('?') ? '&' : '?'}width=${w}`;

export function PartnerSelectionEditor({
  partnerHandle,
  partnerName,
  onClose,
}: {
  partnerHandle: string;
  partnerName: string;
  onClose: () => void;
}) {
  const endpoint = `/partners/${partnerHandle}/selection`;
  const data = useFetcher<SelectionData>();
  const send = useFetcher<SelectionResult>();
  const [tab, setTab] = useState<'mine' | 'add'>('mine');
  const [q, setQ] = useState('');
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    data.load(endpoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

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

  const list = useMemo(() => {
    const src = tab === 'mine' ? data.data?.inCollection ?? [] : data.data?.others ?? [];
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return words.length ? src.filter((c) => words.every((w) => c.title.toLowerCase().includes(w))) : src;
  }, [tab, q, data.data]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, slug: string) => {
    const next = new Set(set);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setter(next);
  };

  const changes = added.size + removed.size;
  const sent = send.data?.ok;
  const sending = send.state !== 'idle';

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Edit my selection">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#2D2D2D]/45 cursor-default" />
      <div className="absolute inset-0 sm:inset-6 lg:inset-10 bg-[#FAF8F5] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 lg:px-8 py-4 border-b border-[#2D2D2D]/10 bg-white">
          <div>
            <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-[#2D2D2D]/60">
              {partnerName}
            </p>
            <h2 className="font-serif text-2xl text-[#2D2D2D]">Edit my selection</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
          >
            <X size={22} />
          </button>
        </div>

        {sent ? (
          <div role="status" className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-[2.6rem] text-[#2D2D2D] leading-none" style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}>
              Thank you!
            </p>
            <p className="font-sans text-[16px] text-[#2D2D2D] max-w-md mt-4 leading-relaxed">
              Your request has been sent. The Winsome Life will review your changes and update your page shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 h-12 px-8 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#1B294E] transition-colors"
            >
              Back to my page
            </button>
          </div>
        ) : (
          <>
            {/* Tabs + search */}
            <div className="px-5 lg:px-8 pt-4 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div role="tablist" className="inline-flex p-1 rounded-full bg-white ring-1 ring-[#2D2D2D]/15 self-start">
                {(
                  [
                    ['mine', `My collection (${data.data?.inCollection.length ?? '…'})`],
                    ['add', `Add products (${data.data?.others.length ?? '…'})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`px-4 py-2 rounded-full font-sans text-[13px] transition-colors ${
                      tab === key ? 'bg-[#2D2D2D] text-white' : 'text-[#2D2D2D]/75 hover:text-[#2D2D2D]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 h-10 px-3 bg-white ring-1 ring-[#2D2D2D]/15 focus-within:ring-[#2D2D2D]/40 sm:w-72">
                <Search size={16} className="text-[#2D2D2D]/50" aria-hidden />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="flex-1 min-w-0 bg-transparent font-sans text-[15px] outline-none"
                />
              </label>
            </div>
            <p className="px-5 lg:px-8 pb-3 font-sans text-[13px] text-[#2D2D2D]/70">
              {tab === 'mine'
                ? 'Tap Remove on anything you no longer want on your page.'
                : 'Tap Add on anything you would like to offer your customers.'}
            </p>

            {/* Products */}
            <div className="flex-1 overflow-y-auto px-5 lg:px-8 pb-6">
              {!data.data ? (
                <p className="py-16 text-center font-sans text-sm text-[#2D2D2D]/60">Loading products…</p>
              ) : list.length === 0 ? (
                <p className="py-16 text-center font-sans text-sm text-[#2D2D2D]/60">No products match.</p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {list.map((c) => (
                    <ProductTile
                      key={c.slug}
                      card={c}
                      mode={tab}
                      chosen={tab === 'mine' ? removed.has(c.slug) : added.has(c.slug)}
                      onToggle={() =>
                        tab === 'mine' ? toggle(removed, setRemoved, c.slug) : toggle(added, setAdded, c.slug)
                      }
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Summary + send */}
            <send.Form
              method="post"
              action={endpoint}
              className="border-t border-[#2D2D2D]/10 bg-white px-5 lg:px-8 py-4 flex flex-col lg:flex-row gap-3 lg:items-center"
            >
              <input type="hidden" name="add" value={JSON.stringify([...added])} />
              <input type="hidden" name="remove" value={JSON.stringify([...removed])} />
              <p className="font-sans text-[14px] text-[#2D2D2D] shrink-0">
                <strong className="font-semibold">{added.size}</strong> to add ·{' '}
                <strong className="font-semibold">{removed.size}</strong> to remove
              </p>
              <input
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                aria-label="Note for The Winsome Life"
                className="flex-1 h-11 px-3 bg-[#FAF8F5] ring-1 ring-[#2D2D2D]/15 focus:ring-[#2D2D2D]/40 outline-none font-sans text-[15px]"
              />
              <button
                type="submit"
                disabled={!changes || sending}
                className="h-11 px-7 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#1B294E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending…' : 'Send request'}
              </button>
              {send.data?.error && (
                <p role="alert" className="font-sans text-[13px] text-[#B23A3A] lg:basis-full">
                  {send.data.error}
                </p>
              )}
            </send.Form>
          </>
        )}
      </div>
    </div>
  );
}

function ProductTile({
  card,
  mode,
  chosen,
  onToggle,
}: {
  card: SelectionCard;
  mode: 'mine' | 'add';
  /** mine: marked to remove · add: marked to add */
  chosen: boolean;
  onToggle: () => void;
}) {
  const removing = mode === 'mine' && chosen;
  const adding = mode === 'add' && chosen;
  return (
    <li className={`bg-white ring-1 transition-all ${adding ? 'ring-2 ring-[#1B5E3A]' : removing ? 'ring-[#B23A3A]/40' : 'ring-[#2D2D2D]/10'}`}>
      <div className={`relative aspect-square overflow-hidden bg-[#FAF8F5] ${removing ? 'opacity-35 grayscale' : ''}`}>
        {card.image && <img src={sized(card.image, 300)} alt="" loading="lazy" className="w-full h-full object-cover" />}
        {adding && (
          <span className="absolute top-2 left-2 bg-[#1B5E3A] text-white font-sans font-semibold text-[10px] tracking-[0.12em] uppercase px-2 py-0.5">
            Adding
          </span>
        )}
      </div>
      {removing && (
        <p className="-mt-7 relative text-center">
          <span className="bg-[#B23A3A] text-white font-sans font-semibold text-[10px] tracking-[0.12em] uppercase px-2 py-0.5">
            Removing
          </span>
        </p>
      )}
      <div className="p-2.5">
        <p className="font-sans text-[12.5px] leading-snug text-[#2D2D2D] line-clamp-2 h-[2.6em]">{shortTitle(card.title)}</p>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={chosen}
          className={`mt-2 w-full h-8 inline-flex items-center justify-center gap-1.5 font-sans font-semibold text-[11px] tracking-[0.1em] uppercase transition-colors ${
            mode === 'mine'
              ? removing
                ? 'bg-[#FAF8F5] text-[#2D2D2D] ring-1 ring-[#2D2D2D]/30'
                : 'bg-white text-[#B23A3A] ring-1 ring-[#B23A3A]/40 hover:bg-[#B23A3A]/5'
              : adding
                ? 'bg-[#1B5E3A] text-white'
                : 'bg-white text-[#1B5E3A] ring-1 ring-[#1B5E3A]/50 hover:bg-[#1B5E3A]/5'
          }`}
        >
          {mode === 'mine' ? (
            removing ? (
              <>Undo</>
            ) : (
              <>
                <X size={13} aria-hidden /> Remove
              </>
            )
          ) : adding ? (
            <>
              <Check size={13} aria-hidden /> Added
            </>
          ) : (
            <>
              <Plus size={13} aria-hidden /> Add
            </>
          )}
        </button>
      </div>
    </li>
  );
}
