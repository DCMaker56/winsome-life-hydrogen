/*
 * VariantPicker: renders a single VariantAxis with the right UI kind
 * (radio chips / toggle / select / swatches). Controlled component —
 * parent owns selected state keyed by axis.key.
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VariantAxis } from "@/lib/variants";

interface VariantPickerProps {
  axis: VariantAxis;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function VariantPicker({ axis, value, onChange }: VariantPickerProps) {
  const groupId = `axis-${axis.key}`;

  return (
    <fieldset className="space-y-3">
      <div className="flex items-baseline justify-between">
        <legend className="font-sans font-medium text-sm tracking-[0.08em] uppercase text-[#2D2D2D]">
          {axis.label}
        </legend>
        {value && (
          <span className="font-sans text-xs text-[#2D2D2D]/50">
            {axis.options.find((o) => o.value === value)?.label}
          </span>
        )}
      </div>
      {axis.helpText && (
        <p className="font-sans font-light text-xs text-[#2D2D2D]/55 -mt-1">
          {axis.helpText}
        </p>
      )}

      {axis.kind === "radio" || axis.kind === "toggle" ? (
        <div role="radiogroup" aria-labelledby={groupId} className="flex flex-wrap gap-2">
          {axis.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => !opt.disabled && onChange(opt.value)}
                disabled={opt.disabled}
                aria-pressed={active}
                className={cn(
                  "font-sans min-w-[88px] px-4 py-2.5 text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2",
                  active
                    ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5 text-[#2D2D2D]"
                    : "border border-[#C9A96E]/25 text-[#2D2D2D]/70 hover:border-[#C9A96E]/60 hover:text-[#2D2D2D]",
                  opt.disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                <span className="block font-medium leading-tight">{opt.label}</span>
                {opt.sublabel && (
                  <span className="block font-light text-[10px] tracking-wider uppercase text-[#2D2D2D]/50 mt-0.5">
                    {opt.sublabel}
                  </span>
                )}
                {typeof opt.priceDelta === "number" && opt.priceDelta !== 0 && (
                  <span className="block font-medium text-[10px] text-[#C9A96E] mt-0.5">
                    {opt.priceDelta > 0 ? "+" : ""}${Math.abs(opt.priceDelta).toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : axis.kind === "swatch" ? (
        <div role="radiogroup" aria-labelledby={groupId} className="flex flex-wrap gap-2">
          {axis.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => onChange(opt.value)}
                aria-pressed={active}
                aria-label={opt.label}
                title={opt.label}
                className={cn(
                  "relative w-9 h-9 rounded-full border-2 transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2",
                  active ? "border-[#2D2D2D]" : "border-[#C9A96E]/25 hover:border-[#C9A96E]",
                )}
                style={{ backgroundColor: opt.swatchColor }}
              >
                {active && (
                  <Check
                    size={14}
                    className="absolute inset-0 m-auto"
                    color={isLightColor(opt.swatchColor) ? "#2D2D2D" : "#fff"}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <select
          id={groupId}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-white text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
        >
          {axis.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {typeof opt.priceDelta === "number" && opt.priceDelta !== 0
                ? ` (${opt.priceDelta > 0 ? "+" : "−"}$${Math.abs(opt.priceDelta).toFixed(2)})`
                : ""}
            </option>
          ))}
        </select>
      )}
    </fieldset>
  );
}

function isLightColor(hex?: string): boolean {
  if (!hex) return false;
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

// ───── Quantity picker (separate UI for quantity ladders) ────────────

interface QuantityLadderPickerProps {
  ladder: Array<{ qty: number; label: string; price: number }>;
  value: number;
  onChange: (qty: number) => void;
}

export function QuantityLadderPicker({
  ladder,
  value,
  onChange,
}: QuantityLadderPickerProps) {
  return (
    <fieldset className="space-y-3">
      <div className="flex items-baseline justify-between">
        <legend className="font-sans font-medium text-sm tracking-[0.08em] uppercase text-[#2D2D2D]">
          Quantity
        </legend>
        <span className="font-sans text-xs text-[#2D2D2D]/50">
          Bulk discount at higher quantities
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-white text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
      >
        {ladder.map((tier) => (
          <option key={tier.qty} value={tier.qty}>
            {tier.label} — ${tier.price.toFixed(2)}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
