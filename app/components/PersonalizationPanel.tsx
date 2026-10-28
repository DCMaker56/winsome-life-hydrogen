/*
 * PersonalizationPanel v2 — complete UX rewrite.
 *
 * Key changes from v1:
 *   1. Clear Name vs Monogram toggle — one mode active at a time
 *   2. Monogram styles grouped by letter count (3 → 4, not 12 at once)
 *   3. Font preview uses customer's live text, not static "Amelia"
 *   4. Ink color swatches show visible labels (not hover-only)
 *   5. Reset link at the bottom
 */
import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Type, Pen, RotateCcw } from "lucide-react";
import { sortByFieldGroup, type PersonalizationSchema, type MonogramStyle } from "@/lib/variants";

export type PersonalizationMode = "name" | "monogram";

export interface PersonalizationValue {
  mode: PersonalizationMode;
  monogramStyleKey?: string;
  fontKey: string;
  inkKey: string;
  fields: Record<string, string>;
}

interface PersonalizationPanelProps {
  schema: PersonalizationSchema;
  value: PersonalizationValue;
  onChange: (next: PersonalizationValue) => void;
  className?: string;
  /** Hide the Monogram option (name-only items). */
  hideMonogram?: boolean;
  /** Override the text-field label (e.g. "Text" instead of "Name"). */
  textLabel?: string;
  /** Show the live text preview box. Off for now (Sydney): customers just
   *  pick their options; each font tile still shows their text. */
  showPreview?: boolean;
  /** Start with nothing chosen (font, ink, choice fields) and mark them
   *  required — the customer makes every choice. */
  requireChoices?: boolean;
  /** The custom photo charge, noted under a "photo fee" upload once used. */
  photoFeePrice?: number;
  /** Skip the Font / Ink Color pickers (product's "Hide standard questions"). */
  hideFont?: boolean;
  hideInk?: boolean;
}

export function PersonalizationPanel({
  schema,
  value,
  onChange,
  className,
  hideMonogram,
  textLabel,
  showPreview = false,
  requireChoices = false,
  hideFont = false,
  hideInk = false,
  photoFeePrice,
}: PersonalizationPanelProps) {
  const hasMonogram = !hideMonogram && !!schema.monogramStyles?.length;
  const monogramStyle: MonogramStyle | undefined = useMemo(() => {
    if (!value.monogramStyleKey || !schema.monogramStyles) return undefined;
    return schema.monogramStyles.find((s) => s.key === value.monogramStyleKey);
  }, [value.monogramStyleKey, schema.monogramStyles]);

  const ink = schema.inkColors.find((c) => c.key === value.inkKey) ?? schema.inkColors[0];
  const activeFont = schema.fonts.find((f) => f.key === value.fontKey) ?? schema.fonts[0];

  // Ensure fontKey/inkKey stay valid
  useEffect(() => {
    if (requireChoices) return;
    if (!schema.fonts.some((f) => f.key === value.fontKey)) {
      onChange({ ...value, fontKey: schema.fonts[0].key });
    }
    if (!schema.inkColors.some((c) => c.key === value.inkKey)) {
      onChange({ ...value, inkKey: schema.inkColors[0].key });
    }
    // Choice fields always carry a value: default to the first option.
    const missing = schema.fields.filter(
      (f) => f.type === "choice" && f.options?.length && !f.options.includes(value.fields[f.key] ?? ""),
    );
    if (missing.length) {
      onChange({
        ...value,
        fields: {
          ...value.fields,
          ...Object.fromEntries(missing.map((f) => [f.key, f.options![0]])),
        },
      });
    }
  }, [schema]);

  // Answering one of an either/or pair (e.g. Dog Breed / Upload Your Own
  // Photo) clears the other, so the order only carries one.
  const setField = (key: string, v: string) => {
    const fields = { ...value.fields, [key]: v };
    if (v) {
      const self = schema.fields.find((f) => f.key === key);
      for (const f of schema.fields) {
        if (f.key !== key && (f.key === self?.alternativeTo || f.alternativeTo === key)) fields[f.key] = "";
      }
    }
    onChange({ ...value, fields });
  };

  const setMode = (mode: PersonalizationMode) => {
    // Clear the opposing field when switching modes
    const next = { ...value, mode };
    if (mode === "name") {
      next.fields = { ...next.fields, "monogram-letters": "" };
      next.monogramStyleKey = undefined;
    } else {
      next.fields = { ...next.fields, text: "" };
    }
    onChange(next);
  };

  const resetAll = () => {
    onChange(defaultPersonalizationValue(schema));
  };

  // Customer's live text for dynamic font previews
  const liveText =
    value.mode === "monogram"
      ? value.fields["monogram-letters"]?.toUpperCase() || "AEW"
      : value.fields["text"] || "Sample Text";

  // Monogram styles grouped by letter count — default to 3 letters (most traditional)
  const [letterCountFilter, setLetterCountFilter] = useState<1 | 2 | 3>(
    (monogramStyle?.letterCount as 1 | 2 | 3) ?? 3,
  );
  const filteredMonogramStyles = useMemo(() => {
    if (!schema.monogramStyles) return [];
    return schema.monogramStyles.filter((s) => s.letterCount === letterCountFilter);
  }, [schema.monogramStyles, letterCountFilter]);

  // Text field config
  const textField = schema.fields.find((f) => f.key === "text");
  const monoField = schema.fields.find((f) => f.type === "monogram-letters");
  // Other fields (custom-message, etc.)
  const extraFields = sortByFieldGroup(
    schema.fields.filter((f) => f.key !== "text" && f.type !== "monogram-letters"),
  );
  const monogramFields = extraFields.filter((f) => f.group === "monogram");

  // One extra question (color / picture tiles / buttons / text box).
  const renderExtraField = (field: (typeof extraFields)[number]) => {
    const current = value.fields[field.key] ?? "";
    return (
      <div key={field.key}>
        <label className="block font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75 mb-1.5">
          {field.label}
          {field.required && <span className="text-[#C9A96E]"> *</span>}
        </label>
        {field.type === "color" ? (
          <SwatchGrid
            compact
            swatches={schema.inkColors}
            selected={schema.inkColors.find((c) => c.label === current)?.key ?? ""}
            onSelect={(key) =>
              setField(field.key, schema.inkColors.find((c) => c.key === key)?.label ?? "")
            }
          />
        ) : field.type === "choice" && field.optionImages ? (
          <div
            className={cn(
              "grid gap-2",
              // Long lists (e.g. 80+ breeds) get bigger tiles and scroll
              // inside a box.
              (field.options?.length ?? 0) > 20
                ? "grid-cols-3 sm:grid-cols-4 max-h-[560px] overflow-y-auto pr-1"
                : "grid-cols-4 sm:grid-cols-5",
            )}
          >
            {(field.options ?? []).map((opt, i) => {
              const active = current === opt;
              const img = field.optionImages?.[i];
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setField(field.key, opt)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 bg-white transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
                    active
                      ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                      : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60",
                  )}
                >
                  {img ? (
                    <img
                      src={`${img}${img.includes("?") ? "&" : "?"}width=240`}
                      alt=""
                      loading="lazy"
                      className="w-full aspect-square object-contain"
                    />
                  ) : (
                    <span className="w-full aspect-square bg-[#FAF8F5]" />
                  )}
                  <span className="font-sans text-[11px] leading-tight text-center text-[#2D2D2D]">
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        ) : field.type === "choice" ? (
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((opt) => {
              const active = current === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setField(field.key, opt)}
                  aria-pressed={active}
                  className={cn(
                    "font-sans px-4 py-2.5 text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
                    active
                      ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5 text-[#2D2D2D]"
                      : "border border-[#C9A96E]/25 text-[#2D2D2D]/70 hover:border-[#C9A96E]/60",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : field.type === "upload" ? (
          <UploadField
            label={field.label}
            value={current}
            onChange={(url) => setField(field.key, url)}
            feeNote={
              field.photoFee && photoFeePrice
                ? `Custom photo design: +$${photoFeePrice.toFixed(2)} will be added to your cart.`
                : undefined
            }
          />
        ) : field.type === "longtext" ? (
          <textarea
            value={current}
            onChange={(e) =>
              setField(field.key, e.target.value.slice(0, field.maxLength))
            }
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={field.maxLength > 80 ? 4 : 2}
            className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded-sm"
          />
        ) : (
          <input
            type="text"
            value={current}
            onChange={(e) =>
              setField(field.key, e.target.value.slice(0, field.maxLength))
            }
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded-sm"
          />
        )}
        {field.helpText && (
          <p className="font-sans font-light text-[11px] text-[#2D2D2D]/50 mt-1">
            {field.helpText}
          </p>
        )}
      </div>
    );
  };

  return (
    <section
      aria-label="Personalization"
      className={cn(
        "border border-[#C9A96E]/25 bg-white rounded-sm overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="px-5 md:px-6 pt-5 pb-4 border-b border-[#C9A96E]/15">
        <div className="flex items-baseline gap-2">
          <h3 className="font-serif text-xl text-[#2D2D2D]">Personalization</h3>
          {schema.required ? (
            <span className="font-sans font-medium text-[10px] tracking-[0.15em] uppercase text-[#C9A96E] ml-auto">
              Required
            </span>
          ) : (
            <span className="font-sans font-light text-xs text-[#2D2D2D]/45 ml-auto">
              Optional
            </span>
          )}
        </div>
      </div>

      {/* ── Inline preview chip — shows the customer's text in chosen font + ink.
             Clearly labeled as a font/ink preview, NOT the printed product. ── */}
      {showPreview && (
        <div className="px-5 md:px-6 pt-5">
          <div className="relative flex items-center justify-center min-h-[92px] bg-[#FAF8F5] border border-[#C9A96E]/15 rounded-sm px-4 pt-7 pb-5">
            <span className="absolute top-2 left-3 right-3 font-sans font-medium text-[9px] tracking-[0.14em] uppercase text-[#2D2D2D]/45">
              Preview <span className="normal-case tracking-normal text-[#2D2D2D]/35">(this is the text how it will appear on your item)</span>
            </span>
            <span
              className={cn(
                "leading-none text-center break-words",
                value.mode === "monogram"
                  ? "text-4xl tracking-[0.12em] uppercase"
                  : "text-3xl",
              )}
              style={{fontFamily: activeFont.fontFamily, fontWeight: activeFont.fontWeight, color: ink.hex}}
            >
              {liveText}
            </span>
          </div>
        </div>
      )}

      {/* ── Mode toggle: Name vs Monogram ── */}
      {hasMonogram && (
        <div className="px-5 md:px-6 pt-5 pb-1">
          <p className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#2D2D2D]/60 mb-3">
            How should we personalize this?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("name")}
              className={cn(
                "flex flex-col items-center gap-2 py-4 px-3 border transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
                value.mode === "name"
                  ? "border-[#C9A96E] bg-[#C9A96E]/5"
                  : "border-[#C9A96E]/20 hover:border-[#C9A96E]/50",
              )}
            >
              <Pen size={20} className="text-[#C9A96E]" strokeWidth={1.5} />
              <span className="font-serif font-medium text-sm text-[#2D2D2D]">Name</span>
              <span className="font-sans font-light text-[10px] text-[#2D2D2D]/45">
                Your name or a phrase
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("monogram")}
              className={cn(
                "flex flex-col items-center gap-2 py-4 px-3 border transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
                value.mode === "monogram"
                  ? "border-[#C9A96E] bg-[#C9A96E]/5"
                  : "border-[#C9A96E]/20 hover:border-[#C9A96E]/50",
              )}
            >
              <Type size={20} className="text-[#C9A96E]" strokeWidth={1.5} />
              <span className="font-serif font-medium text-sm text-[#2D2D2D]">Monogram</span>
              <span className="font-sans font-light text-[10px] text-[#2D2D2D]/45">
                Initials in a decorative style
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="px-5 md:px-6 py-5 space-y-5">
        {/* ── Monogram questions (initials, style, color) come before the name ── */}
        {monogramFields.length > 0 && (
          <div className="space-y-4">{monogramFields.map(renderExtraField)}</div>
        )}

        {/* ── Name mode input ── */}
        {(value.mode === "name" || !hasMonogram) && textField && (
          <div>
            <label className="block font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75 mb-1.5">
              {textLabel ?? textField.label}
              {textField.required && <span className="text-[#C9A96E]"> *</span>}
            </label>
            {textField.maxLength > 60 ? (
              // Long text allowance (product's "Text box length") gets a taller box.
              <textarea
                value={value.fields["text"] ?? ""}
                onChange={(e) => setField("text", e.target.value.slice(0, textField.maxLength))}
                placeholder={textField.placeholder}
                maxLength={textField.maxLength}
                rows={4}
                className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-base text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded-sm"
              />
            ) : (
              <input
                type="text"
                value={value.fields["text"] ?? ""}
                onChange={(e) => setField("text", e.target.value.slice(0, textField.maxLength))}
                placeholder={textField.placeholder}
                maxLength={textField.maxLength}
                className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-base text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded-sm"
              />
            )}
            <div className="flex items-baseline justify-between mt-1.5">
              {textField.helpText && (
                <p className="font-sans font-light text-[11px] text-[#2D2D2D]/50">
                  {textField.helpText}
                </p>
              )}
              <p className="font-sans text-[11px] text-[#2D2D2D]/40 ml-auto">
                {(value.fields["text"] ?? "").length}/{textField.maxLength}
              </p>
            </div>
          </div>
        )}

        {/* ── Monogram mode ── */}
        {value.mode === "monogram" && hasMonogram && (
          <>
            {/* Step 1: How many letters? */}
            <div>
              <p className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75 mb-2">
                How many letters?
              </p>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((count) => {
                  const available = schema.monogramStyles!.some(
                    (s) => s.letterCount === count,
                  );
                  if (!available) return null;
                  const active = letterCountFilter === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setLetterCountFilter(count);
                        const first = schema.monogramStyles!.find(
                          (s) => s.letterCount === count,
                        );
                        if (first) {
                          // Auto-adjust letters to fit the new count (truncate or pad with placeholder)
                          const current = (value.fields["monogram-letters"] ?? "");
                          const adjusted =
                            current.length >= count
                              ? current.slice(0, count)
                              : (current || "ABC").slice(0, count);
                          onChange({
                            ...value,
                            monogramStyleKey: first.key,
                            fields: { ...value.fields, "monogram-letters": adjusted },
                          });
                        }
                      }}
                      className={cn(
                        "font-sans font-medium px-5 py-2.5 text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
                        active
                          ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5 text-[#2D2D2D]"
                          : "border border-[#C9A96E]/25 text-[#2D2D2D]/60 hover:border-[#C9A96E]/60",
                      )}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Pick a style (filtered by letter count) */}
            <div>
              <p className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75 mb-2">
                Style
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredMonogramStyles.map((s) => {
                  const active = value.monogramStyleKey === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        const current = value.fields["monogram-letters"] ?? "";
                        const adjusted =
                          current.length >= s.letterCount
                            ? current.slice(0, s.letterCount)
                            : (current || "ABC").slice(0, s.letterCount);
                        onChange({
                          ...value,
                          monogramStyleKey: s.key,
                          fields: { ...value.fields, "monogram-letters": adjusted },
                        });
                      }}
                      aria-pressed={active}
                      className={cn(
                        "px-3 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
                        active
                          ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                          : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60",
                      )}
                    >
                      <span className="font-serif font-medium text-sm text-[#2D2D2D] block">
                        {s.label}
                      </span>
                      <span className="font-sans font-light text-[10px] text-[#2D2D2D]/45 block mt-0.5">
                        {s.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Enter letters */}
            {monoField && (
              <div>
                <label className="block font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75 mb-1.5">
                  Enter your {letterCountFilter === 1 ? "initial" : "initials"}
                  {monoField.required && <span className="text-[#C9A96E]"> *</span>}
                </label>
                <input
                  type="text"
                  value={value.fields["monogram-letters"] ?? ""}
                  onChange={(e) =>
                    setField(
                      "monogram-letters",
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z]/g, "")
                        .slice(0, monogramStyle?.letterCount ?? letterCountFilter),
                    )
                  }
                  placeholder={["A", "AW", "AEW"][letterCountFilter - 1]}
                  maxLength={monogramStyle?.letterCount ?? letterCountFilter}
                  className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-2xl text-[#2D2D2D] tracking-[0.2em] text-center uppercase focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded-sm"
                />
                {monoField.helpText && (
                  <p className="font-sans font-light text-[11px] text-[#2D2D2D]/50 mt-1.5">
                    {monoField.helpText}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Font picker — shows customer's own text ── */}
        {!hideFont && (
        <fieldset className="space-y-3">
          <legend className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75">
            Font
            {requireChoices && <span className="text-[#C9A96E]"> *</span>}{" "}
            <span className="font-light normal-case tracking-normal text-[#2D2D2D]/55">
              Choose from fonts below for your text
            </span>
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {schema.fonts.map((f, i) => {
              const active = value.fontKey === f.key;
              return (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => onChange({ ...value, fontKey: f.key })}
                  aria-pressed={active}
                  aria-label={f.label}
                  className={cn(
                    "px-3 py-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2",
                    active
                      ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                      : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60",
                  )}
                >
                  {/* py/-my gives tall scripts (Eyesome) room above/below the
                      line so `truncate`'s overflow clip doesn't cut their loops. */}
                  <span
                    className="block text-xl leading-tight text-[#2D2D2D] truncate py-2 -my-2"
                    style={{ fontFamily: f.fontFamily, fontWeight: f.fontWeight }}
                  >
                    {liveText}
                  </span>
                  {/* Matches the font chart and order details ("Font 4 – Buffalo"). */}
                  <span className="font-sans font-medium text-[9px] tracking-[0.1em] uppercase text-[#2D2D2D]/55 mt-1 block">
                    Font {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        )}

        {/* ── Ink color picker — with visible labels ── */}
        {!hideInk && (
        <fieldset className="space-y-3">
          <legend className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/75">
            Text Color
            {requireChoices && <span className="text-[#C9A96E]"> *</span>}
          </legend>
          <SwatchGrid
            compact
            swatches={schema.inkColors}
            selected={value.inkKey}
            onSelect={(key) => onChange({ ...value, inkKey: key })}
          />
        </fieldset>
        )}

        {/* ── Extra questions, after text/font/ink: border → icon → placement →
             return address (sortByFieldGroup); monogram ones are at the top ── */}
        {extraFields.length > monogramFields.length && (
          <div className="space-y-4">
            {extraFields.filter((f) => f.group !== "monogram").map(renderExtraField)}
          </div>
        )}

        {/* ── Reset link ── */}
        <div className="flex items-center justify-between pt-2 border-t border-[#C9A96E]/15">
          {schema.characterPreviewNote && (
            <p className="font-sans font-light text-[11px] text-[#2D2D2D]/40">
              {schema.characterPreviewNote}
            </p>
          )}
          <button
            type="button"
            onClick={resetAll}
            className="font-sans font-light text-[11px] text-[#2D2D2D]/40 hover:text-[#C9A96E] transition-colors flex items-center gap-1 ml-auto"
          >
            <RotateCcw size={10} />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}

/** Build an initial personalization value given a schema.
 *  Prefers a 3-letter monogram style as the default (most traditional) so
 *  customers land on a fully-populated "ABC" preview immediately. */
export function defaultPersonalizationValue(
  schema: PersonalizationSchema,
): PersonalizationValue {
  // Prefer Three-Letter Classic > any 3-letter style > first style
  const default3Letter =
    schema.monogramStyles?.find((s) => s.key === "three-letter-classic") ??
    schema.monogramStyles?.find((s) => s.letterCount === 3) ??
    schema.monogramStyles?.[0];
  return {
    mode: schema.monogramStyles?.length ? "monogram" : "name",
    monogramStyleKey: default3Letter?.key,
    fontKey: schema.fonts[0].key,
    // Default to black ink (a sensible neutral) rather than whatever sits first.
    inkKey:
      schema.inkColors.find((c) => c.key === "black")?.key ??
      schema.inkColors[0].key,
    fields: {
      text: "Amelia",
      "monogram-letters": "ABC",
    },
  };
}

/** Round color swatches — used for Ink Color and "Color" questions. `compact`
 *  (Sydney's choice for every color picker) packs 10 smaller swatches per row
 *  and shows the chosen color's name just under the question title. */
function SwatchGrid({
  swatches,
  selected,
  onSelect,
  compact = false,
}: {
  swatches: Array<{ key: string; label: string; hex: string }>;
  selected: string;
  onSelect: (key: string) => void;
  compact?: boolean;
}) {
  if (compact) {
    const chosen = swatches.find((c) => c.key === selected);
    return (
      <div>
        <p className="font-sans text-[11px] tracking-wide uppercase -mt-1 mb-2 text-[#2D2D2D]/55">
          {chosen ? (
            <>
              Selected: <span className="font-medium text-[#2D2D2D]">{chosen.label}</span>
            </>
          ) : (
            "Tap a color"
          )}
        </p>
        <div className="grid grid-cols-10 gap-1.5">
          {swatches.map((c) => {
            const active = selected === c.key;
            return (
              <button
                type="button"
                key={c.key}
                onClick={() => onSelect(c.key)}
                aria-pressed={active}
                aria-label={c.label}
                title={c.label}
                className="flex items-center justify-center aspect-square rounded-full focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
              >
                <span
                  className={cn(
                    "block w-full h-full max-w-6 max-h-6 rounded-full border-2 transition-all",
                    active ? "border-[#2D2D2D] scale-110" : "border-[#C9A96E]/25 hover:border-[#2D2D2D]/40",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-5 gap-2">
      {swatches.map((c) => {
        const active = selected === c.key;
        return (
          <button
            type="button"
            key={c.key}
            onClick={() => onSelect(c.key)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-1.5 py-2 px-1 rounded transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
              active ? "bg-[#C9A96E]/10" : "hover:bg-[#C9A96E]/5",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-all shrink-0",
                active ? "border-[#2D2D2D] scale-110" : "border-[#C9A96E]/25",
              )}
              style={{ backgroundColor: c.hex }}
            />
            <span
              className={cn(
                "font-sans text-[9px] tracking-wide uppercase leading-tight text-center",
                active ? "text-[#2D2D2D] font-medium" : "text-[#2D2D2D]/45",
              )}
            >
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Upload button for a customer photo/logo: sends it to /api/upload and keeps
 *  the returned link as the answer. */
function UploadField({
  label,
  value,
  onChange,
  feeNote,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  feeNote?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");

  const upload = async (file: File) => {
    setError("");
    if (file.size > 15 * 1024 * 1024) {
      setError("That file is over 15 MB. Please choose a smaller one.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("label", label);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!json.ok || !json.url) throw new Error(json.error || "Upload failed. Please try again.");
      setFileName(file.name);
      setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    return (
      <div>
        <div className="flex items-center gap-3 p-3 border border-[#C9A96E]/40 bg-[#FAF8F5] rounded-sm">
          {preview ? (
            <img src={preview} alt="" onError={() => setPreview("")} className="w-14 h-14 object-cover rounded-sm" />
          ) : (
            <span className="w-14 h-14 flex items-center justify-center bg-white text-[10px] font-sans text-[#2D2D2D]/60 rounded-sm">
              FILE
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm text-[#2D2D2D] truncate">{fileName || "Uploaded"}</p>
            <p className="font-sans text-[11px] text-[#2D2D2D]/55">Uploaded ✓</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFileName("");
              setPreview("");
            }}
            className="font-sans text-xs underline text-[#2D2D2D]/70 hover:text-[#2D2D2D]"
          >
            Remove
          </button>
        </div>
      {feeNote && <p className="font-sans text-xs font-medium text-[#8a6a3a] mt-1.5">{feeNote}</p>}
      </div>
    );
  }

  return (
    <div>
      <label
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-4 border border-dashed border-[#C9A96E]/60 bg-[#FAF8F5] rounded-sm cursor-pointer font-sans text-sm text-[#2D2D2D] hover:border-[#C9A96E] focus-within:outline-2 focus-within:outline-[#C9A96E]",
          busy && "opacity-60 cursor-wait",
        )}
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        {busy ? "Uploading…" : "Choose a file to upload"}
      </label>
      {error && <p className="font-sans text-[11px] text-[#B23A3A] mt-1">{error}</p>}
    </div>
  );
}
