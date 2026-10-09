/*
 * MonogramPreview: a simple visual of the monogram layout with the
 * user's chosen font and ink color. Not a photorealistic preview of
 * how the print will look — more of a confidence check that the font
 * and letter layout feel right.
 *
 * For full-fidelity previews (the live site uses a paid Customily
 * widget), plug in a server-rendered image service here.
 */
import { cn } from "@/lib/utils";
import type { MonogramStyle, FontOption, InkColorOption } from "@/lib/variants";

interface MonogramPreviewProps {
  letters: string; // raw user input, we'll trim/uppercase as needed
  style: MonogramStyle | undefined;
  font: FontOption;
  ink: InkColorOption;
  label?: string;
}

export function MonogramPreview({
  letters,
  style,
  font,
  ink,
  label = "Preview",
}: MonogramPreviewProps) {
  const cleaned = letters.trim().toUpperCase().slice(0, style?.letterCount ?? 3);
  const placeholder = "A".repeat(style?.letterCount ?? 1);
  const display = cleaned || placeholder;

  const isWreath = style?.key === "wreath";
  const isOval = style?.key === "three-letter-oval";

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative w-28 h-28 md:w-32 md:h-32 bg-white border border-[#C9A96E]/30 flex items-center justify-center shrink-0",
          isOval && "rounded-full",
        )}
      >
        {isWreath && (
          <svg
            className="absolute inset-0 w-full h-full opacity-80 p-2"
            viewBox="0 0 100 100"
            fill="none"
            stroke={ink.hex}
            strokeWidth="0.5"
            aria-hidden
          >
            <ellipse cx="50" cy="50" rx="40" ry="42" strokeDasharray="2,3" />
            {[15, 45, 75].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <ellipse cx="50" cy="10" rx="3" ry="6" />
              </g>
            ))}
            {[195, 225, 255, 285, 315, 345].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <ellipse cx="50" cy="10" rx="3" ry="6" />
              </g>
            ))}
          </svg>
        )}

        {/* Three-letter classic: F - L - M with center letter larger */}
        {style?.key === "three-letter-classic" && display.length === 3 ? (
          <div className="flex items-baseline gap-0.5 leading-none">
            <span
              className="text-xl"
              style={{ fontFamily: font.fontFamily, color: ink.hex }}
            >
              {display[0]}
            </span>
            <span
              className="text-4xl"
              style={{ fontFamily: font.fontFamily, color: ink.hex }}
            >
              {display[1]}
            </span>
            <span
              className="text-xl"
              style={{ fontFamily: font.fontFamily, color: ink.hex }}
            >
              {display[2]}
            </span>
          </div>
        ) : style?.key === "two-letter-stacked" ? (
          <div
            className="text-4xl leading-[0.9] text-center"
            style={{ fontFamily: font.fontFamily, color: ink.hex }}
          >
            <div>{display[0] ?? "A"}</div>
            <div>{display[1] ?? "W"}</div>
          </div>
        ) : (
          <div
            className="text-5xl md:text-6xl leading-none"
            style={{ fontFamily: font.fontFamily, color: ink.hex }}
          >
            {display}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#C9A96E] mb-1">
          {label}
        </p>
        <p className="font-serif text-lg text-[#2D2D2D] leading-snug">
          {style?.label ?? "Single Letter"}
        </p>
        <p className="font-sans text-xs text-[#2D2D2D]/55 mt-0.5">
          {font.label} · {ink.label}
        </p>
        {!cleaned && (
          <p className="font-sans font-light text-[11px] text-[#2D2D2D]/40 mt-2">
            Enter your letters to see your preview.
          </p>
        )}
      </div>
    </div>
  );
}

// ───── Inline name/word preview for notepads & non-monogram personalization ─

interface NamePreviewProps {
  name: string;
  font: FontOption;
  ink: InkColorOption;
  placeholder?: string;
}

export function NamePreview({
  name,
  font,
  ink,
  placeholder = "Amelia",
}: NamePreviewProps) {
  const display = name.trim() || placeholder;
  return (
    <div className="bg-white border border-[#C9A96E]/30 px-5 py-6 min-h-[88px] flex items-center justify-center">
      <span
        className="text-3xl md:text-4xl leading-none"
        style={{ fontFamily: font.fontFamily, color: ink.hex }}
      >
        {display}
      </span>
    </div>
  );
}
