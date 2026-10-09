/*
 * InlinePersonalizer — the on-page personalization controls for a product.
 *
 * Daniel's model: click a design, then personalize it right here by
 *   1. swapping the illustration,
 *   2. typing your text, and
 *   3. choosing a font + ink color.
 * A live clean preview (StudioCanvas, in the PDP's left column) updates as
 * the customer changes any control. Reuses the shelved studio's engine.
 */
import { useMemo, useRef, useState } from "react";
import { Search, X, Upload } from "lucide-react";
import {
  FONTS,
  INK_COLORS,
  BORDER_STYLES,
  BORDER_COLORS,
  type StudioFormat,
  type StudioConfig,
} from "~/lib/studio";
import {
  NICHES,
  searchIllustrations,
  IllustrationThumb,
} from "~/lib/illustrations";
import { UploadEditor } from "~/components/studio/UploadEditor";

export function InlinePersonalizer({
  format,
  value,
  onChange,
}: {
  format: StudioFormat;
  value: StudioConfig;
  onChange: (next: StudioConfig) => void;
}) {
  const [niche, setNiche] = useState("All");
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchIllustrations(niche, query), [niche, query]);
  const set = (patch: Partial<StudioConfig>) => onChange({ ...value, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);
  // Raw upload awaiting crop/zoom/background-removal in the editor modal.
  const [editing, setEditing] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditing(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-7">
      {/* 1 · Illustration */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#2D2D2D] text-white font-sans font-medium text-[11px] flex items-center justify-center shrink-0">
            1
          </span>
          <h3 className="font-serif text-lg text-[#2D2D2D]">Choose your illustration</h3>
        </div>

        <div className="relative mb-2.5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2D2D]/35" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — pickleball, dog, peony…"
            className="font-sans w-full pl-9 pr-9 py-2.5 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2D2D2D]/40 hover:text-[#2D2D2D]"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {NICHES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNiche(n)}
              aria-pressed={niche === n}
              className={`font-sans font-medium text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 transition-all ${
                niche === n
                  ? "bg-[#2D2D2D] text-white"
                  : "bg-[#FAF8F5] text-[#2D2D2D]/60 ring-1 ring-[#C9A96E]/20 hover:ring-[#C9A96E]/60"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[240px] overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => set({ illustrationId: null })}
            aria-pressed={value.illustrationId === null}
            className={`aspect-square flex flex-col items-center justify-center gap-0.5 bg-[#FAF8F5] transition-all ${
              value.illustrationId === null
                ? "ring-2 ring-[#C9A96E]"
                : "ring-1 ring-[#C9A96E]/20 hover:ring-[#C9A96E]/60"
            }`}
          >
            <span className="font-serif text-[#2D2D2D]/40 text-base">Aa</span>
            <span className="font-sans text-[8px] tracking-[0.1em] uppercase text-[#2D2D2D]/45">
              None
            </span>
          </button>

          {/* Upload your own — for when none of ours is the one */}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-pressed={value.illustrationId === "custom"}
            title="Upload your own illustration"
            className={`aspect-square flex flex-col items-center justify-center gap-1 bg-[#FAF8F5] transition-all ${
              value.illustrationId === "custom"
                ? "ring-2 ring-[#C9A96E]"
                : "ring-1 ring-[#C9A96E]/20 hover:ring-[#C9A96E]/60"
            }`}
          >
            {value.illustrationId === "custom" && value.customIllustration ? (
              <img
                src={value.customIllustration}
                alt="Your upload"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <>
                <Upload size={15} className="text-[#2D2D2D]/45" />
                <span className="font-sans text-[8px] tracking-[0.08em] uppercase text-[#2D2D2D]/45 text-center leading-[1.15]">
                  Upload
                  <br />
                  your own
                </span>
              </>
            )}
          </button>

          {results.map((ill) => {
            const active = value.illustrationId === ill.id;
            return (
              <button
                key={ill.id}
                type="button"
                onClick={() => set({ illustrationId: ill.id })}
                aria-pressed={active}
                title={`${ill.subject} · ${ill.niche}`}
                className={`relative aspect-square bg-white p-1.5 transition-all ${
                  active
                    ? "ring-2 ring-[#C9A96E]"
                    : "ring-1 ring-[#C9A96E]/15 hover:ring-[#C9A96E]/60"
                }`}
              >
                <IllustrationThumb illustration={ill} />
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 · Border */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#2D2D2D] text-white font-sans font-medium text-[11px] flex items-center justify-center shrink-0">
            2
          </span>
          <h3 className="font-serif text-lg text-[#2D2D2D]">Add a border</h3>
          <span className="font-sans text-[10px] tracking-[0.08em] uppercase text-[#2D2D2D]/40">
            Optional
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BORDER_STYLES.map((s) => {
            const active = (value.border?.styleKey ?? "none") === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  set({
                    border: { styleKey: s.key, colorKey: value.border?.colorKey ?? "charcoal" },
                  })
                }
                aria-pressed={active}
                className={`font-sans font-medium text-[10px] tracking-[0.06em] uppercase px-2.5 py-1.5 transition-all ${
                  active
                    ? "bg-[#2D2D2D] text-white"
                    : "bg-[#FAF8F5] text-[#2D2D2D]/60 ring-1 ring-[#C9A96E]/20 hover:ring-[#C9A96E]/60"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {(value.border?.styleKey ?? "none") !== "none" && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Border color">
            {BORDER_COLORS.map((c) => {
              const active = (value.border?.colorKey ?? "charcoal") === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  title={c.label}
                  aria-pressed={active}
                  onClick={() =>
                    set({
                      border: { styleKey: value.border?.styleKey ?? "thin", colorKey: c.key },
                    })
                  }
                  className={`w-7 h-7 rounded-full transition-all ${
                    active
                      ? "ring-2 ring-offset-2 ring-[#2D2D2D]"
                      : "ring-1 ring-[#2D2D2D]/15 hover:ring-[#2D2D2D]/50"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 3 · Text */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#2D2D2D] text-white font-sans font-medium text-[11px] flex items-center justify-center shrink-0">
            3
          </span>
          <h3 className="font-serif text-lg text-[#2D2D2D]">Add your text</h3>
        </div>
        <input
          type="text"
          value={value.name}
          onChange={(e) => set({ name: e.target.value.slice(0, 40) })}
          placeholder="Your name or a phrase"
          maxLength={40}
          className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-base text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
        />
        {format.key !== "wine-tag" && (
          <input
            type="text"
            value={value.secondary}
            onChange={(e) => set({ secondary: e.target.value.slice(0, 50) })}
            placeholder="Second line (optional)"
            maxLength={50}
            className="font-sans w-full mt-2 px-4 py-2.5 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
          />
        )}
      </section>

      {/* 4 · Font */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#2D2D2D] text-white font-sans font-medium text-[11px] flex items-center justify-center shrink-0">
            4
          </span>
          <h3 className="font-serif text-lg text-[#2D2D2D]">Pick a font</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((f) => {
            const active = value.fontKey === f.key;
            const sample = (value.name || "Amelia").split(" ")[0];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => set({ fontKey: f.key })}
                aria-pressed={active}
                className={`px-2 py-2.5 text-center transition-all ${
                  active
                    ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                    : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60"
                }`}
              >
                <span
                  className="block text-lg leading-tight text-[#2D2D2D] truncate"
                  style={{ fontFamily: f.fontFamily }}
                >
                  {sample}
                </span>
                <span className="font-sans font-medium text-[8px] tracking-[0.1em] uppercase text-[#2D2D2D]/50 mt-0.5 block">
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5 · Font color */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-[#2D2D2D] text-white font-sans font-medium text-[11px] flex items-center justify-center shrink-0">
            5
          </span>
          <h3 className="font-serif text-lg text-[#2D2D2D]">Choose a color</h3>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Font color">
          {INK_COLORS.map((c) => {
            const active = value.inkKey === c.key;
            return (
              <button
                key={c.key}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={active}
                onClick={() => set({ inkKey: c.key })}
                className={`w-8 h-8 rounded-full transition-all ${
                  active
                    ? "ring-2 ring-offset-2 ring-[#2D2D2D]"
                    : "ring-1 ring-[#2D2D2D]/15 hover:ring-[#2D2D2D]/50"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
        <p className="font-sans font-light text-[11px] text-[#2D2D2D]/50 mt-2">
          {INK_COLORS.find((c) => c.key === value.inkKey)?.label ?? "Charcoal"}
        </p>
      </section>

      {/* Upload editor modal — crop/zoom, remove background, undo, submit */}
      {editing && (
        <UploadEditor
          src={editing}
          onCancel={() => setEditing(null)}
          onSubmit={(dataUrl) => {
            set({ illustrationId: "custom", customIllustration: dataUrl });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
