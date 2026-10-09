/*
 * ProductBuilderPreview v3 — a world-class realistic live preview.
 *
 * Architecture:
 *   1. Neutral backdrop (no distracting gradient)
 *   2. Stack shadow paper (slightly rotated, behind)
 *   3. Main paper card with:
 *        - Realistic cream cotton color
 *        - SVG fractal-noise grain overlay (real paper fiber)
 *        - Inset edge shadow (suggests paper thickness)
 *        - Subtle drop shadow for lift
 *   4. Motif layer (watercolor florals positioned ON the paper)
 *   5. Personalization layer (top-header name or center monogram)
 *
 * Every product type uses the same `<PaperCard>` primitive with a
 * product-specific content slot. Styles are rendered via a clear
 * switch in <MonogramArt> — each variant is visually distinctive.
 *
 * Renders at 60fps — no debouncing, state updates are cheap.
 */
import { cn } from "@/lib/utils";
import type { ProductType } from "@/lib/variants";
import { FONTS, INK_COLORS, MONOGRAM_STYLES } from "@/lib/variants";
import type { PersonalizationValue } from "./PersonalizationPanel";
import {
  PeonySprig,
  HydrangeaSprig,
  StemAccent,
  GoldTwine,
} from "./builder-motifs";

interface ProductBuilderPreviewProps {
  productType: ProductType;
  personalization: PersonalizationValue;
  variantSelections: Record<string, string>;
  className?: string;
}

const PAPER_COLOR = "#FBF5E7"; // warm cream, matches premium cotton paper
const PAPER_IVORY = "#F5EDD9";

export function ProductBuilderPreview({
  productType,
  personalization,
  variantSelections,
  className,
}: ProductBuilderPreviewProps) {
  const font = FONTS.find((f) => f.key === personalization.fontKey) ?? FONTS[0];
  const ink = INK_COLORS.find((c) => c.key === personalization.inkKey) ?? INK_COLORS[0];
  const monogramStyle = MONOGRAM_STYLES.find(
    (s) => s.key === personalization.monogramStyleKey,
  );
  const fields = personalization.fields ?? {};
  const personalizationMode = (personalization as { mode?: string }).mode ?? "name";

  // Letters for display — clamp to the chosen style's letterCount
  const rawLetters = (fields["monogram-letters"] ?? "").trim().toUpperCase();
  const effectiveLetters =
    rawLetters.slice(0, monogramStyle?.letterCount ?? 3) ||
    (monogramStyle
      ? ["A", "AB", "ABC"][(monogramStyle.letterCount ?? 3) - 1]
      : "");

  const textContent = fields["text"]?.trim() || "Amelia";

  // Stable re-render key — when monogram style changes, force a fresh render
  const renderKey = `${productType}-${personalization.monogramStyleKey ?? "none"}-${personalization.fontKey}-${personalization.inkKey}-${personalizationMode}`;

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[500px] flex flex-col items-center justify-center overflow-hidden px-4 py-10",
        className,
      )}
      aria-label="Live preview of your personalization"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #EEE7D1 0%, #D9CFB2 100%)",
      }}
    >
      {/* Paper texture SVG filter — subtle cotton paper fiber grain */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id="paper-fiber" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              seed="5"
              stitchTiles="stitch"
            />
            <feColorMatrix values="0 0 0 0 0.66  0 0 0 0 0.58  0 0 0 0 0.44  0 0 0 0.08 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* Subtle backdrop shadow under the product for extra depth */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "55%",
          height: "8%",
          background: "radial-gradient(ellipse at center, rgba(67,50,25,0.18) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
        aria-hidden
      />

      {/* Live preview eyebrow */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#8A7355] font-sans font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
        Live Preview
      </div>

      {/* Product canvas */}
      <div
        key={renderKey}
        className="relative z-10 transition-opacity duration-200"
      >
        {productType === "wine-tag" && (
          <WineTagCanvas
            fields={fields}
            theme={variantSelections["theme"] ?? "many-thanks"}
            length={variantSelections["length"] ?? "long"}
            font={font}
            ink={ink}
          />
        )}
        {productType === "notecard" && (
          <NotecardCanvas
            text={textContent}
            letters={effectiveLetters}
            monogramStyleKey={monogramStyle?.key}
            isMonogramMode={personalizationMode === "monogram"}
            cardSize={variantSelections["card-size"] ?? "A2"}
            font={font}
            ink={ink}
          />
        )}
        {productType === "notepad" && (
          <NotepadCanvas
            text={textContent}
            letters={effectiveLetters}
            monogramStyleKey={monogramStyle?.key}
            isMonogramMode={personalizationMode === "monogram"}
            size={variantSelections["notepad-size"] ?? "small"}
            font={font}
            ink={ink}
          />
        )}
        {productType === "gift-tag" && (
          <GiftTagCanvas
            fromText={fields["text"]?.trim() || "The Winsomes"}
            letters={effectiveLetters}
            monogramStyleKey={monogramStyle?.key}
            isMonogramMode={personalizationMode === "monogram"}
            format={variantSelections["format"] ?? "tag"}
            font={font}
            ink={ink}
          />
        )}
        {productType === "artwork" && (
          <ArtworkCanvas
            dedication={fields["text"]?.trim() || ""}
            size={variantSelections["print-size"] ?? "8x10"}
            font={font}
            ink={ink}
          />
        )}
        {productType === "calendar" && (
          <CalendarCanvas
            coverName={fields["text"]?.trim() || "The Winsome Family"}
            letters={effectiveLetters}
            isMonogramMode={personalizationMode === "monogram"}
            style={variantSelections["calendar-style"] ?? "with-stand"}
            font={font}
            ink={ink}
          />
        )}
      </div>

      <p className="absolute bottom-3 left-0 right-0 text-center font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60">
        Updates instantly as you customize
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   PaperCard — the universal paper primitive
// ═══════════════════════════════════════════════════════════════════

interface PaperCardProps {
  width: number;
  height: number;
  children: React.ReactNode;
  rotation?: number;
  rounded?: string;
  withStack?: boolean; // render a stack-shadow paper behind
  color?: string;
}

function PaperCard({
  width,
  height,
  children,
  rotation = 0,
  rounded = "2px",
  withStack = false,
  color = PAPER_COLOR,
}: PaperCardProps) {
  return (
    <div className="relative" style={{ width, height }}>
      {/* Stack shadow papers behind */}
      {withStack && (
        <>
          <div
            className="absolute"
            style={{
              inset: 0,
              top: 14,
              left: 16,
              backgroundColor: PAPER_IVORY,
              borderRadius: rounded,
              boxShadow: "0 4px 12px rgba(93,75,50,0.12)",
              transform: "rotate(3deg)",
              opacity: 0.6,
            }}
          />
          <div
            className="absolute"
            style={{
              inset: 0,
              top: 6,
              left: 7,
              backgroundColor: color,
              borderRadius: rounded,
              boxShadow: "0 3px 10px rgba(93,75,50,0.14)",
              transform: "rotate(1.5deg)",
              opacity: 0.85,
            }}
          />
        </>
      )}

      {/* Main paper */}
      <div
        className="absolute"
        style={{
          inset: 0,
          width,
          height,
          backgroundColor: color,
          borderRadius: rounded,
          transform: `rotate(${rotation}deg)`,
          boxShadow:
            "0 1px 2px rgba(93,75,50,0.06), 0 18px 36px rgba(93,75,50,0.18), inset 0 0 0 1px rgba(201,169,110,0.1), inset 0 -1px 3px rgba(93,75,50,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Paper grain texture — real fractal noise */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-60"
          aria-hidden
        >
          <rect width="100%" height="100%" filter="url(#paper-fiber)" />
        </svg>

        {/* Subtle inner vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(93,75,50,0.07) 100%)",
          }}
          aria-hidden
        />

        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   MonogramArt — crisp, distinctly different visual variants
// ═══════════════════════════════════════════════════════════════════

interface MonogramArtProps {
  letters: string;
  styleKey?: string;
  font: { fontFamily: string };
  ink: { hex: string };
  /** Target size for the monogram (width in px). Element scales to fit. */
  size?: number;
}

function MonogramArt({ letters, styleKey, font, ink, size = 120 }: MonogramArtProps) {
  const letterStyle: React.CSSProperties = {
    fontFamily: font.fontFamily,
    color: ink.hex,
  };

  // Size tokens based on target `size`
  const big = Math.round(size * 0.55);
  const mid = Math.round(size * 0.34);

  switch (styleKey) {
    case "single-letter":
      return (
        <div
          className="relative flex flex-col items-center"
          style={{ width: size }}
        >
          <div style={{ ...letterStyle, fontSize: big, lineHeight: 1 }}>
            {letters[0] ?? "A"}
          </div>
          <div
            className="mt-2"
            style={{ width: size * 0.35, height: 1, backgroundColor: ink.hex, opacity: 0.45 }}
          />
        </div>
      );

    case "two-letter-stacked":
      return (
        <div
          className="relative flex flex-col items-center leading-[0.85]"
          style={{ ...letterStyle, width: size, fontSize: big }}
        >
          <div>{letters[0] ?? "A"}</div>
          <div>{letters[1] ?? "B"}</div>
        </div>
      );

    case "interlocking": {
      const a = letters[0] ?? "A";
      const b = letters[1] ?? "B";
      return (
        <div
          className="relative flex items-center"
          style={{ ...letterStyle, fontSize: big, width: size }}
        >
          <span style={{ opacity: 0.95, letterSpacing: "-0.3em" }}>{a}</span>
          <span style={{ opacity: 0.75, marginLeft: -big * 0.15 }}>{b}</span>
        </div>
      );
    }

    case "three-letter-classic": {
      // Traditional FLM: flanking letters 60% of center letter, sitting on same baseline
      const [a, b, c] = [letters[0] ?? "A", letters[1] ?? "B", letters[2] ?? "C"];
      const center = Math.round(size * 0.48);
      const flank = Math.round(size * 0.28);
      return (
        <div
          className="relative flex items-baseline justify-center"
          style={{ ...letterStyle, gap: size * 0.015 }}
        >
          <span style={{ fontSize: flank, lineHeight: 1 }}>{a}</span>
          <span style={{ fontSize: center, lineHeight: 1 }}>{b}</span>
          <span style={{ fontSize: flank, lineHeight: 1 }}>{c}</span>
        </div>
      );
    }

    case "three-letter-oval":
    case "three-letter-circle":
    case "three-letter-diamond": {
      // Shape dimensions designed to COMFORTABLY contain 3 letters with padding.
      const flankFs = Math.round(size * 0.22);
      const centerFs = Math.round(size * 0.34);
      const letters3 = [letters[0] ?? "A", letters[1] ?? "B", letters[2] ?? "C"];

      if (styleKey === "three-letter-oval") {
        // Oval: wider than tall — letters sit inside horizontally
        const shapeW = size * 1.3;
        const shapeH = size * 0.7;
        return (
          <div
            className="relative flex items-center justify-center"
            style={{ width: shapeW, height: shapeH }}
          >
            <div
              className="absolute rounded-[50%]"
              style={{
                width: shapeW,
                height: shapeH,
                border: `1.5px solid ${ink.hex}`,
                opacity: 0.55,
              }}
            />
            <div
              className="relative flex items-baseline z-10"
              style={{ ...letterStyle, gap: size * 0.01 }}
            >
              <span style={{ fontSize: flankFs, lineHeight: 1 }}>{letters3[0]}</span>
              <span style={{ fontSize: centerFs, lineHeight: 1 }}>{letters3[1]}</span>
              <span style={{ fontSize: flankFs, lineHeight: 1 }}>{letters3[2]}</span>
            </div>
          </div>
        );
      }

      if (styleKey === "three-letter-circle") {
        const shape = size * 1.15;
        return (
          <div
            className="relative flex items-center justify-center"
            style={{ width: shape, height: shape }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: shape,
                height: shape,
                border: `1.5px solid ${ink.hex}`,
                opacity: 0.55,
              }}
            />
            <div
              className="relative flex items-baseline z-10"
              style={{ ...letterStyle, gap: size * 0.01 }}
            >
              <span style={{ fontSize: flankFs, lineHeight: 1 }}>{letters3[0]}</span>
              <span style={{ fontSize: centerFs, lineHeight: 1 }}>{letters3[1]}</span>
              <span style={{ fontSize: flankFs, lineHeight: 1 }}>{letters3[2]}</span>
            </div>
          </div>
        );
      }

      // Diamond: rotated square — letters sit in the horizontal middle
      const diamondSize = size * 1.05;
      return (
        <div
          className="relative flex items-center justify-center"
          style={{ width: diamondSize * 1.4, height: diamondSize * 1.4 }}
        >
          <div
            className="absolute"
            style={{
              width: diamondSize,
              height: diamondSize,
              border: `1.5px solid ${ink.hex}`,
              opacity: 0.55,
              transform: "rotate(45deg)",
            }}
          />
          <div
            className="relative flex items-baseline z-10"
            style={{ ...letterStyle, gap: size * 0.01 }}
          >
            <span style={{ fontSize: flankFs, lineHeight: 1 }}>{letters3[0]}</span>
            <span style={{ fontSize: centerFs, lineHeight: 1 }}>{letters3[1]}</span>
            <span style={{ fontSize: flankFs, lineHeight: 1 }}>{letters3[2]}</span>
          </div>
        </div>
      );
    }

    case "wreath": {
      // Laurel wreath — two curving branches meeting at top + bottom
      const wreathSize = size * 1.15;
      return (
        <div
          className="relative flex items-center justify-center"
          style={{ width: wreathSize, height: wreathSize }}
        >
          <svg
            className="absolute inset-0"
            viewBox="0 0 120 120"
            aria-hidden
          >
            {/* Left branch — stem */}
            <path
              d="M 60 14 Q 20 25 20 60 Q 20 95 60 106"
              stroke={ink.hex}
              strokeWidth="0.6"
              fill="none"
              opacity="0.45"
            />
            {/* Right branch — stem */}
            <path
              d="M 60 14 Q 100 25 100 60 Q 100 95 60 106"
              stroke={ink.hex}
              strokeWidth="0.6"
              fill="none"
              opacity="0.45"
            />
            {/* Left leaves — angled outward */}
            {[
              { x: 25, y: 30, rot: -40 },
              { x: 21, y: 45, rot: -60 },
              { x: 20, y: 62, rot: -90 },
              { x: 22, y: 78, rot: -120 },
              { x: 30, y: 92, rot: -150 },
            ].map((l, i) => (
              <ellipse
                key={`l${i}`}
                cx={l.x}
                cy={l.y}
                rx="3.5"
                ry="7"
                fill={ink.hex}
                opacity="0.55"
                transform={`rotate(${l.rot} ${l.x} ${l.y})`}
              />
            ))}
            {/* Right leaves — angled outward */}
            {[
              { x: 95, y: 30, rot: 40 },
              { x: 99, y: 45, rot: 60 },
              { x: 100, y: 62, rot: 90 },
              { x: 98, y: 78, rot: 120 },
              { x: 90, y: 92, rot: 150 },
            ].map((l, i) => (
              <ellipse
                key={`r${i}`}
                cx={l.x}
                cy={l.y}
                rx="3.5"
                ry="7"
                fill={ink.hex}
                opacity="0.55"
                transform={`rotate(${l.rot} ${l.x} ${l.y})`}
              />
            ))}
            {/* Top bow knot */}
            <circle cx="60" cy="12" r="1.8" fill={ink.hex} opacity="0.6" />
            {/* Bottom ribbon tails */}
            <path
              d="M 54 106 Q 56 112 52 118 M 66 106 Q 64 112 68 118"
              stroke={ink.hex}
              strokeWidth="0.5"
              fill="none"
              opacity="0.45"
            />
          </svg>
          <div
            className="relative z-10"
            style={{ ...letterStyle, fontSize: Math.round(size * 0.48), lineHeight: 1 }}
          >
            {letters[0] ?? "A"}
          </div>
        </div>
      );
    }

    case "vine":
      return (
        <div
          className="relative flex flex-col items-center"
          style={{ width: size }}
        >
          <div style={{ ...letterStyle, fontSize: big, lineHeight: 1 }}>
            {letters[0] ?? "A"}
          </div>
          <svg
            viewBox="0 0 100 22"
            style={{ width: size * 0.8, height: size * 0.18, marginTop: 2 }}
            aria-hidden
          >
            <path
              d="M 8 11 Q 25 4 50 11 Q 75 18 92 6"
              stroke={ink.hex}
              strokeWidth="0.8"
              fill="none"
              opacity="0.65"
              strokeLinecap="round"
            />
            <ellipse
              cx="28"
              cy="8"
              rx="2.5"
              ry="4"
              fill={ink.hex}
              opacity="0.5"
              transform="rotate(-25 28 8)"
            />
            <ellipse
              cx="50"
              cy="12"
              rx="2.5"
              ry="4"
              fill={ink.hex}
              opacity="0.5"
            />
            <ellipse
              cx="72"
              cy="11"
              rx="2.5"
              ry="4"
              fill={ink.hex}
              opacity="0.5"
              transform="rotate(25 72 11)"
            />
          </svg>
        </div>
      );

    case "scallop":
      return (
        <div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <svg
            className="absolute inset-0"
            viewBox="0 0 100 100"
            aria-hidden
          >
            {[...Array(14)].map((_, i) => {
              const angle = (i * 360) / 14;
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + 40 * Math.cos(rad);
              const cy = 50 + 40 * Math.sin(rad);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="none"
                  stroke={ink.hex}
                  strokeWidth="0.8"
                  opacity="0.45"
                />
              );
            })}
          </svg>
          <div
            className="relative z-10"
            style={{ ...letterStyle, fontSize: big * 0.85, lineHeight: 1 }}
          >
            {letters[0] ?? "A"}
          </div>
        </div>
      );

    case "modern-block":
      return (
        <div
          className="relative flex items-center justify-center"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            backgroundColor: ink.hex,
          }}
        >
          <div
            style={{
              fontFamily: font.fontFamily,
              fontSize: big * 0.9,
              color: PAPER_COLOR,
              letterSpacing: "-0.04em",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {letters[0] ?? "A"}
          </div>
        </div>
      );

    case "floral-crest":
      return (
        <div
          className="relative flex flex-col items-center"
          style={{ width: size }}
        >
          <div style={{ ...letterStyle, fontSize: big, lineHeight: 1 }}>
            {letters[0] ?? "A"}
          </div>
          <PeonySprig
            style={{ width: size * 0.55, height: size * 0.3, marginTop: 4, opacity: 0.8 }}
            aria-hidden
          />
        </div>
      );

    default:
      return (
        <div style={{ ...letterStyle, fontSize: big, lineHeight: 1 }}>
          {letters || "A"}
        </div>
      );
  }
}

// ═══════════════════════════════════════════════════════════════════
//   Notecard — realistic A2/A7 flat card with name at top, writing space below
// ═══════════════════════════════════════════════════════════════════

function NotecardCanvas({
  text,
  letters,
  monogramStyleKey,
  isMonogramMode,
  cardSize,
  font,
  ink,
}: {
  text: string;
  letters: string;
  monogramStyleKey?: string;
  isMonogramMode: boolean;
  cardSize: string;
  font: { fontFamily: string };
  ink: { hex: string };
}) {
  const isA7 = cardSize === "A7";
  // Real proportions: A2 is 4.25:5.5 ≈ 0.77, A7 is 5:7 ≈ 0.71
  const cardW = isA7 ? 380 : 370;
  const cardH = isA7 ? 540 : 480;

  return (
    <div className="flex flex-col items-center">
      <PaperCard width={cardW} height={cardH} rotation={-0.5} rounded="2px" withStack>
        {/* Inner matte border */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 18,
            border: `1px solid ${ink.hex}`,
            opacity: 0.12,
          }}
          aria-hidden
        />

        {/* Florals — inside the inner matte, as if printed */}
        <HydrangeaSprig
          className="absolute"
          style={{ top: 12, left: 12, width: 80, height: 80, opacity: 0.85 }}
          aria-hidden
        />
        <StemAccent
          className="absolute"
          style={{ top: 20, right: 16, width: 56, height: 56, opacity: 0.65 }}
          aria-hidden
        />
        <PeonySprig
          className="absolute"
          style={{ bottom: 10, right: 10, width: 110, height: 110, opacity: 0.9 }}
          aria-hidden
        />

        {/* Personalization — positioned at the UPPER-MIDDLE, like real stationery */}
        <div
          className="absolute left-0 right-0 flex flex-col items-center"
          style={{ top: cardH * 0.22 }}
        >
          {isMonogramMode ? (
            <MonogramArt
              letters={letters}
              styleKey={monogramStyleKey}
              font={font}
              ink={ink}
              size={cardW * 0.45}
            />
          ) : (
            <>
              <div
                style={{
                  fontFamily: font.fontFamily,
                  color: ink.hex,
                  fontSize: 22,
                  lineHeight: 1.1,
                  letterSpacing: "0.02em",
                }}
              >
                {text}
              </div>
              <div
                className="mt-2"
                style={{
                  width: 40,
                  height: 1,
                  backgroundColor: ink.hex,
                  opacity: 0.35,
                }}
              />
            </>
          )}
        </div>
      </PaperCard>
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
        {isA7 ? 'A7 · 5" × 7" Flat Card' : 'A2 · 4.25" × 5.5" Flat Card'}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   Notepad — stacked pages, name header, ruled lines
// ═══════════════════════════════════════════════════════════════════

function NotepadCanvas({
  text,
  letters,
  monogramStyleKey,
  isMonogramMode,
  size,
  font,
  ink,
}: {
  text: string;
  letters: string;
  monogramStyleKey?: string;
  isMonogramMode: boolean;
  size: string;
  font: { fontFamily: string };
  ink: { hex: string };
}) {
  const dims = {
    small: { w: 300, h: 400, lines: 10, label: '4.25" × 5.5" Notepad' },
    "5x7": { w: 340, h: 480, lines: 12, label: '5" × 7" Notepad' },
    large: { w: 380, h: 520, lines: 14, label: '8.5" × 11" Notepad' },
  } as const;
  const d = dims[size as keyof typeof dims] ?? dims.small;

  return (
    <div className="flex flex-col items-center">
      <PaperCard width={d.w} height={d.h} rounded="1px" withStack>
        {/* Florals at top */}
        <StemAccent
          className="absolute"
          style={{ top: 8, left: 10, width: 60, height: 60, opacity: 0.7 }}
          aria-hidden
        />
        <PeonySprig
          className="absolute"
          style={{ top: 4, right: 4, width: 80, height: 80, opacity: 0.85 }}
          aria-hidden
        />

        {/* Header area: name/monogram */}
        <div
          className="absolute left-0 right-0 flex flex-col items-center"
          style={{ top: d.h * 0.1 }}
        >
          {isMonogramMode ? (
            <MonogramArt
              letters={letters}
              styleKey={monogramStyleKey}
              font={font}
              ink={ink}
              size={d.w * 0.26}
            />
          ) : (
            <div
              style={{
                fontFamily: font.fontFamily,
                color: ink.hex,
                fontSize: 20,
                lineHeight: 1.1,
              }}
            >
              {text}
            </div>
          )}
          <div
            className="mt-3"
            style={{
              width: d.w * 0.15,
              height: 1,
              backgroundColor: ink.hex,
              opacity: 0.3,
            }}
          />
        </div>

        {/* Ruled lines */}
        <div
          className="absolute left-0 right-0 px-8 flex flex-col justify-evenly"
          style={{ top: d.h * 0.32, bottom: 30 }}
        >
          {[...Array(d.lines)].map((_, i) => (
            <div key={i} className="h-px bg-[#C9A96E]/12" />
          ))}
        </div>
      </PaperCard>
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
        {d.label}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   Wine Tag — hanging tag with twine, sentiment + host name
// ═══════════════════════════════════════════════════════════════════

function WineTagCanvas({
  fields,
  theme,
  length,
  font,
  ink,
}: {
  fields: Record<string, string>;
  theme: string;
  length: string;
  font: { fontFamily: string };
  ink: { hex: string };
}) {
  const themeText: Record<string, string> = {
    "many-thanks": "Many Thanks",
    cheers: "Cheers to You",
    "toast-host": "A Toast to the Host",
    custom: fields["custom-message"]?.trim() || "For the Thompsons",
  };
  const hostName = fields["text"]?.trim() || "";
  const front = themeText[theme] ?? themeText["many-thanks"];
  const isShort = length === "short";
  const tagW = 220;
  const tagH = isShort ? 320 : 480;

  return (
    <div className="flex flex-col items-center relative">
      <GoldTwine
        className="absolute z-20"
        style={{ top: -22, width: tagW + 100, height: 60 }}
        aria-hidden
      />
      <PaperCard width={tagW} height={tagH} rotation={-2} rounded="4px 4px 8px 8px">
        {/* Hole */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: 14,
            width: 16,
            height: 16,
            background: "#E0CFA8",
            boxShadow: "inset 0 1px 2px rgba(93,75,50,0.4)",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              inset: 3,
              background: "#E8DEC4",
            }}
          />
        </div>

        {/* Florals */}
        <PeonySprig
          className="absolute"
          style={{ bottom: -4, left: -8, width: 90, height: 90, opacity: 0.9 }}
          aria-hidden
        />
        <HydrangeaSprig
          className="absolute"
          style={{ top: 42, right: -6, width: 60, height: 60, opacity: 0.75 }}
          aria-hidden
        />

        {/* Front text */}
        <div
          className="absolute left-0 right-0 text-center"
          style={{ top: tagH * 0.38 }}
        >
          <div
            style={{
              fontFamily: font.fontFamily,
              color: ink.hex,
              fontSize: isShort ? 18 : 22,
              lineHeight: 1.2,
              padding: "0 20px",
            }}
          >
            {front}
          </div>
        </div>

        {/* Host name (back of tag) */}
        {hostName && (
          <div
            className="absolute left-0 right-0 text-center"
            style={{ bottom: 28 }}
          >
            <div
              style={{
                width: 30,
                height: 1,
                backgroundColor: ink.hex,
                opacity: 0.3,
                margin: "0 auto 8px",
              }}
            />
            <div
              style={{
                fontFamily: font.fontFamily,
                color: ink.hex,
                fontSize: 13,
                opacity: 0.7,
                letterSpacing: "0.05em",
              }}
            >
              {hostName}
            </div>
          </div>
        )}
      </PaperCard>
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
        {isShort ? 'Mini · 3" × 5.5"' : 'Full · 3" × 9"'}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   Gift Tag / Sticker
// ═══════════════════════════════════════════════════════════════════

function GiftTagCanvas({
  fromText,
  letters,
  monogramStyleKey,
  isMonogramMode,
  format,
  font,
  ink,
}: {
  fromText: string;
  letters: string;
  monogramStyleKey?: string;
  isMonogramMode: boolean;
  format: string;
  font: { fontFamily: string };
  ink: { hex: string };
}) {
  const isSticker = format === "sticker";

  if (isSticker) {
    const size = 250;
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: size,
            height: size,
            backgroundColor: PAPER_COLOR,
            boxShadow:
              "0 1px 2px rgba(93,75,50,0.08), 0 18px 36px rgba(93,75,50,0.22), inset 0 0 0 1px rgba(201,169,110,0.18)",
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-60" aria-hidden>
            <rect width="100%" height="100%" filter="url(#paper-fiber)" />
          </svg>
          <PeonySprig
            className="absolute"
            style={{ top: 8, right: 8, width: 48, height: 48, opacity: 0.8 }}
            aria-hidden
          />
          <HydrangeaSprig
            className="absolute"
            style={{ bottom: 8, left: 8, width: 44, height: 44, opacity: 0.7 }}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            {isMonogramMode ? (
              <MonogramArt
                letters={letters}
                styleKey={monogramStyleKey}
                font={font}
                ink={ink}
                size={100}
              />
            ) : (
              <div>
                <div
                  style={{
                    fontFamily: font.fontFamily,
                    color: ink.hex,
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    opacity: 0.55,
                    marginBottom: 4,
                  }}
                >
                  a gift from
                </div>
                <div
                  style={{
                    fontFamily: font.fontFamily,
                    color: ink.hex,
                    fontSize: 18,
                    lineHeight: 1.1,
                  }}
                >
                  {fromText}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
          Sticker · 2.75" × 2.75"
        </p>
      </div>
    );
  }

  const tagW = 240;
  const tagH = 320;
  return (
    <div className="flex flex-col items-center relative">
      <GoldTwine
        className="absolute z-20"
        style={{ top: -22, width: tagW + 100, height: 60 }}
        aria-hidden
      />
      <PaperCard width={tagW} height={tagH} rotation={-3} rounded="4px 4px 8px 8px">
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: 14,
            width: 14,
            height: 14,
            background: "#E0CFA8",
            boxShadow: "inset 0 1px 2px rgba(93,75,50,0.4)",
          }}
        >
          <div className="absolute rounded-full" style={{ inset: 3, background: "#E8DEC4" }} />
        </div>
        <PeonySprig
          className="absolute"
          style={{ bottom: 4, right: -4, width: 88, height: 88, opacity: 0.85 }}
          aria-hidden
        />
        <StemAccent
          className="absolute"
          style={{ top: 34, left: 4, width: 50, height: 50, opacity: 0.65 }}
          aria-hidden
        />

        <div
          className="absolute left-0 right-0 text-center px-6"
          style={{ top: tagH * 0.36 }}
        >
          {isMonogramMode ? (
            <div className="flex justify-center">
              <MonogramArt
                letters={letters}
                styleKey={monogramStyleKey}
                font={font}
                ink={ink}
                size={90}
              />
            </div>
          ) : (
            <>
              <div
                style={{
                  fontFamily: font.fontFamily,
                  color: ink.hex,
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  opacity: 0.55,
                  marginBottom: 6,
                }}
              >
                a gift from
              </div>
              <div
                style={{
                  fontFamily: font.fontFamily,
                  color: ink.hex,
                  fontSize: 18,
                  lineHeight: 1.1,
                }}
              >
                {fromText}
              </div>
            </>
          )}
        </div>
      </PaperCard>
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
        Tag + Twine · 2" × 3.5"
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   Artwork Print
// ═══════════════════════════════════════════════════════════════════

function ArtworkCanvas({
  dedication,
  size,
  font,
  ink,
}: {
  dedication: string;
  size: string;
  font: { fontFamily: string };
  ink: { hex: string };
}) {
  const dims = {
    "5x7": { w: 280, h: 380 },
    "8x10": { w: 330, h: 410 },
    "11x14": { w: 370, h: 460 },
    "12x16": { w: 390, h: 500 },
  } as const;
  const d = dims[size as keyof typeof dims] ?? dims["8x10"];

  return (
    <div className="flex flex-col items-center">
      <PaperCard width={d.w} height={d.h} rounded="2px">
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 24,
            border: `1px solid ${ink.hex}`,
            opacity: 0.12,
          }}
          aria-hidden
        />
        <div
          className="absolute flex items-center justify-center"
          style={{ inset: 44 }}
        >
          <PeonySprig style={{ width: "100%", height: "70%", opacity: 0.95 }} aria-hidden />
        </div>
        <HydrangeaSprig
          className="absolute"
          style={{ top: 34, right: 28, width: 62, height: 62, opacity: 0.8 }}
          aria-hidden
        />

        {dedication && (
          <div
            className="absolute left-0 right-0 text-center"
            style={{ bottom: 30 }}
          >
            <div
              style={{
                fontFamily: font.fontFamily,
                color: ink.hex,
                fontSize: 11,
                opacity: 0.75,
                letterSpacing: "0.1em",
              }}
            >
              {dedication}
            </div>
          </div>
        )}
      </PaperCard>
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
        {size.replace("x", '" × ')}" Watercolor Print
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//   Calendar
// ═══════════════════════════════════════════════════════════════════

function CalendarCanvas({
  coverName,
  letters,
  isMonogramMode,
  style,
  font,
  ink,
}: {
  coverName: string;
  letters: string;
  isMonogramMode: boolean;
  style: string;
  font: { fontFamily: string };
  ink: { hex: string };
}) {
  const hasStand = style === "with-stand";

  return (
    <div className="flex flex-col items-center">
      <PaperCard width={420} height={320} rounded="2px">
        {/* Wire binding */}
        <div
          className="absolute left-0 right-0 flex items-center justify-around px-3"
          style={{ top: 0, height: 12 }}
        >
          {[...Array(26)].map((_, i) => (
            <div
              key={i}
              className="w-0.5"
              style={{ height: 10, background: "#C9A96E", opacity: 0.45 }}
            />
          ))}
        </div>
        <PeonySprig
          className="absolute"
          style={{ bottom: 10, left: 12, width: 86, height: 86, opacity: 0.9 }}
          aria-hidden
        />
        <HydrangeaSprig
          className="absolute"
          style={{ top: 30, right: 16, width: 56, height: 56, opacity: 0.75 }}
          aria-hidden
        />

        <div
          className="absolute left-0 right-0 flex flex-col items-center px-12"
          style={{ top: "28%" }}
        >
          <div
            style={{
              fontFamily: font.fontFamily,
              color: ink.hex,
              fontSize: 10,
              opacity: 0.55,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Desk Calendar
          </div>
          <div
            className="flex items-baseline gap-2 mt-1"
            style={{ fontFamily: font.fontFamily, color: ink.hex }}
          >
            <div style={{ fontSize: 56, lineHeight: 1, letterSpacing: "0.08em" }}>
              2026
            </div>
            {isMonogramMode && letters && (
              <div style={{ fontSize: 20, lineHeight: 1, opacity: 0.7 }}>
                {letters}
              </div>
            )}
          </div>
          <div
            className="mt-3"
            style={{ width: 40, height: 1, backgroundColor: ink.hex, opacity: 0.3 }}
          />
          <div
            className="mt-2"
            style={{
              fontFamily: font.fontFamily,
              color: ink.hex,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            {coverName}
          </div>
        </div>
      </PaperCard>
      {hasStand && (
        <div
          className="w-48 h-2 rounded-full mt-2"
          style={{
            background: "linear-gradient(to bottom, rgba(201,169,110,0.28), transparent)",
          }}
        />
      )}
      <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-[#8A7355]/60 mt-5">
        {hasStand ? "With Easel Stand" : "With Bible Verses"}
      </p>
    </div>
  );
}
