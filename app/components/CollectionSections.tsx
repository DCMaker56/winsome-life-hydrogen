/*
 * Products grouped under headings (see ~/lib/collection-sections): a row of
 * "jump to" buttons, then each heading with its grid. Shop All nests a second
 * level (product type → collection).
 */
import {FilteredProductGrid} from '~/components/CollectionFilters';
import type {Section} from '~/lib/collection-sections';

export type SectionGroup = Section & {subsections: Section[] | null};

export function SectionJumpNav({sections}: {sections: Section[]}) {
  return (
    <nav aria-label="Jump to a section" className="mb-10 -mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-[#2D2D2D]/55">
        Jump to:
      </span>
      <ul className="contents">
        {sections.map((s) => (
          <li key={s.handle}>
            <a
              href={`#sec-${s.handle}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A96E]/40 bg-white font-sans text-[13px] text-[#2D2D2D] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors"
            >
              {s.title}
              <span className="text-[11px] text-[#2D2D2D]/45">{s.cards.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** One level of headings (product-type pages). */
export function SectionList({sections, idPrefix = 'sec'}: {sections: Section[]; idPrefix?: string}) {
  return (
    <div className="space-y-14">
      {sections.map((s) => (
        <section
          key={s.handle}
          id={`${idPrefix}-${s.handle}`}
          aria-labelledby={`${idPrefix}-${s.handle}-title`}
          className="scroll-mt-28"
        >
          <div className="flex items-baseline gap-3 mb-5 pb-3 border-b border-[#2D2D2D]/10">
            <h2
              id={`${idPrefix}-${s.handle}-title`}
              className="font-serif font-medium text-2xl md:text-[1.75rem] text-[#2D2D2D]"
            >
              {s.title}
            </h2>
            <span className="font-sans text-xs text-[#2D2D2D]/45">{s.cards.length}</span>
          </div>
          <FilteredProductGrid cards={s.cards} hideEnd />
        </section>
      ))}
    </div>
  );
}

/** Two levels (Shop All): product type, then collection within it. */
export function SectionGroups({groups}: {groups: SectionGroup[]}) {
  return (
    <div className="space-y-20">
      {groups.map((g) => (
        <section
          key={g.handle}
          id={`sec-${g.handle}`}
          aria-labelledby={`sec-${g.handle}-title`}
          className="scroll-mt-28"
        >
          <div className="flex items-baseline gap-3 mb-8 pb-3 border-b-2 border-[#C9A96E]/50">
            <h2
              id={`sec-${g.handle}-title`}
              className="font-serif font-medium text-3xl md:text-[2.2rem] text-[#2D2D2D]"
            >
              {g.title}
            </h2>
            <span className="font-sans text-sm text-[#2D2D2D]/45">{g.cards.length}</span>
          </div>
          {g.subsections ? (
            <div className="space-y-12">
              {g.subsections.map((s) => (
                <section key={s.handle} aria-labelledby={`sec-${g.handle}-${s.handle}`}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <h3
                      id={`sec-${g.handle}-${s.handle}`}
                      className="font-serif font-medium text-xl md:text-[1.45rem] text-[#2D2D2D]"
                    >
                      {s.title}
                    </h3>
                    <span className="font-sans text-xs text-[#2D2D2D]/45">{s.cards.length}</span>
                  </div>
                  <FilteredProductGrid cards={s.cards} hideEnd />
                </section>
              ))}
            </div>
          ) : (
            <FilteredProductGrid cards={g.cards} hideEnd />
          )}
        </section>
      ))}
    </div>
  );
}
