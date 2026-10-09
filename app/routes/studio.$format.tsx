/*
 * Design Studio — full-screen WYSIWYG editor (Minted-style takeover).
 *
 * The site chrome (navbar/footer) is suppressed for /studio routes in
 * WinsomeLayout, so this route owns the whole viewport:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ wordmark · back        product title         price · CTA │  64px
 *   ├───────────────────────────────┬──────────────────────────┤
 *   │                               │  ① Design ② Personalize  │
 *   │        live canvas            │  ③ Style  ④ Options      │  fills
 *   │     (updates per keystroke)   │  ──────────────────────  │  remaining
 *   │                               │   active step panel      │  viewport
 *   └───────────────────────────────┴──────────────────────────┘
 *
 * No page scrolling — each step panel fits the rail; only a panel's own
 * content scrolls if it must (e.g. 11 monogram styles on a short screen).
 */
import { useMemo, useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/studio.$format";
import { CartForm } from "@shopify/hydrogen";
import { ArrowLeft, Check, Search, Sparkles, X } from "lucide-react";
import {
  STUDIO_FORMATS,
  STUDIO_DEFAULT_COLLECTION,
  FONTS,
  INK_COLORS,
  MONOGRAM_STYLES,
  defaultStudioConfig,
  computeStudioPrice,
  studioLineAttributes,
  type StudioFormatKey,
  type StudioConfig,
} from "~/lib/studio";
import {
  NICHES,
  ILLUSTRATION_STYLES,
  searchIllustrations,
  getIllustration,
  IllustrationThumb,
} from "~/lib/illustrations";
import { StudioCanvas } from "~/components/studio/StudioCanvas";
import { loadStudioFormat } from "~/lib/templateSource";
import { cleanProductTitle } from "~/lib/shopify-transform";
import { useAside } from "~/components/Aside";

export const meta: Route.MetaFunction = ({ data }) => [
  {
    title: `Design Your Own ${data?.formatLabel ?? ""} | The Winsome Life`.replace(/\s+\|/, ' |'),
  },
  {
    name: "description",
    content:
      "Personalize your stationery with a live preview — names, monograms, fonts, and ink colors, updated as you type.",
  },
];

const STUDIO_PRODUCT_QUERY = `#graphql
  query StudioProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      variants(first: 1) {
        nodes { id price { amount } availableForSale }
      }
    }
  }
` as const;

const STUDIO_FALLBACK_QUERY = `#graphql
  query StudioFallback($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 1) {
        nodes {
          id
          title
          handle
          variants(first: 1) {
            nodes { id price { amount } availableForSale }
          }
        }
      }
    }
  }
` as const;

export async function loader({ context, params, request }: Route.LoaderArgs) {
  // The Product Builder — the separate "design your own" experience (distinct
  // from the classic existing-product PDPs). Pick a product → icon → text.
  const formatKey = params.format as StudioFormatKey;
  if (!STUDIO_FORMATS[formatKey]) throw new Response(null, { status: 404 });
  // Fetch the composer-authored template (falls back to hardcoded on any error).
  const format = await loadStudioFormat(formatKey);

  const url = new URL(request.url);
  const productHandle = url.searchParams.get("product");

  let product: {
    id: string;
    title: string;
    handle: string;
    variantId: string;
    price: number;
  } | null = null;

  if (productHandle) {
    const { product: p } = await context.storefront.query(
      STUDIO_PRODUCT_QUERY,
      { variables: { handle: productHandle } },
    );
    const v = p?.variants?.nodes?.[0];
    if (p && v) {
      product = {
        id: p.id,
        title: cleanProductTitle(p.title),
        handle: p.handle,
        variantId: v.id,
        price: parseFloat(v.price.amount),
      };
    }
  }
  if (!product) {
    const { collection } = await context.storefront.query(
      STUDIO_FALLBACK_QUERY,
      { variables: { handle: STUDIO_DEFAULT_COLLECTION[formatKey] } },
    );
    const p = collection?.products?.nodes?.[0];
    const v = p?.variants?.nodes?.[0];
    if (p && v) {
      product = {
        id: p.id,
        title: cleanProductTitle(p.title),
        handle: p.handle,
        variantId: v.id,
        price: parseFloat(v.price.amount),
      };
    }
  }

  return { formatKey, format, formatLabel: format.label, product };
}

type StudioStep = "design" | "personalize" | "style" | "options";

const STEPS: Array<{ key: StudioStep; n: number; label: string }> = [
  { key: "design", n: 1, label: "Artwork" },
  { key: "personalize", n: 2, label: "Personalize" },
  { key: "style", n: 3, label: "Style" },
  { key: "options", n: 4, label: "Options" },
];

export default function StudioRoute() {
  const { format, product } = useLoaderData<typeof loader>();
  const [config, setConfig] = useState<StudioConfig>(() =>
    defaultStudioConfig(format),
  );
  const [step, setStep] = useState<StudioStep>("design");
  const [artNiche, setArtNiche] = useState<string>("All");
  const [artQuery, setArtQuery] = useState("");
  const { open } = useAside();

  const artResults = useMemo(
    () => searchIllustrations(artNiche, artQuery),
    [artNiche, artQuery],
  );

  const set = (patch: Partial<StudioConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));

  const price = computeStudioPrice(format, config, product?.price ?? 0);
  const attrs = studioLineAttributes(format, config);
  const valid =
    config.mode === "name"
      ? config.name.trim().length > 0
      : config.monogramLetters.trim().length > 0;

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const nextStep = STEPS[stepIndex + 1];

  return (
    <main className="h-screen flex flex-col bg-[#FAF8F5] overflow-hidden">
      {/* ── Top bar ── */}
      <header className="shrink-0 bg-white border-b border-[#C9A96E]/20 z-40">
        <div className="flex items-center gap-3 lg:gap-5 px-4 lg:px-6 h-16">
          <Link to="/" className="shrink-0 leading-none min-w-0" aria-label="The Winsome Life — home">
            <span className="font-serif font-medium text-xs sm:text-sm lg:text-base tracking-[0.12em] text-[#2D2D2D] uppercase block truncate">
              The Winsome Life
            </span>
            <span className="font-sans font-medium text-[8px] tracking-[0.3em] text-[#C9A96E] uppercase block mt-0.5">
              Product Builder
            </span>
          </Link>
          <span className="h-6 w-px bg-[#C9A96E]/25 shrink-0 hidden sm:block" />
          <Link
            to={product ? `/products/${product.handle}` : "/collections/all"}
            className="hidden sm:flex items-center gap-1.5 font-sans text-[11px] tracking-[0.12em] uppercase text-[#2D2D2D]/55 hover:text-[#C9A96E] transition-colors shrink-0"
          >
            <ArrowLeft size={13} />
            Back
          </Link>
          <div className="min-w-0 flex-1 text-center hidden md:block">
            <h1 className="font-serif text-sm lg:text-base text-[#2D2D2D] truncate">
              {product?.title ?? format.label}
            </h1>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 shrink-0 ml-auto">
            <span className="font-sans font-medium text-base sm:text-lg text-[#2D2D2D]">
              ${price.toFixed(2)}
            </span>
            <CartForm
              route="/cart"
              inputs={{
                lines: [
                  {
                    merchandiseId: product?.variantId ?? "",
                    quantity: 1,
                    attributes: attrs,
                  },
                ],
              }}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <button
                  type="submit"
                  onClick={() => open("cart")}
                  disabled={!product || !valid || fetcher.state !== "idle"}
                  className="bg-[#2D2D2D] text-white font-sans font-medium text-xs tracking-[0.15em] uppercase px-4 sm:px-5 lg:px-7 py-3 hover:bg-[#C9A96E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {fetcher.state !== "idle" ? (
                    "Adding…"
                  ) : (
                    <>
                      Add<span className="hidden sm:inline"> to Cart</span>
                    </>
                  )}
                </button>
              )}
            </CartForm>
          </div>
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_460px]">
        {/* Canvas */}
        <div className="bg-[#EFEAE2] flex flex-col items-center justify-center p-4 lg:p-10 min-h-0 max-lg:h-[42vh] max-lg:shrink-0">
          <StudioCanvas
            format={format}
            config={config}
            className="max-h-full w-auto max-w-full drop-shadow-none"
          />
          <p className="mt-3 lg:mt-4 font-sans font-medium text-[9px] lg:text-[10px] tracking-[0.22em] uppercase text-[#2D2D2D]/40 flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse shrink-0" />
            Live preview
            <span className="hidden sm:inline normal-case tracking-normal font-light">
              · {format.sizeNote}
            </span>
          </p>
        </div>

        {/* Control rail — tabbed steps, no page scroll */}
        <div className="bg-white border-l border-[#C9A96E]/15 flex flex-col min-h-0">
          {/* Step tabs */}
          <nav
            className="shrink-0 grid grid-cols-4 border-b border-[#C9A96E]/15"
            aria-label="Customization steps"
          >
            {STEPS.map((s) => {
              const active = step === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(s.key)}
                  aria-current={active ? "step" : undefined}
                  className={`relative flex flex-col items-center gap-1 py-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:-outline-offset-2 ${
                    active ? "text-[#2D2D2D]" : "text-[#2D2D2D]/40 hover:text-[#2D2D2D]/70"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full font-sans font-medium text-[10px] flex items-center justify-center transition-colors ${
                      active
                        ? "bg-[#C9A96E] text-white"
                        : "bg-[#2D2D2D]/8 text-[#2D2D2D]/50"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span className="font-sans font-medium text-[10px] tracking-[0.12em] uppercase">
                    {s.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C9A96E]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active panel */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-7 py-6">
            {step === "design" && (
              <div className="flex flex-col min-h-0">
                {/* Search */}
                <div className="relative mb-3">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D2D2D]/35"
                  />
                  <input
                    type="text"
                    value={artQuery}
                    onChange={(e) => setArtQuery(e.target.value)}
                    placeholder="Search illustrations — pickleball, dog, peony…"
                    className="font-sans w-full pl-9 pr-9 py-2.5 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
                  />
                  {artQuery && (
                    <button
                      type="button"
                      onClick={() => setArtQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2D2D2D]/40 hover:text-[#2D2D2D]"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Niche chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {NICHES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setArtNiche(n)}
                      aria-pressed={artNiche === n}
                      className={`font-sans font-medium text-[11px] tracking-[0.06em] uppercase px-3 py-1.5 transition-all ${
                        artNiche === n
                          ? "bg-[#2D2D2D] text-white"
                          : "bg-[#FAF8F5] text-[#2D2D2D]/60 ring-1 ring-[#C9A96E]/20 hover:ring-[#C9A96E]/60"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Illustration grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* None / text-only */}
                  <button
                    type="button"
                    onClick={() => set({ illustrationId: null })}
                    aria-pressed={config.illustrationId === null}
                    className={`aspect-square flex flex-col items-center justify-center gap-1 bg-[#FAF8F5] transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
                      config.illustrationId === null
                        ? "ring-2 ring-[#C9A96E]"
                        : "ring-1 ring-[#C9A96E]/20 hover:ring-[#C9A96E]/60"
                    }`}
                  >
                    <span className="font-serif text-[#2D2D2D]/40 text-lg">Aa</span>
                    <span className="font-sans text-[9px] tracking-[0.1em] uppercase text-[#2D2D2D]/45">
                      Text only
                    </span>
                  </button>

                  {artResults.map((ill) => {
                    const active = config.illustrationId === ill.id;
                    return (
                      <button
                        key={ill.id}
                        type="button"
                        onClick={() => set({ illustrationId: ill.id })}
                        aria-pressed={active}
                        title={`${ill.subject} · ${ill.niche}`}
                        className={`relative aspect-square bg-white p-2 transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
                          active
                            ? "ring-2 ring-[#C9A96E]"
                            : "ring-1 ring-[#C9A96E]/15 hover:ring-[#C9A96E]/60"
                        }`}
                      >
                        <IllustrationThumb illustration={ill} />
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-[#C9A96E] rounded-full flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-white/85 font-sans text-[9px] text-center text-[#2D2D2D]/60 py-0.5 truncate">
                          {ill.subject}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {artResults.length === 0 && (
                  <p className="font-sans font-light text-sm text-[#2D2D2D]/45 text-center py-8">
                    No illustrations match &ldquo;{artQuery}&rdquo;.
                  </p>
                )}

                <p className="font-sans font-light text-[11px] text-[#2D2D2D]/40 leading-relaxed mt-4">
                  Tap an illustration to place it on your{" "}
                  {format.label.toLowerCase()}. New designs are added every week.
                </p>
              </div>
            )}

            {step === "personalize" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2">
                  {(["name", "monogram"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set({ mode: m })}
                      aria-pressed={config.mode === m}
                      className={`font-sans font-medium text-xs tracking-[0.1em] uppercase py-2.5 transition-all ${
                        config.mode === m
                          ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5 text-[#2D2D2D]"
                          : "border border-[#C9A96E]/25 text-[#2D2D2D]/55 hover:border-[#C9A96E]/60"
                      }`}
                    >
                      {m === "name" ? "Name" : "Monogram"}
                    </button>
                  ))}
                </div>

                {config.mode === "name" ? (
                  <>
                    <Field label="Name or phrase">
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => set({ name: e.target.value.slice(0, 40) })}
                        placeholder="The Hamilton Family"
                        maxLength={40}
                        className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-base text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
                      />
                    </Field>
                    {format.key !== "wine-tag" && (
                      <Field label="Second line (optional)">
                        <input
                          type="text"
                          value={config.secondary}
                          onChange={(e) =>
                            set({ secondary: e.target.value.slice(0, 50) })
                          }
                          placeholder={
                            format.key === "notepad"
                              ? "from the desk of"
                              : "est. 2024"
                          }
                          maxLength={50}
                          className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
                        />
                      </Field>
                    )}
                  </>
                ) : (
                  <>
                    <Field label="Your initials">
                      <input
                        type="text"
                        value={config.monogramLetters}
                        onChange={(e) =>
                          set({
                            monogramLetters: e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z]/g, "")
                              .slice(
                                0,
                                MONOGRAM_STYLES.find(
                                  (s) => s.key === config.monogramStyleKey,
                                )?.letterCount ?? 3,
                              ),
                          })
                        }
                        placeholder="ABC"
                        className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-2xl tracking-[0.25em] text-center uppercase text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
                      />
                    </Field>
                    <Field label="Monogram style">
                      <div className="grid grid-cols-2 gap-2">
                        {MONOGRAM_STYLES.map((s) => {
                          const active = config.monogramStyleKey === s.key;
                          return (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() =>
                                set({
                                  monogramStyleKey: s.key,
                                  monogramLetters: config.monogramLetters
                                    .padEnd(s.letterCount, "ABC")
                                    .slice(0, s.letterCount),
                                })
                              }
                              aria-pressed={active}
                              className={`px-2.5 py-2 text-left transition-all ${
                                active
                                  ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                                  : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60"
                              }`}
                            >
                              <span className="font-serif text-xs text-[#2D2D2D] block">
                                {s.label}
                              </span>
                              <span className="font-sans font-light text-[9px] text-[#2D2D2D]/45 block leading-snug">
                                {s.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </>
                )}
              </div>
            )}

            {step === "style" && (
              <div className="space-y-7">
                {config.illustrationId && (
                  <Field label="Illustration style">
                    <div className="grid grid-cols-3 gap-2">
                      {ILLUSTRATION_STYLES.map((s) => {
                        const active = config.illustrationStyle === s.key;
                        const ill = getIllustration(config.illustrationId);
                        const hasAsset = !!ill?.assets?.[s.key];
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => set({ illustrationStyle: s.key })}
                            aria-pressed={active}
                            className={`px-2 py-2.5 text-center transition-all ${
                              active
                                ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                                : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60"
                            }`}
                          >
                            <span className="block font-serif text-[13px] text-[#2D2D2D] leading-tight">
                              {s.label}
                            </span>
                            <span className="block font-sans font-light text-[9px] text-[#2D2D2D]/45 mt-0.5">
                              {hasAsset ? s.feel : "Coming soon"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                )}
                <Field label="Font">
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map((f) => {
                      const active = config.fontKey === f.key;
                      const sample =
                        config.mode === "monogram"
                          ? config.monogramLetters || "ABC"
                          : (config.name || "Amelia").split(" ")[0];
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => set({ fontKey: f.key })}
                          aria-pressed={active}
                          className={`px-2 py-3 text-center transition-all ${
                            active
                              ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                              : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60"
                          }`}
                        >
                          <span
                            className="block text-xl leading-tight text-[#2D2D2D] truncate"
                            style={{ fontFamily: f.fontFamily }}
                          >
                            {sample}
                          </span>
                          <span className="font-sans font-medium text-[8px] tracking-[0.1em] uppercase text-[#2D2D2D]/50 mt-1 block">
                            {f.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Ink color">
                  <div className="grid grid-cols-5 gap-1.5">
                    {INK_COLORS.map((c) => {
                      const active = config.inkKey === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => set({ inkKey: c.key })}
                          aria-pressed={active}
                          className={`flex flex-col items-center gap-1.5 py-2 rounded transition-all ${
                            active ? "bg-[#C9A96E]/10" : "hover:bg-[#C9A96E]/5"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full border-2 ${
                              active
                                ? "border-[#2D2D2D] scale-110"
                                : "border-[#C9A96E]/25"
                            } transition-all`}
                            style={{ backgroundColor: c.hex }}
                          />
                          <span
                            className={`font-sans text-[8px] tracking-wide uppercase ${
                              active
                                ? "text-[#2D2D2D] font-medium"
                                : "text-[#2D2D2D]/45"
                            }`}
                          >
                            {c.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}

            {step === "options" && (
              <div className="space-y-6">
                {format.axes.map((axis) => (
                  <Field key={axis.key} label={axis.label} help={axis.helpText}>
                    <div className="flex flex-wrap gap-2">
                      {axis.options.map((o) => {
                        const active = config.options[axis.key] === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() =>
                              set({
                                options: {
                                  ...config.options,
                                  [axis.key]: o.value,
                                },
                              })
                            }
                            aria-pressed={active}
                            className={`px-4 py-2.5 text-left transition-all ${
                              active
                                ? "border-2 border-[#C9A96E] bg-[#C9A96E]/5"
                                : "border border-[#C9A96E]/25 hover:border-[#C9A96E]/60"
                            }`}
                          >
                            <span className="font-sans font-medium text-xs text-[#2D2D2D] block">
                              {o.label}
                              {o.priceDelta ? (
                                <span className="text-[#C9A96E] ml-1">
                                  {o.priceDelta > 0
                                    ? `+$${o.priceDelta}`
                                    : `−$${Math.abs(o.priceDelta)}`}
                                </span>
                              ) : null}
                            </span>
                            {o.sublabel && (
                              <span className="font-sans font-light text-[10px] text-[#2D2D2D]/45">
                                {o.sublabel}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                ))}

                {format.quantityLadder && (
                  <Field label="Set size">
                    <select
                      value={config.quantity}
                      onChange={(e) => set({ quantity: e.target.value })}
                      className="font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-sm text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded-sm"
                    >
                      {format.quantityLadder.map((t) => (
                        <option key={t.qty} value={String(t.qty)}>
                          {t.label} — ${t.price.toFixed(2)} ($
                          {(t.price / t.qty).toFixed(2)}/each)
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
            )}
          </div>

          {/* Rail footer: next-step nudge, or Add to Cart on the final step */}
          <div className="shrink-0 border-t border-[#C9A96E]/15 px-5 lg:px-7 py-3.5 bg-white">
            {nextStep ? (
              <div className="flex items-center justify-between gap-4">
                <p className="font-sans font-light text-[11px] text-[#2D2D2D]/50 leading-snug flex items-center gap-2 min-w-0">
                  <Sparkles size={13} className="text-[#C9A96E] shrink-0" />
                  <span className="truncate">What you see is what we print.</span>
                </p>
                <button
                  type="button"
                  onClick={() => setStep(nextStep.key)}
                  className="shrink-0 font-sans font-medium text-[11px] tracking-[0.12em] uppercase text-[#C9A96E] hover:text-[#b8964f] transition-colors"
                >
                  Next: {nextStep.label} →
                </button>
              </div>
            ) : (
              <CartForm
                route="/cart"
                inputs={{
                  lines: [
                    {
                      merchandiseId: product?.variantId ?? "",
                      quantity: 1,
                      attributes: attrs,
                    },
                  ],
                }}
                action={CartForm.ACTIONS.LinesAdd}
              >
                {(fetcher) => (
                  <button
                    type="submit"
                    onClick={() => open("cart")}
                    disabled={!product || !valid || fetcher.state !== "idle"}
                    className="w-full bg-[#C9A96E] text-white font-sans font-medium text-xs tracking-[0.18em] uppercase py-3.5 hover:bg-[#2D2D2D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {fetcher.state !== "idle"
                      ? "Adding…"
                      : `Add to Cart — $${price.toFixed(2)}`}
                  </button>
                )}
              </CartForm>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/70 mb-2">
        {label}
      </p>
      {children}
      {help && (
        <p className="font-sans font-light text-[11px] text-[#2D2D2D]/45 mt-1.5">
          {help}
        </p>
      )}
    </div>
  );
}
