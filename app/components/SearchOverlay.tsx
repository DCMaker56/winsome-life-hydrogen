/*
 * SearchOverlay — the site search (Sydney, Nov 2026).
 *
 * Opens from the header search bar / icon (or Cmd/Ctrl + K). As the customer
 * types, it asks Shopify's predictive search for matching products and
 * collections across the whole catalog (not just what the page loaded).
 * Enter, or "See all results", opens the full results page (/search?q=…).
 */
import {useEffect, useRef, useState} from 'react';
import {Link, useFetcher, useNavigate} from 'react-router';
import {ArrowRight, Search, X} from 'lucide-react';

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PredictiveProduct = {
  id: string;
  handle: string;
  title: string;
  selectedOrFirstAvailableVariant?: {
    image?: {url: string} | null;
    price?: {amount: string} | null;
  } | null;
};
type PredictiveCollection = {id: string; handle: string; title: string; image?: {url: string} | null};
type PredictiveData = {
  term?: string;
  result?: {items?: {products?: PredictiveProduct[]; collections?: PredictiveCollection[]}};
};

/** Quick picks shown before the customer types. */
const POPULAR = ['Notecards', 'Notepads', 'Monogram', 'Dog', 'Christmas gift tags', 'Holiday photo cards', 'Place cards', 'Tennis'];

const shortTitle = (t: string) => t.split('|')[0].trim();
const sized = (url: string, w: number) => `${url}${url.includes('?') ? '&' : '?'}width=${w}`;

export default function SearchOverlay({open, onOpenChange}: SearchOverlayProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher<PredictiveData>({key: 'site-search'});
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const term = query.trim();

  // Cmd/Ctrl + K toggles the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // While open: focus the box, lock page scroll, Esc closes.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  // Live results, a moment after typing stops.
  useEffect(() => {
    if (term.length < 2) return;
    const t = setTimeout(() => {
      fetcher.load(`/search?predictive&limit=8&q=${encodeURIComponent(term)}`);
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  if (!open) return null;

  const close = () => onOpenChange(false);
  const goToResults = (q = term) => {
    if (!q) return;
    close();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const fresh = fetcher.data?.term === term;
  const products = fresh ? fetcher.data?.result?.items?.products ?? [] : [];
  const collections = fresh ? fetcher.data?.result?.items?.collections ?? [] : [];
  const loading = term.length >= 2 && (!fresh || fetcher.state !== 'idle');
  const nothing = term.length >= 2 && fresh && fetcher.state === 'idle' && !products.length && !collections.length;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Search">
      <button
        type="button"
        aria-label="Close search"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 bg-[#2D2D2D]/45 cursor-default wl-fade-in"
      />
      <div className="relative mx-auto w-full sm:max-w-[680px] sm:mt-[8vh] bg-[#FAF8F5] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.5)] max-h-[100dvh] sm:max-h-[84vh] flex flex-col wl-fade-in">
        {/* Search box */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            goToResults();
          }}
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[#C9A96E]/30 bg-white"
        >
          <Search size={20} className="text-[#C9A96E] shrink-0" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notecards, notepads, gifts…"
            autoComplete="off"
            enterKeyHint="search"
            aria-label="Search products"
            className="flex-1 min-w-0 bg-transparent font-sans text-[17px] text-[#2D2D2D] placeholder:text-[#2D2D2D]/40 outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="font-sans text-[12px] text-[#2D2D2D]/50 hover:text-[#2D2D2D] px-1"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="w-9 h-9 -mr-1 flex items-center justify-center text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
          >
            <X size={20} />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5">
          {/* Before typing: popular searches */}
          {term.length < 2 && (
            <div>
              <p className="font-sans font-semibold text-[11px] tracking-[0.2em] uppercase text-[#C9A96E] mb-3">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToResults(p)}
                    className="font-sans text-[13px] text-[#2D2D2D] bg-white ring-1 ring-[#C9A96E]/30 hover:ring-[#C9A96E] px-3.5 py-2 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && !products.length && (
            <p className="font-sans text-sm text-[#2D2D2D]/55 py-6 text-center">Searching…</p>
          )}

          {nothing && (
            <div className="py-8 text-center">
              <p className="font-sans text-[15px] text-[#2D2D2D]">No results for &ldquo;{term}&rdquo;</p>
              <p className="font-sans text-[13px] text-[#2D2D2D]/55 mt-1">
                Try a simpler word, like &ldquo;dog&rdquo;, &ldquo;monogram&rdquo; or &ldquo;tennis&rdquo;.
              </p>
            </div>
          )}

          {/* Matching collections */}
          {collections.length > 0 && (
            <div className="mb-5">
              <p className="font-sans font-semibold text-[11px] tracking-[0.2em] uppercase text-[#C9A96E] mb-2">
                Collections
              </p>
              <div className="flex flex-wrap gap-2">
                {collections.slice(0, 6).map((c) => (
                  <Link
                    key={c.id}
                    to={`/collections/${c.handle}`}
                    onClick={close}
                    className="inline-flex items-center gap-1.5 font-sans text-[13px] text-[#2D2D2D] bg-white ring-1 ring-[#C9A96E]/30 hover:ring-[#C9A96E] px-3.5 py-2"
                  >
                    {c.title} <ArrowRight size={12} className="text-[#2D2D2D]/40" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Matching products */}
          {products.length > 0 && (
            <div>
              <p className="font-sans font-semibold text-[11px] tracking-[0.2em] uppercase text-[#C9A96E] mb-2">
                Products
              </p>
              <ul className="divide-y divide-[#C9A96E]/15">
                {products.map((p) => {
                  const v = p.selectedOrFirstAvailableVariant;
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/products/${p.handle}`}
                        onClick={close}
                        className="flex items-center gap-4 py-3 group"
                      >
                        <span className="w-16 h-16 shrink-0 bg-white ring-1 ring-[#C9A96E]/20 overflow-hidden">
                          {v?.image?.url && (
                            <img src={sized(v.image.url, 160)} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-serif text-[16px] text-[#2D2D2D] leading-snug line-clamp-2 group-hover:text-[#C9A96E] transition-colors">
                            {shortTitle(p.title)}
                          </span>
                          {v?.price && (
                            <span className="block font-sans text-[13px] text-[#2D2D2D]/55 mt-0.5">
                              From ${Number(v.price.amount).toFixed(2)}
                            </span>
                          )}
                        </span>
                        <ArrowRight size={14} className="shrink-0 text-[#2D2D2D]/30" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* See all */}
        {term.length >= 2 && (
          <div className="border-t border-[#C9A96E]/25 bg-white px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => goToResults()}
              className="w-full h-12 bg-[#2D2D2D] text-white font-sans font-medium text-[12px] tracking-[0.15em] uppercase hover:bg-[#C9A96E] transition-colors"
            >
              See all results for &ldquo;{term}&rdquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
