/*
 * Illustration library — the artwork a customer places on their stationery
 * in the Winsome Studio.
 *
 * Each illustration is a subject (Pickleball, Hydrangea, Golden Retriever)
 * grouped under a niche (Sports, Floral, Pets). It renders one of two ways:
 *
 *   1. A real generated asset (Recraft) — a per-style image URL. This is the
 *      production path; Iris's pipeline drops `{niche}/{subject}-{style}` art
 *      into `assets` and it appears immediately.
 *   2. A hand-authored vector fallback (`art`) — so the whole studio flow is
 *      real and testable today, before the generated library exists.
 *
 * Style ids match Iris's system: watercolor · heritage-sketch · modern-graphic.
 */
import type {ReactNode} from "react";
import {FEED_ILLUSTRATIONS} from "~/data/illustration-feed";

export type IllustrationStyleKey =
  | "watercolor"
  | "heritage-sketch"
  | "modern-graphic";

export const ILLUSTRATION_STYLES: {
  key: IllustrationStyleKey;
  label: string;
  feel: string;
}[] = [
  {key: "watercolor", label: "Watercolor", feel: "Soft, artistic, classic"},
  {key: "heritage-sketch", label: "Heritage Sketch", feel: "Timeless, heirloom"},
  {key: "modern-graphic", label: "Modern Graphic", feel: "Clean, contemporary"},
];

export interface Illustration {
  id: string; // "sports/pickleball"
  subject: string; // "Pickleball"
  niche: string; // "Sports"
  tags: string[];
  /** Real generated art per style (production). */
  assets?: Partial<Record<IllustrationStyleKey, string>>;
  /** Hand-authored vector fallback, drawn in a 0..100 box centered at 50,50. */
  art?: ReactNode;
}

export const NICHES = [
  "All",
  "Floral",
  "Botanical",
  "Sports",
  "Maps",
  "Coastal",
  "Pets",
] as const;

// ───── Hand-authored vector art (0..100 viewBox, centered) ───────────

const peony = (
  <g>
    <path d="M18 66 Q24 52 40 54 Q34 68 18 66 Z" fill="#9CB89A" opacity="0.55" />
    <path d="M74 70 Q68 55 84 52 Q88 68 74 70 Z" fill="#8AAA88" opacity="0.5" />
    <ellipse cx="50" cy="46" rx="27" ry="23" fill="#F4D3D6" opacity="0.7" />
    <ellipse cx="44" cy="42" rx="21" ry="18" fill="#ECB9BF" opacity="0.75" />
    <ellipse cx="50" cy="46" rx="15" ry="13" fill="#E3A4AB" opacity="0.8" />
    <ellipse cx="52" cy="43" rx="10" ry="9" fill="#D48A94" opacity="0.75" />
    <ellipse cx="51" cy="46" rx="5" ry="4.5" fill="#BE6E79" opacity="0.85" />
    <circle cx="51" cy="46" r="2" fill="#F2D79C" />
  </g>
);

const hydrangea = (
  <g>
    <path d="M22 70 Q27 55 44 57 Q40 73 22 70 Z" fill="#9CB89A" opacity="0.55" />
    <path d="M78 66 Q74 52 60 58 Q68 74 78 66 Z" fill="#8AAA88" opacity="0.5" />
    {[
      [45, 35],
      [60, 38],
      [52, 48],
      [38, 45],
      [55, 28],
      [68, 48],
      [46, 58],
      [62, 56],
    ].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`}>
        <path
          d="M0 -5 L3 0 L0 5 L-3 0 Z M-5 0 L0 -3 L5 0 L0 3 Z"
          fill={i % 2 ? "#B8D0E5" : "#A8C3DC"}
          opacity="0.8"
        />
        <circle r="1" fill="#E8B4B8" opacity="0.6" />
      </g>
    ))}
  </g>
);

const rose = (
  <g>
    <path d="M20 68 Q26 54 40 56 Q35 70 20 68 Z" fill="#9CB89A" opacity="0.5" />
    <path d="M76 66 Q70 52 84 52 Q88 66 76 66 Z" fill="#8AAA88" opacity="0.5" />
    <circle cx="50" cy="46" r="22" fill="#F1C4CE" opacity="0.7" />
    <path
      d="M50 30 a16 16 0 1 1 -0.1 0 M50 36 a10 10 0 1 0 0.1 0 M50 42 a5 5 0 1 1 0.1 0"
      fill="none"
      stroke="#C77E92"
      strokeWidth="2.4"
      opacity="0.7"
    />
    <circle cx="50" cy="46" r="3" fill="#B0576E" opacity="0.8" />
  </g>
);

const magnolia = (
  <g>
    <ellipse cx="50" cy="48" rx="10" ry="24" fill="#FBEFE9" opacity="0.9" transform="rotate(-30 50 48)" />
    <ellipse cx="50" cy="48" rx="10" ry="24" fill="#FBEFE9" opacity="0.9" transform="rotate(30 50 48)" />
    <ellipse cx="50" cy="44" rx="10" ry="22" fill="#FEFCFA" opacity="0.95" />
    <ellipse cx="50" cy="48" rx="9" ry="20" fill="#F7E4D9" opacity="0.85" transform="rotate(90 50 48)" />
    <ellipse cx="50" cy="52" rx="5" ry="7" fill="#D9A48C" opacity="0.6" />
    <circle cx="50" cy="52" r="2.5" fill="#C9765E" opacity="0.7" />
    <path d="M30 70 Q45 66 68 70" stroke="#8AAA88" strokeWidth="1.4" fill="none" opacity="0.6" />
  </g>
);

const eucalyptus = (
  <g stroke="#8AAA88" strokeWidth="1.2" fill="none">
    <path d="M50 18 Q52 45 50 82" opacity="0.6" />
    {[24, 34, 44, 54, 64, 72].map((y, i) => (
      <g key={i}>
        <ellipse cx={i % 2 ? 62 : 38} cy={y} rx="8" ry="5" fill="#A2C0A0" stroke="none" opacity="0.6" transform={`rotate(${i % 2 ? 25 : -25} ${i % 2 ? 62 : 38} ${y})`} />
      </g>
    ))}
  </g>
);

const laurel = (
  <g>
    {Array.from({length: 20}, (_, i) => {
      const a = (i / 20) * 360;
      return (
        <ellipse
          key={i}
          cx="50"
          cy="16"
          rx="3.4"
          ry="7"
          fill={i % 3 === 0 ? "#C9A96E" : "#9CB89A"}
          opacity={i % 3 === 0 ? 0.5 : 0.55}
          transform={`rotate(${a} 50 50) rotate(12 50 16)`}
        />
      );
    })}
  </g>
);

const pickleball = (
  <g>
    <ellipse cx="50" cy="86" rx="26" ry="4" fill="#C9A96E" opacity="0.14" />
    <g transform="rotate(-30 48 46)">
      <ellipse cx="48" cy="38" rx="20" ry="25" fill="#E8B4B8" opacity="0.5" />
      <ellipse cx="48" cy="38" rx="20" ry="25" fill="none" stroke="#B76E79" strokeWidth="2" opacity="0.8" />
      <g fill="#FEFDFA" opacity="0.75">
        {[
          [42, 28],
          [50, 27],
          [56, 30],
          [40, 38],
          [49, 37],
          [56, 39],
          [42, 47],
          [50, 46],
          [56, 48],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" />
        ))}
      </g>
      <rect x="45" y="60" width="6" height="24" rx="3" fill="#C9A96E" opacity="0.85" />
    </g>
    <circle cx="72" cy="70" r="9" fill="#F2D79C" opacity="0.9" />
    <g fill="#B8964F" opacity="0.55">
      {[
        [68, 66],
        [74, 65],
        [77, 71],
        [70, 73],
        [75, 75],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" />
      ))}
    </g>
  </g>
);

const tennis = (
  <g>
    <ellipse cx="50" cy="86" rx="26" ry="4" fill="#C9A96E" opacity="0.14" />
    <g transform="rotate(28 50 44)">
      <ellipse cx="50" cy="34" rx="17" ry="23" fill="none" stroke="#7A9E7A" strokeWidth="4" opacity="0.8" />
      <ellipse cx="50" cy="34" rx="17" ry="23" fill="#EAF3DE" opacity="0.3" />
      <g stroke="#7A9E7A" strokeWidth="0.8" opacity="0.5">
        <line x1="50" y1="12" x2="50" y2="56" />
        <line x1="42" y1="14" x2="42" y2="54" />
        <line x1="58" y1="14" x2="58" y2="54" />
        <line x1="34" y1="26" x2="66" y2="26" />
        <line x1="33" y1="34" x2="67" y2="34" />
        <line x1="34" y1="42" x2="66" y2="42" />
      </g>
      <rect x="46" y="56" width="6" height="26" rx="3" fill="#C9A96E" opacity="0.85" />
    </g>
    <circle cx="72" cy="66" r="8" fill="#DCE99B" opacity="0.95" />
    <path d="M66 60 q6 6 2 12 M78 60 q-6 6 -1 11" stroke="#FEFDFA" strokeWidth="1.6" fill="none" opacity="0.9" />
  </g>
);

const golf = (
  <g>
    <ellipse cx="50" cy="86" rx="26" ry="4" fill="#C9A96E" opacity="0.14" />
    <g transform="rotate(-14 48 50)">
      <path d="M48 16 l0 60" stroke="#8A9BB0" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <path d="M48 74 q-9 9 -20 6 q3 -12 15 -14 Z" fill="#5F7A99" opacity="0.75" />
    </g>
    <g transform="rotate(16 58 52)">
      <path d="M58 20 l0 58" stroke="#B0A08A" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="58" cy="78" rx="9" ry="11" fill="#C9A96E" opacity="0.8" />
    </g>
    <circle cx="30" cy="74" r="7" fill="#FEFDFA" />
    <circle cx="30" cy="74" r="7" fill="none" stroke="#B4B2A9" strokeWidth="1.2" opacity="0.8" />
  </g>
);

const sailboat = (
  <g>
    <path d="M50 18 l0 50" stroke="#8A7355" strokeWidth="2.5" opacity="0.8" />
    <path d="M50 22 q26 16 3 52 Z" fill="#B8D0E5" opacity="0.75" />
    <path d="M47 30 q-18 18 -1 44 Z" fill="#FEFDFA" opacity="0.95" />
    <path d="M47 30 q-18 18 -1 44 Z" fill="none" stroke="#B4B2A9" strokeWidth="0.9" opacity="0.7" />
    <path d="M30 74 q20 8 40 0 l-5 12 q-16 5 -30 0 Z" fill="#C9A96E" opacity="0.8" />
    <path d="M50 18 l9 5 -9 5 Z" fill="#D48A94" opacity="0.85" />
    <g stroke="#B8D0E5" strokeWidth="1.4" fill="none" opacity="0.6" strokeLinecap="round">
      <path d="M16 90 q6 -4 12 0 q6 4 12 0" />
      <path d="M60 90 q6 -4 12 0 q6 4 12 0" />
    </g>
  </g>
);

const anchor = (
  <g stroke="#5F7A99" strokeWidth="3" fill="none" strokeLinecap="round">
    <circle cx="50" cy="24" r="7" opacity="0.85" />
    <path d="M50 31 l0 44" opacity="0.85" />
    <path d="M34 46 l32 0" opacity="0.85" />
    <path d="M50 75 q-22 -2 -24 -22 M50 75 q22 -2 24 -22" opacity="0.85" />
    <path d="M22 53 l4 0 -2 6 Z" fill="#5F7A99" stroke="none" />
    <path d="M78 53 l-4 0 2 6 Z" fill="#5F7A99" stroke="none" />
  </g>
);

const seahorse = (
  <g>
    <path
      d="M46 20 q14 -2 16 14 q-2 12 -12 14 q10 4 8 18 q-2 12 -14 12 q4 -8 -2 -12 q-10 -6 -8 -20 q2 -14 12 -20 q-6 -6 -4 -14 Z"
      fill="#92CDE1"
      opacity="0.7"
    />
    <path
      d="M46 20 q14 -2 16 14 q-2 12 -12 14 q10 4 8 18 q-2 12 -14 12"
      fill="none"
      stroke="#5C93A8"
      strokeWidth="1.4"
      opacity="0.6"
    />
    <circle cx="52" cy="26" r="1.8" fill="#3F6474" />
    <path d="M60 22 q6 -4 8 2" stroke="#C9A96E" strokeWidth="2" fill="none" opacity="0.7" strokeLinecap="round" />
  </g>
);

const pawPrint = (
  <g fill="#B08968" opacity="0.8">
    <ellipse cx="50" cy="62" rx="15" ry="12" />
    <ellipse cx="34" cy="42" rx="6.5" ry="9" transform="rotate(-18 34 42)" />
    <ellipse cx="45" cy="34" rx="6.5" ry="9.5" transform="rotate(-6 45 34)" />
    <ellipse cx="56" cy="34" rx="6.5" ry="9.5" transform="rotate(6 56 34)" />
    <ellipse cx="67" cy="42" rx="6.5" ry="9" transform="rotate(18 67 42)" />
  </g>
);

const dog = (
  <g>
    <ellipse cx="50" cy="86" rx="24" ry="4" fill="#C9A96E" opacity="0.14" />
    <ellipse cx="50" cy="52" rx="20" ry="18" fill="#E4C9A8" opacity="0.85" />
    <path d="M30 40 q-8 -2 -8 14 q0 12 10 10 Z" fill="#C9A47E" opacity="0.85" />
    <path d="M70 40 q8 -2 8 14 q0 12 -10 10 Z" fill="#C9A47E" opacity="0.85" />
    <ellipse cx="50" cy="60" rx="10" ry="8" fill="#F3E4CE" opacity="0.9" />
    <ellipse cx="50" cy="58" rx="3.4" ry="2.6" fill="#5A4632" />
    <circle cx="43" cy="48" r="2.2" fill="#5A4632" />
    <circle cx="57" cy="48" r="2.2" fill="#5A4632" />
    <path d="M50 61 q0 5 -4 6 M50 61 q0 5 4 6" stroke="#5A4632" strokeWidth="1.2" fill="none" opacity="0.7" />
  </g>
);

// ───── The library ───────────────────────────────────────────────────

// Hand-authored vector fallbacks — kept so the studio still works for subjects
// the generated library hasn't covered yet.
const LEGACY_ILLUSTRATIONS: Illustration[] = [
  {id: "floral/hydrangea", subject: "Hydrangea", niche: "Floral", tags: ["blue", "flower", "garden"], art: hydrangea},
  {id: "floral/peony", subject: "Peony", niche: "Floral", tags: ["pink", "flower", "bloom"], art: peony},
  {id: "floral/rose", subject: "Rose", niche: "Floral", tags: ["flower", "romance"], art: rose},
  {id: "floral/magnolia", subject: "Magnolia", niche: "Floral", tags: ["flower", "southern"], art: magnolia},
  {id: "botanical/eucalyptus", subject: "Eucalyptus", niche: "Botanical", tags: ["greenery", "sprig", "leaves"], art: eucalyptus},
  {id: "botanical/laurel", subject: "Laurel Wreath", niche: "Botanical", tags: ["wreath", "monogram", "crest"], art: laurel},
  {id: "sports/pickleball", subject: "Pickleball", niche: "Sports", tags: ["paddle", "racquet", "court"], art: pickleball},
  {id: "sports/tennis", subject: "Tennis", niche: "Sports", tags: ["racquet", "court", "ball"], art: tennis},
  {id: "sports/golf", subject: "Golf", niche: "Sports", tags: ["clubs", "course", "ball"], art: golf},
  {id: "coastal/sailboat", subject: "Sailboat", niche: "Coastal", tags: ["nautical", "sea", "boat"], art: sailboat},
  {id: "coastal/anchor", subject: "Anchor", niche: "Coastal", tags: ["nautical", "sea"], art: anchor},
  {id: "coastal/seahorse", subject: "Seahorse", niche: "Coastal", tags: ["nautical", "sea", "ocean"], art: seahorse},
  {id: "pets/paw-print", subject: "Paw Print", niche: "Pets", tags: ["dog", "cat", "animal"], art: pawPrint},
  {id: "pets/dog", subject: "Dog", niche: "Pets", tags: ["puppy", "animal", "breed"], art: dog},
];

// The live library: real generated art (published from the Winsome Illustration
// Library) first, then any legacy fallbacks whose subject isn't yet generated.
export const ILLUSTRATIONS: Illustration[] = [
  ...FEED_ILLUSTRATIONS,
  ...LEGACY_ILLUSTRATIONS.filter(
    (l) => !FEED_ILLUSTRATIONS.some((f) => f.id === l.id),
  ),
];

export function getIllustration(id: string | null): Illustration | undefined {
  if (!id) return undefined;
  return ILLUSTRATIONS.find((x) => x.id === id);
}

/** Filter by niche + free-text query (subject, niche, tags). */
export function searchIllustrations(niche: string, query: string): Illustration[] {
  const q = query.trim().toLowerCase();
  return ILLUSTRATIONS.filter((x) => {
    if (niche !== "All" && x.niche !== niche) return false;
    if (!q) return true;
    return (
      x.subject.toLowerCase().includes(q) ||
      x.niche.toLowerCase().includes(q) ||
      x.tags.some((t) => t.includes(q))
    );
  });
}

/**
 * Render an illustration into SVG coordinate space, centered at (x, y) at the
 * given box size. Prefers a real generated asset for the chosen style; falls
 * back to hand-authored vector art.
 */
export function IllustrationArt({
  illustration,
  style,
  x,
  y,
  size,
}: {
  illustration: Illustration;
  style: IllustrationStyleKey;
  x: number;
  y: number;
  size: number;
}) {
  const asset = illustration.assets?.[style];
  if (asset) {
    return (
      <image
        href={asset}
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }
  if (!illustration.art) return null;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 100})`}>
      {illustration.art}
    </g>
  );
}

/** Standalone thumbnail for the browser grid. */
export function IllustrationThumb({illustration}: {illustration: Illustration}) {
  const asset =
    illustration.assets?.watercolor ??
    illustration.assets?.["modern-graphic"] ??
    illustration.assets?.["heritage-sketch"];
  if (asset) {
    return (
      <img
        src={asset}
        alt={illustration.subject}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label={illustration.subject}>
      {illustration.art}
    </svg>
  );
}
