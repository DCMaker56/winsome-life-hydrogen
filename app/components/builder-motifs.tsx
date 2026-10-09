/*
 * Watercolor motif SVGs used in the ProductBuilderPreview canvases.
 * Hand-tuned to feel like The Winsome Life's signature aesthetic:
 * soft peach/pink peonies, blue hydrangeas, green foliage, gold accents.
 */
import type { SVGProps } from "react";

/** Peony cluster — anchor/center focal motif. */
export function PeonySprig(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" {...props}>
      {/* Leaves */}
      <path
        d="M15 70 Q20 55 35 55 Q30 70 15 70 Z"
        fill="#9CB89A"
        opacity="0.55"
      />
      <path
        d="M75 75 Q70 60 85 55 Q90 72 75 75 Z"
        fill="#8AAA88"
        opacity="0.5"
      />
      <path
        d="M50 82 Q42 90 35 85 Q45 78 50 82 Z"
        fill="#A2C0A0"
        opacity="0.45"
      />

      {/* Peony outer petals */}
      <ellipse cx="50" cy="48" rx="26" ry="22" fill="#F4D3D6" opacity="0.7" />
      <ellipse cx="44" cy="44" rx="20" ry="17" fill="#ECB9BF" opacity="0.75" />

      {/* Peony middle */}
      <ellipse cx="50" cy="48" rx="15" ry="13" fill="#E3A4AB" opacity="0.8" />
      <ellipse cx="52" cy="45" rx="10" ry="9" fill="#D48A94" opacity="0.75" />

      {/* Peony center */}
      <ellipse cx="51" cy="48" rx="5" ry="4.5" fill="#BE6E79" opacity="0.8" />
      <circle cx="51" cy="48" r="2" fill="#F2D79C" opacity="0.9" />

      {/* Subtle watercolor bleed */}
      <ellipse cx="50" cy="48" rx="30" ry="25" fill="#F4D3D6" opacity="0.15" />
    </svg>
  );
}

/** Blue hydrangea cluster — small, good for corners. */
export function HydrangeaSprig(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" {...props}>
      {/* Leaves */}
      <path
        d="M20 75 Q25 60 42 62 Q38 78 20 75 Z"
        fill="#9CB89A"
        opacity="0.55"
      />
      <path
        d="M78 70 Q74 56 60 62 Q68 78 78 70 Z"
        fill="#8AAA88"
        opacity="0.5"
      />

      {/* Four-petal hydrangea florets */}
      {[
        [45, 35],
        [60, 38],
        [52, 48],
        [38, 45],
        [55, 28],
        [68, 48],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          <path
            d="M0 -5 L3 0 L0 5 L-3 0 Z M-5 0 L0 -3 L5 0 L0 3 Z"
            fill={i % 2 ? "#B8D0E5" : "#A8C3DC"}
            opacity="0.75"
          />
          <circle cx="0" cy="0" r="1" fill="#E8B4B8" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

/** Laurel wreath — ring of olive-like leaves. */
export function LaurelWreath({ stroke = "#C9A96E", ...props }: SVGProps<SVGSVGElement> & { stroke?: string }) {
  return (
    <svg viewBox="0 0 120 120" {...props}>
      {[...Array(16)].map((_, i) => {
        const angle = (i * 360) / 16;
        return (
          <g key={i} transform={`rotate(${angle} 60 60)`}>
            <ellipse
              cx="60"
              cy="8"
              rx="3.5"
              ry="7"
              fill={stroke}
              opacity="0.28"
              transform="rotate(10 60 15)"
            />
          </g>
        );
      })}
      {[...Array(16)].map((_, i) => {
        const angle = (i * 360) / 16 + 11.25;
        return (
          <g key={i + 100} transform={`rotate(${angle} 60 60)`}>
            <ellipse
              cx="60"
              cy="12"
              rx="2.5"
              ry="5"
              fill={stroke}
              opacity="0.22"
              transform="rotate(-10 60 17)"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Single trailing stem with small leaves — corner ornament. */
export function StemAccent(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" {...props}>
      <path
        d="M20 80 Q35 50 60 30 Q80 20 92 15"
        stroke="#8AAA88"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      {[
        [30, 60, 15],
        [45, 45, -20],
        [62, 33, 25],
        [78, 22, -15],
      ].map(([x, y, rot], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="3"
          ry="6"
          fill="#9CB89A"
          opacity="0.55"
          transform={`rotate(${rot} ${x} ${y})`}
        />
      ))}
    </svg>
  );
}

/** Gold twine cord — looped through a hole at the top. */
export function GoldTwine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 60" {...props}>
      {/* Main cord */}
      <path
        d="M5 5 Q30 35 60 20 Q90 5 115 10"
        stroke="#C9A96E"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Twist detail */}
      <path
        d="M5 5 Q30 35 60 20 Q90 5 115 10"
        stroke="#E8D2A8"
        strokeWidth="0.5"
        fill="none"
        strokeDasharray="1,2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Knot where it loops through hole */}
      <circle cx="60" cy="22" r="2.5" fill="#C9A96E" />
      <circle cx="60" cy="22" r="1.5" fill="#8A7355" opacity="0.6" />
    </svg>
  );
}

/** Paper grain texture overlay — applied above any paper-colored background. */
export function PaperTexture(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="none" {...props}>
      <defs>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.80  0 0 0 0 0.70  0 0 0 0.06 0" />
        </filter>
      </defs>
      <rect width="200" height="200" filter="url(#paper-grain)" />
    </svg>
  );
}
