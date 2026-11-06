/*
 * CollectionFilters — the filter bar on product-type pages and Shop All
 * (search · Collection · Sort), plus the filtered grid.
 *
 * Desktop: a row of dropdowns with checkboxes and counts, chosen filters as
 * removable chips. Phones: one "Filter & Sort" button that opens a panel
 * from the bottom. Every change updates the URL (?theme=floral&sort=…), so
 * a filtered page can be bookmarked or shared; the loader does the filtering.
 */
import {useEffect, useRef, useState} from 'react';
import {Link, useNavigation, useSearchParams} from 'react-router';
import {ChevronDown, Search, SlidersHorizontal, X} from 'lucide-react';
import {SORT_OPTIONS, type FacetGroup} from '~/lib/collection-filters';
import type {CardData} from '~/lib/collection-filters.server';
import {buildSrcSet} from '~/lib/seo';

function useFilterParams() {
  const [params, setParams] = useSearchParams();
  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    // Hydrogen pagination cursors from the old infinite grid don't apply here.
    next.delete('cursor');
    next.delete('direction');
    setParams(next, {preventScrollReset: true});
  };
  const toggle = (group: string, value: string) =>
    update((p) => {
      const current = (p.get(group) ?? '').split(',').filter(Boolean);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length) p.set(group, next.join(','));
      else p.delete(group);
    });
  const setSort = (value: string) =>
    update((p) => {
      if (value === 'featured') p.delete('sort');
      else p.set('sort', value);
    });
  const clearAll = (groups: string[]) =>
    update((p) => [...groups, 'q'].forEach((g) => p.delete(g)));
  const setQuery = (value: string) =>
    update((p) => {
      if (value.trim()) p.set('q', value.trim());
      else p.delete('q');
    });
  return {toggle, setSort, clearAll, setQuery};
}

/** Search box: narrows the page as you type (after a short pause). */
function SearchBox({
  q,
  placeholder,
  onSearch,
  className = '',
}: {
  q: string;
  placeholder: string;
  onSearch: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState(q);
  const timer = useRef<number | undefined>(undefined);
  // Keep in step when the URL changes (e.g. "Clear all").
  useEffect(() => setValue(q), [q]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        window.clearTimeout(timer.current);
        onSearch(value);
      }}
    >
      <Search
        size={16}
        aria-hidden
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2D2D]/45"
      />
      <input
        type="search"
        value={value}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => onSearch(v), 450);
        }}
        className="w-full h-10 pl-9 pr-3 border border-[#C9A96E]/40 bg-white font-sans text-[13px] text-[#2D2D2D] placeholder:text-[#2D2D2D]/45 focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
      />
    </form>
  );
}

export function CollectionFilters({
  facets,
  sort,
  resultCount,
  q = '',
  searchPlaceholder = 'Search',
}: {
  facets: FacetGroup[];
  sort: string;
  resultCount: number;
  q?: string;
  searchPlaceholder?: string;
}) {
  const {toggle, setSort, clearAll, setQuery} = useFilterParams();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const chosen = facets.flatMap((g) =>
    g.options.filter((o) => o.selected).map((o) => ({group: g.key, ...o})),
  );
  const groupKeys = facets.map((g) => g.key);

  // Close an open dropdown on outside click or Escape.
  useEffect(() => {
    if (!openGroup) return;
    const onDown = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenGroup(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openGroup]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const checkbox = (group: string, o: FacetGroup['options'][number]) => (
    <label
      key={o.value}
      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#FAF8F5] font-sans text-sm text-[#2D2D2D]"
    >
      <input
        type="checkbox"
        checked={o.selected}
        onChange={() => toggle(group, o.value)}
        className="w-4 h-4 accent-[#2D2D2D]"
      />
      <span className="flex-1">{o.label}</span>
      <span className="text-[#2D2D2D]/45 text-xs tabular-nums">{o.count}</span>
    </label>
  );

  return (
    <div className="mb-8">
      {/* Desktop bar */}
      <div ref={barRef} className="hidden md:flex flex-wrap items-center gap-2">
        <SearchBox q={q} placeholder={searchPlaceholder} onSearch={setQuery} className="w-64" />
        {facets.map((g) => {
          const n = g.options.filter((o) => o.selected).length;
          const isOpen = openGroup === g.key;
          return (
            <div key={g.key} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenGroup(isOpen ? null : g.key)}
                className={`inline-flex items-center gap-1.5 h-10 px-4 border font-sans text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
                  n
                    ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white'
                    : 'border-[#C9A96E]/40 bg-white text-[#2D2D2D] hover:border-[#2D2D2D]'
                }`}
              >
                {g.label}
                {n > 0 && <span className="text-[11px] opacity-80">({n})</span>}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div
                  className={`absolute left-0 top-full mt-2 z-30 max-h-[26rem] overflow-y-auto bg-white ring-1 ring-[#C9A96E]/30 shadow-[0_18px_40px_-20px_rgba(45,45,45,0.35)] py-1.5 ${
                    g.options.length > 12 ? 'w-[34rem] grid grid-cols-2' : 'w-64'
                  }`}
                >
                  {g.options.map((o) => checkbox(g.key, o))}
                </div>
              )}
            </div>
          );
        })}

        <label className="ml-auto inline-flex items-center gap-2 font-sans text-[13px] text-[#2D2D2D]/70">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 border border-[#C9A96E]/40 bg-white text-[#2D2D2D] font-sans text-[13px] focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Phone search + button */}
      <SearchBox q={q} placeholder={searchPlaceholder} onSearch={setQuery} className="md:hidden mb-3" />
      <div className="md:hidden flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-2 h-11 px-4 border border-[#2D2D2D] bg-white font-sans text-[13px] font-medium tracking-[0.06em] uppercase text-[#2D2D2D]"
        >
          <SlidersHorizontal size={15} />
          Filter &amp; Sort{chosen.length ? ` (${chosen.length})` : ''}
        </button>
        <span className="font-sans text-xs text-[#2D2D2D]/55">
          {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      {/* Chosen filters */}
      {(chosen.length > 0 || q) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {q && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#F6F0E7] border border-[#C9A96E]/40 font-sans text-[12px] text-[#2D2D2D] hover:border-[#2D2D2D]"
              aria-label={`Clear search for ${q}`}
            >
              &ldquo;{q}&rdquo;
              <X size={12} />
            </button>
          )}
          {chosen.map((c) => (
            <button
              key={`${c.group}-${c.value}`}
              type="button"
              onClick={() => toggle(c.group, c.value)}
              className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#F6F0E7] border border-[#C9A96E]/40 font-sans text-[12px] text-[#2D2D2D] hover:border-[#2D2D2D]"
              aria-label={`Remove ${c.label}`}
            >
              {c.label}
              <X size={12} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => clearAll(groupKeys)}
            className="font-sans text-[12px] text-[#2D2D2D]/70 underline underline-offset-2 hover:text-[#C9A96E] px-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Phone sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filter and sort">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-[#2D2D2D]/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-white flex flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9A96E]/20">
              <p className="font-serif text-xl text-[#2D2D2D]">Filter &amp; Sort</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <div className="px-3 py-3">
                <label htmlFor="sheet-sort" className="block font-sans font-medium text-[11px] tracking-[0.15em] uppercase text-[#2D2D2D]/70 mb-2">
                  Sort
                </label>
                <select
                  id="sheet-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full h-11 px-3 border border-[#C9A96E]/40 bg-white font-sans text-sm"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {facets.map((g) => (
                <details key={g.key} className="border-t border-[#C9A96E]/15" open={g.options.some((o) => o.selected)}>
                  <summary className="flex items-center justify-between px-3 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-sans font-medium text-[13px] tracking-[0.08em] uppercase text-[#2D2D2D]">
                    {g.label}
                    <ChevronDown size={16} />
                  </summary>
                  <div className="pb-2">{g.options.map((o) => checkbox(g.key, o))}</div>
                </details>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-[#C9A96E]/20 flex gap-3">
              {chosen.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAll(groupKeys)}
                  className="h-12 px-5 border border-[#2D2D2D] font-sans text-[12px] font-medium tracking-[0.12em] uppercase"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 h-12 bg-[#2D2D2D] text-white font-sans text-[12px] font-medium tracking-[0.12em] uppercase"
              >
                Show {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE = 48;

/** The filtered grid: shows 48 at a time with a "Show more" button. */
export function FilteredProductGrid({
  cards,
  hideEnd = false,
  discountPercent,
  hidePrices = false,
  labels,
}: {
  cards: CardData[];
  /** Small label above each product's name (e.g. its product type). */
  labels?: Record<string, string>;
  /** Sections on one page: no "You've reached the end" under each. */
  hideEnd?: boolean;
  /** Partner pages: show the regular price crossed out next to the discounted one. */
  discountPercent?: number | null;
  /** Partner pages' "customer view": no prices at all. */
  hidePrices?: boolean;
}) {
  const [shown, setShown] = useState(PAGE);
  const navigation = useNavigation();
  const loading = navigation.state === 'loading';
  const key = cards.map((c) => c.id).join(',');
  // A new filter starts back at the first 48.
  useEffect(() => setShown(PAGE), [key]);

  if (!cards.length) {
    return (
      <p className="py-20 text-center font-sans text-sm text-[#2D2D2D]/60">
        No pieces match. Try a different word or remove a filter.
      </p>
    );
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <ul className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {cards.slice(0, shown).map((p, i) => (
          <li key={p.id}>
            <Link
              to={`/products/${p.slug}`}
              prefetch="intent"
              className="group block bg-white overflow-hidden"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#FAF8F5]">
                {p.image ? (
                  <img
                    src={p.image}
                    srcSet={buildSrcSet(p.image, [300, 400, 600, 800])}
                    sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 50vw"
                    alt={`${p.title} — personalized ${p.type}`}
                    loading={i < 8 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-[#C9A96E]/5" />
                )}
              </div>
              <div className="p-3 sm:p-4">
                {(p.onSale || labels?.[p.id]) && (
                  <span className="flex flex-wrap gap-x-2 mb-1.5 font-sans font-medium text-[9.5px] tracking-[0.18em] uppercase">
                    {labels?.[p.id] && <span className="text-[#2D2D2D]/50">{labels[p.id]}</span>}
                    {p.onSale && <span className="text-[#C9A96E]">Sale</span>}
                  </span>
                )}
                <h3 className="font-serif font-medium text-[15px] sm:text-base text-[#2D2D2D] leading-tight mb-1 group-hover:text-[#C9A96E] transition-colors line-clamp-2 min-h-[2.6rem]">
                  {p.title}
                </h3>
                {hidePrices ? null : discountPercent ? (
                  <p className="font-sans text-sm sm:text-[15px] flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[#2D2D2D]/50">
                      From <s>${p.price.toFixed(2)}</s>
                    </span>
                    <span className="font-semibold text-[#2D2D2D]">
                      ${(p.price * (1 - discountPercent / 100)).toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-[#B5462F]">{discountPercent}% off</span>
                  </p>
                ) : (
                  <p className="font-sans text-sm text-[#2D2D2D]/65">From ${p.price.toFixed(2)}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className={`flex flex-col items-center gap-3 ${hideEnd && shown >= cards.length ? '' : 'mt-12'}`}>
        {shown < cards.length ? (
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="font-sans font-medium inline-flex items-center justify-center px-10 py-3.5 border border-[#C9A96E] text-[#C9A96E] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A96E] hover:text-white transition-colors duration-300"
          >
            Show more ({cards.length - shown})
          </button>
        ) : hideEnd ? null : (
          <p className="font-sans font-light text-xs tracking-[0.15em] uppercase text-[#2D2D2D]/35">
            You&rsquo;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
