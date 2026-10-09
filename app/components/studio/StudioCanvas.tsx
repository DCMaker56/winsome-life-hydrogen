/*
 * StudioCanvas — the live surface of the Winsome Studio.
 *
 * A clean, realistic flat sheet of paper (the actual product face — no styled
 * photography), with the customer's chosen illustration placed at the format's
 * art slot and their name/monogram beneath it. What you see is what prints.
 *
 * Format space is 1 SVG unit = 0.01", so this same markup rasterizes to a
 * 300-DPI production file later.
 */
import { useId } from "react";
import {
  type StudioFormat,
  type StudioConfig,
  getFont,
  getInk,
  getBorderColor,
  MONOGRAM_STYLES,
} from "~/lib/studio";
import {
  getIllustration,
  IllustrationArt,
} from "~/lib/illustrations";

interface StudioCanvasProps {
  format: StudioFormat;
  config: StudioConfig;
  className?: string;
  /** Compact rendering (thumbnails / cart) — no drop shadow, tight padding. */
  flat?: boolean;
  /** Print-export mode: extend the canvas by this many units (1 = 0.01") of
   *  printer's bleed on every side. Paper + full-bleed borders extend into the
   *  bleed; decorative screen effects (shadow, stacked sheets, grain) are
   *  dropped. The customer never sees this — it's for the production file. */
  printBleed?: number;
}

const PAPER = "#FEFDFA";
const GOLD = "#C9A96E";

export function StudioCanvas({ format, config, className, flat, printBleed }: StudioCanvasProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { width: W, height: H } = format;
  const B = printBleed ?? 0; // bleed in format units
  const print = B > 0;
  const font = getFont(config.fontKey);
  const ink = getInk(config.inkKey);
  const illustration = getIllustration(config.illustrationId);
  const customArt =
    config.illustrationId === "custom" ? config.customIllustration : undefined;
  const hasArt = !!illustration || !!customArt;
  // A border eats into the top margin — nudge the whole design down so the
  // frame never overlaps the illustration or the name.
  const hasBorder = !!config.border && config.border.styleKey !== "none";
  const borderDy = hasBorder
    ? Math.min(W, H) *
      (config.border!.styleKey.startsWith("edge") ? 0.085 : 0.055)
    : 0;
  // Text-only (no illustration): lift the text up so it isn't stranded low
  // with an empty gap above it where the illustration would sit.
  const textDy = (hasArt ? 0 : -H * 0.06) + borderDy;

  const primaryZone = format.zones.find((z) => z.key === "primary")!;
  const secondaryZone = format.zones.find((z) => z.key === "secondary");

  const isWineTag = format.key === "wine-tag";
  const isGiftTag = format.key === "gift-tag";
  const pad = flat ? 8 : Math.round(Math.max(W, H) * 0.11);
  const cardRadius = isWineTag || isGiftTag ? Math.round(W * 0.06) : 5;

  // Wine-tag sentiment occupies the primary slot; the name moves below.
  const wineTheme = isWineTag ? config.options["theme"] : undefined;
  const wineSentiment =
    wineTheme === "many-thanks"
      ? "Many Thanks"
      : wineTheme === "cheers"
        ? "Cheers to You"
        : wineTheme === "toast-host"
          ? "A Toast to the Host"
          : undefined;

  return (
    <svg
      viewBox={
        print
          ? `${-B} ${-B} ${W + B * 2} ${H + B * 2}`
          : `${-pad} ${-pad} ${W + pad * 2} ${H + pad * 2}`
      }
      className={className}
      role="img"
      aria-label="Live preview of your personalized design"
    >
      <defs>
        <filter id={`grain-${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0.80  0 0 0 0 0.76  0 0 0 0 0.67  0 0 0 0.04 0" />
        </filter>
        {!flat && (
          <filter id={`shadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx="0"
              dy={H * 0.016}
              stdDeviation={H * 0.02}
              floodColor="#2D2D2D"
              floodOpacity="0.2"
            />
          </filter>
        )}
        {format.hole && (
          <mask id={`hole-${uid}`}>
            <rect x={-pad} y={-pad} width={W + pad * 2} height={H + pad * 2} fill="#fff" />
            <circle cx={format.hole.cx} cy={format.hole.cy} r={format.hole.r} fill="#000" />
          </mask>
        )}
        <clipPath id={`paper-${uid}`}>
          {print ? (
            <rect x={-B} y={-B} width={W + B * 2} height={H + B * 2} />
          ) : (
            <rect x="0" y="0" width={W} height={H} rx={cardRadius} />
          )}
        </clipPath>
      </defs>

      {/* Notepad: stacked sheets behind the top sheet (synthetic only) */}
      {format.key === "notepad" && !flat && !print && !format.paperSvg && (
        <>
          <rect x={9} y={13} width={W} height={H} rx={3} fill="#EFEBE2" />
          <rect x={4.5} y={6.5} width={W} height={H} rx={3} fill="#F6F2EA" />
        </>
      )}

      {/* Paper — a brand-provided print template if one exists, otherwise a
          synthetic sheet. The template IS the surface that prints. In print
          mode the paper extends to the bleed so there's never a white sliver. */}
      <g filter={!flat && !print ? `url(#shadow-${uid})` : undefined}>
        {format.paperSvg ? (
          <image
            href={format.paperSvg}
            x={print ? -B : 0}
            y={print ? -B : 0}
            width={print ? W + B * 2 : W}
            height={print ? H + B * 2 : H}
            preserveAspectRatio="none"
          />
        ) : (
          <rect
            x={print ? -B : 0}
            y={print ? -B : 0}
            width={print ? W + B * 2 : W}
            height={print ? H + B * 2 : H}
            rx={print ? 0 : cardRadius}
            fill={PAPER}
            mask={format.hole && !print ? `url(#hole-${uid})` : undefined}
          />
        )}
      </g>

      {/* Everything printed is clipped to the paper */}
      <g clipPath={`url(#paper-${uid})`}>
        {!format.paperSvg && !print && (
          <rect x="0" y="0" width={W} height={H} filter={`url(#grain-${uid})`} opacity="0.8" />
        )}

        {/* Notepad ruled lines */}
        {format.ruledLines &&
          (() => {
            const r = format.ruledLines;
            const lines = [];
            for (let y = r.startY; y <= r.endY; y += r.gap) {
              lines.push(
                <line
                  key={y}
                  x1={W * r.inset}
                  x2={W * (1 - r.inset)}
                  y1={H * y}
                  y2={H * y}
                  stroke="#CBC4B6"
                  strokeWidth="1.1"
                  opacity="0.5"
                />,
              );
            }
            return lines;
          })()}

        {/* Fold line on the bottle-neck wine tag */}
        {isWineTag && format.hole && (
          <line
            x1={0}
            x2={W}
            y1={format.hole.cy + format.hole.r + 14}
            y2={format.hole.cy + format.hole.r + 14}
            stroke="#E0DACE"
            strokeWidth="1.4"
          />
        )}

        {/* Customer-chosen border, framing the whole piece */}
        {config.border && config.border.styleKey !== "none" && (
          <BorderFrame
            styleKey={config.border.styleKey}
            color={getBorderColor(config.border.colorKey).hex}
            W={W}
            H={H}
            bleed={B}
          />
        )}

        {/* The chosen illustration, placed at the format's art slot.
            SAFEGUARD: clamp the art box so it always stays inside a safe
            printable inset — it can never run off the paper even if an artSlot
            is set generously or an asset sits near its own edge. */}
        {illustration &&
          (() => {
            const inset = Math.min(W, H) * 0.05;
            const cx = W * format.artSlot.cx;
            const cy = H * format.artSlot.cy + borderDy;
            const size = Math.max(
              0,
              Math.min(
                W * format.artSlot.maxW,
                2 * Math.min(cx - inset, W - inset - cx),
                2 * Math.min(cy - inset, H - inset - cy),
              ),
            );
            return (
              <IllustrationArt
                illustration={illustration}
                style={config.illustrationStyle}
                x={cx}
                y={cy}
                size={size}
              />
            );
          })()}

        {/* Customer-uploaded illustration — same safe-inset clamp. */}
        {customArt &&
          (() => {
            const inset = Math.min(W, H) * 0.05;
            const cx = W * format.artSlot.cx;
            const cy = H * format.artSlot.cy + borderDy;
            const size = Math.max(
              0,
              Math.min(
                W * format.artSlot.maxW,
                2 * Math.min(cx - inset, W - inset - cx),
                2 * Math.min(cy - inset, H - inset - cy),
              ),
            );
            return (
              <image
                href={customArt}
                x={cx - size / 2}
                y={cy - size / 2}
                width={size}
                height={size}
                preserveAspectRatio="xMidYMid meet"
              />
            );
          })()}

        {/* ── Live text ── */}
        {config.mode === "monogram" ? (
          <MonogramGlyph
            letters={config.monogramLetters || "A"}
            styleKey={config.monogramStyleKey}
            fontFamily={font.fontFamily}
            color={ink.hex}
            cx={W * primaryZone.cx}
            cy={H * primaryZone.cy + borderDy}
            size={primaryZone.fontSize * 1.3}
          />
        ) : wineSentiment ? (
          <>
            <FittedText
              text={wineSentiment}
              x={W * primaryZone.cx}
              y={H * primaryZone.cy + borderDy}
              maxWidth={W * primaryZone.maxWidth}
              fontSize={primaryZone.fontSize}
              fontFamily="'Parisian Script', 'Great Vibes', cursive"
              color={ink.hex}
            />
            {secondaryZone && (
              <FittedText
                text={config.name ? `from ${config.name}` : ""}
                x={W * secondaryZone.cx}
                y={H * secondaryZone.cy + borderDy}
                maxWidth={W * secondaryZone.maxWidth}
                fontSize={secondaryZone.fontSize}
                fontFamily="'Montserrat', system-ui, sans-serif"
                color={ink.hex}
                letterSpacing="0.16em"
                uppercase
                opacity={0.8}
              />
            )}
          </>
        ) : (
          <>
            <FittedText
              text={config.name}
              x={W * primaryZone.cx}
              y={H * primaryZone.cy + textDy}
              maxWidth={W * primaryZone.maxWidth}
              fontSize={primaryZone.fontSize}
              fontFamily={font.fontFamily}
              color={ink.hex}
            />
            {secondaryZone && config.secondary && (
              <FittedText
                text={config.secondary}
                x={W * secondaryZone.cx}
                y={H * secondaryZone.cy + textDy}
                maxWidth={W * secondaryZone.maxWidth}
                fontSize={secondaryZone.fontSize}
                fontFamily="'Montserrat', system-ui, sans-serif"
                color={ink.hex}
                letterSpacing="0.18em"
                uppercase
                opacity={0.75}
              />
            )}
          </>
        )}
      </g>

      {/* Hole reinforcement ring (small gift-tag punch) */}
      {isGiftTag && format.hole && (
        <circle
          cx={format.hole.cx}
          cy={format.hole.cy}
          r={format.hole.r + 3}
          fill="none"
          stroke={GOLD}
          strokeWidth="1.5"
          opacity="0.5"
        />
      )}
    </svg>
  );
}

// ───── Border frames ─────────────────────────────────────────────────

function BorderFrame({
  styleKey,
  color,
  W,
  H,
  bleed = 0,
}: {
  styleKey: string;
  color: string;
  W: number;
  H: number;
  /** Print bleed in units — full-bleed styles extend this far past the trim. */
  bleed?: number;
}) {
  const m = Math.min(W, H);
  const inset = m * 0.05; // distance from the paper edge
  const x = inset, y = inset, w = W - inset * 2, h = H - inset * 2;
  const thin = Math.max(1.2, m * 0.004);
  const thick = m * 0.012;

  switch (styleKey) {
    case "thin":
      return <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={thin} />;
    case "classic":
      return <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={thick} />;
    case "double": {
      const g = m * 0.016;
      return (
        <g fill="none" stroke={color}>
          <rect x={x} y={y} width={w} height={h} strokeWidth={thin} />
          <rect x={x + g} y={y + g} width={w - g * 2} height={h - g * 2} strokeWidth={thin} />
        </g>
      );
    }
    case "thick-thin": {
      const g = m * 0.018;
      return (
        <g fill="none" stroke={color}>
          <rect x={x} y={y} width={w} height={h} strokeWidth={thick} />
          <rect x={x + g} y={y + g} width={w - g * 2} height={h - g * 2} strokeWidth={thin} />
        </g>
      );
    }
    case "dashed":
      return (
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={thin * 1.4}
          strokeDasharray={`${m * 0.03} ${m * 0.018}`} />
      );
    case "dotted":
      return (
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={thin * 2}
          strokeDasharray={`0.1 ${m * 0.022}`} strokeLinecap="round" />
      );
    case "corners": {
      const L = m * 0.11;
      const s = thick * 0.8;
      const d = [
        `M ${x} ${y + L} L ${x} ${y} L ${x + L} ${y}`,
        `M ${x + w - L} ${y} L ${x + w} ${y} L ${x + w} ${y + L}`,
        `M ${x + w} ${y + h - L} L ${x + w} ${y + h} L ${x + w - L} ${y + h}`,
        `M ${x + L} ${y + h} L ${x} ${y + h} L ${x} ${y + h - L}`,
      ].join(" ");
      return <path d={d} fill="none" stroke={color} strokeWidth={s} strokeLinecap="square" />;
    }
    case "deco": {
      const g = m * 0.02;
      const sq = m * 0.02;
      return (
        <g stroke={color} fill="none">
          <rect x={x} y={y} width={w} height={h} strokeWidth={thin} />
          <rect x={x + g} y={y + g} width={w - g * 2} height={h - g * 2} strokeWidth={thin} />
          {[[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([cx, cy], i) => (
            <rect key={i} x={cx - sq / 2} y={cy - sq / 2} width={sq} height={sq} fill={color} stroke="none" />
          ))}
        </g>
      );
    }
    case "stitch":
      return (
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={thin}
          strokeDasharray={`${m * 0.012} ${m * 0.012}`} />
      );
    case "rounded":
      return (
        <rect x={x} y={y} width={w} height={h} rx={m * 0.05} fill="none" stroke={color} strokeWidth={thin * 1.6} />
      );
    // ── Full-bleed styles: the color runs to (and past) the paper edge ──
    case "edge-band": {
      // Solid band from beyond the trim edge (covers the bleed when printing)
      // in to a clean interior opening.
      const band = m * 0.07;
      return (
        <path
          d={`M ${-bleed} ${-bleed} H ${W + bleed} V ${H + bleed} H ${-bleed} Z
              M ${band} ${band} V ${H - band} H ${W - band} V ${band} Z`}
          fill={color}
          fillRule="evenodd"
        />
      );
    }
    case "edge-duo": {
      // Edge band + an inner accent line — the Après Ski look.
      const band = m * 0.06;
      const gap = m * 0.028;
      return (
        <g>
          <path
            d={`M ${-bleed} ${-bleed} H ${W + bleed} V ${H + bleed} H ${-bleed} Z
                M ${band} ${band} V ${H - band} H ${W - band} V ${band} Z`}
            fill={color}
            fillRule="evenodd"
          />
          <rect
            x={band + gap}
            y={band + gap}
            width={W - (band + gap) * 2}
            height={H - (band + gap) * 2}
            fill="none"
            stroke={color}
            strokeWidth={m * 0.012}
          />
        </g>
      );
    }
    default:
      return null;
  }
}

// ───── Text that never overflows its zone ────────────────────────────

function FittedText({
  text,
  x,
  y,
  maxWidth,
  fontSize,
  fontFamily,
  color,
  letterSpacing,
  uppercase,
  opacity = 1,
}: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  letterSpacing?: string;
  uppercase?: boolean;
  opacity?: number;
}) {
  if (!text) return null;
  const display = uppercase ? text.toUpperCase() : text;
  const glyphEm = 0.52 + (letterSpacing ? 0.17 : 0) + (uppercase ? 0.08 : 0);
  const est = display.length * fontSize * glyphEm;
  const size = est > maxWidth ? Math.max(fontSize * (maxWidth / est), fontSize * 0.4) : fontSize;
  const stillTooWide = display.length * size * glyphEm > maxWidth;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily={fontFamily}
      fontSize={size}
      fill={color}
      opacity={opacity}
      letterSpacing={letterSpacing}
      {...(stillTooWide
        ? { textLength: maxWidth, lengthAdjust: "spacingAndGlyphs" as const }
        : {})}
    >
      {display}
    </text>
  );
}

// ───── Monogram frames ───────────────────────────────────────────────

function MonogramGlyph({
  letters,
  styleKey,
  fontFamily,
  color,
  cx,
  cy,
  size,
}: {
  letters: string;
  styleKey: string;
  fontFamily: string;
  color: string;
  cx: number;
  cy: number;
  size: number;
}) {
  const style = MONOGRAM_STYLES.find((s) => s.key === styleKey);
  const count = style?.letterCount ?? 3;
  const ls = letters.toUpperCase().replace(/[^A-Z]/g, "").slice(0, count).padEnd(1, "A");
  const frameR = size * 0.92;

  const frame = (() => {
    switch (styleKey) {
      case "three-letter-oval":
        return <ellipse cx={cx} cy={cy} rx={frameR * 1.15} ry={frameR * 0.88} fill="none" stroke={color} strokeWidth={size * 0.03} opacity="0.85" />;
      case "three-letter-circle":
        return <circle cx={cx} cy={cy} r={frameR} fill="none" stroke={color} strokeWidth={size * 0.03} opacity="0.85" />;
      case "three-letter-diamond":
        return <rect x={cx - frameR} y={cy - frameR} width={frameR * 2} height={frameR * 2} fill="none" stroke={color} strokeWidth={size * 0.03} opacity="0.85" transform={`rotate(45 ${cx} ${cy})`} />;
      case "scallop": {
        const petals = 14;
        const d = Array.from({ length: petals }, (_, i) => {
          const a0 = (i / petals) * Math.PI * 2;
          const a1 = ((i + 1) / petals) * Math.PI * 2;
          const r = frameR;
          const x0 = cx + Math.cos(a0) * r;
          const y0 = cy + Math.sin(a0) * r;
          const x1 = cx + Math.cos(a1) * r;
          const y1 = cy + Math.sin(a1) * r;
          const mx = cx + Math.cos((a0 + a1) / 2) * r * 1.16;
          const my = cy + Math.sin((a0 + a1) / 2) * r * 1.16;
          return `${i === 0 ? `M ${x0} ${y0}` : ""} Q ${mx} ${my} ${x1} ${y1}`;
        }).join(" ");
        return <path d={d} fill="none" stroke={color} strokeWidth={size * 0.028} opacity="0.8" />;
      }
      case "modern-block":
        return <rect x={cx - frameR * 0.85} y={cy - frameR * 0.85} width={frameR * 1.7} height={frameR * 1.7} fill="none" stroke={color} strokeWidth={size * 0.04} opacity="0.9" />;
      case "wreath":
        return <WreathFrame cx={cx} cy={cy} r={frameR} color={color} size={size} />;
      case "vine":
        return (
          <path
            d={`M ${cx - frameR} ${cy + frameR * 0.75} Q ${cx} ${cy + frameR * 1.05} ${cx + frameR} ${cy + frameR * 0.7}`}
            fill="none"
            stroke="#8AAA88"
            strokeWidth={size * 0.025}
            opacity="0.7"
          />
        );
      default:
        return null;
    }
  })();

  const blockFont = styleKey === "modern-block" ? "'Montserrat', system-ui, sans-serif" : fontFamily;

  return (
    <g>
      {frame}
      {count === 1 && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={blockFont} fontSize={size} fill={color} fontWeight={styleKey === "modern-block" ? 600 : 400}>
          {ls[0]}
        </text>
      )}
      {count === 2 &&
        (styleKey === "interlocking" ? (
          <>
            <text x={cx - size * 0.22} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily="'Parisian Script', 'Great Vibes', cursive" fontSize={size} fill={color}>
              {ls[0]}
            </text>
            <text x={cx + size * 0.22} y={cy + size * 0.06} textAnchor="middle" dominantBaseline="middle" fontFamily="'Parisian Script', 'Great Vibes', cursive" fontSize={size} fill={color} opacity="0.62">
              {ls[1] ?? ""}
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - size * 0.34} textAnchor="middle" dominantBaseline="middle" fontFamily={blockFont} fontSize={size * 0.62} fill={color}>
              {ls[0]}
            </text>
            <text x={cx} y={cy + size * 0.34} textAnchor="middle" dominantBaseline="middle" fontFamily={blockFont} fontSize={size * 0.62} fill={color}>
              {ls[1] ?? ""}
            </text>
          </>
        ))}
      {count === 3 && (
        <>
          <text x={cx - size * 0.62} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={blockFont} fontSize={size * 0.6} fill={color}>
            {ls[0]}
          </text>
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={blockFont} fontSize={size} fill={color}>
            {ls[1] ?? ""}
          </text>
          <text x={cx + size * 0.62} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={blockFont} fontSize={size * 0.6} fill={color}>
            {ls[2] ?? ""}
          </text>
        </>
      )}
    </g>
  );
}

function WreathFrame({ cx, cy, r, color, size }: { cx: number; cy: number; r: number; color: string; size: number }) {
  const leaves = 18;
  return (
    <g>
      {Array.from({ length: leaves }, (_, i) => {
        const a = (i / leaves) * 360;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy - r}
            rx={size * 0.06}
            ry={size * 0.14}
            fill={i % 3 === 0 ? color : "#9CB89A"}
            opacity={i % 3 === 0 ? 0.5 : 0.55}
            transform={`rotate(${a} ${cx} ${cy}) rotate(12 ${cx} ${cy - r})`}
          />
        );
      })}
    </g>
  );
}
