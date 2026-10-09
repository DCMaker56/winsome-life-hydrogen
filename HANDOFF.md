# The Winsome Life — Hydrogen Storefront · Developer Handoff

> **Purpose of this file:** everything a new Claude agent (or engineer) needs to pick up development of this project and continue where we left off. Written 2026-09-29. Read this top-to-bottom before making changes.

---

## 1. What this project is

**The Winsome Life** (thewinsomelife.com) is a personalized luxury stationery brand. This repo is a **from-scratch rebuild of the storefront** on the modern Shopify Hydrogen stack, deployed to Shopify **Oxygen** (preview environment for now). The single guiding directive from the CEO has been consistent:

> **Match the current live winsomelife.com as closely as possible** — fonts, layout, sections, copy, imagery — then improve conversion from there.

Work proceeds in **iterative feedback batches**: the CEO (**Sydney**) reviews the preview and sends notes; **Daniel** (the repo owner, `danieljcline@gmail.com`, git author `DCMaker56`) relays them. You implement, deploy to Oxygen preview, and report back — including telling Sydney when you need assets (e.g. font files) from her.

### The people
- **Sydney** — CEO. Source of product/design feedback. Owns brand decisions.
- **Darlene** — the artist behind the watercolor illustrations (appears on the About page).
- **Daniel** — owner of this environment; relays feedback, approves technical calls. Prefers **direct critique**, prototype-first iteration, and being told plainly when something needs input from him/Sydney.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Shopify **Hydrogen `^2026.4.1`** |
| Router | **React Router 7** (`7.12.0`) — *not* Remix; uses `react-router typegen`, `Route.LoaderArgs`, `+types/*` |
| Styling | **Tailwind CSS v4** (`@theme`, `@source not` directives in CSS; no `tailwind.config.js`) |
| Build/dev | Vite + Mini-Oxygen (`shopify hydrogen dev`) |
| Data | Shopify **Storefront GraphQL API** (codegen'd types in `storefrontapi.generated.d.ts`) |
| Deploy | **Oxygen** via `shopify hydrogen deploy` |
| Node | v24.14.1 |

### Scripts (package.json)
```bash
npm run dev        # shopify hydrogen dev --codegen  → http://localhost:3000
npm run build      # shopify hydrogen build --codegen
npm run codegen    # shopify hydrogen codegen && react-router typegen  (run after editing any GraphQL query)
npm run typecheck  # react-router typegen && tsc --noEmit
npm run lint
```

---

## 3. How to run & deploy

### Local dev
```bash
cd /Users/daniel/ClaudeCode/winsome-life-hydrogen && npm run dev
```
Preview at **http://localhost:3000**. A `.claude/launch.json` config named `winsome-hydrogen` runs this on port 3000 (use the preview/browser tooling with `{name: "winsome-hydrogen"}`).

### Deploy to Oxygen preview
**⚠️ The `cd` MUST be in the same shell command** — the shell cwd resets between calls, and a bare `npx shopify hydrogen deploy` fails with *"not a Hydrogen project."*
```bash
cd /Users/daniel/ClaudeCode/winsome-life-hydrogen && npx shopify hydrogen deploy --force --env preview
```
Run `npm run codegen` first if you touched any GraphQL query, or typecheck will surface `any` errors.

- **Current Oxygen preview URL:** `https://01m3m33fj97c2pk9c0bb6s1qy4-4f00c19d89db78b8b7cf.myshopify.dev`
  (This URL changes per deployment — the deploy command prints the new one. The preview is **password-gated**: unauthenticated requests redirect to `accounts.shopify.com`, so **verify UI work on `localhost:3000`, not on the Oxygen URL.**)
- **Linked storefront:** `.shopify/project.json` → shop `caatee-kr.myshopify.com` ("The Winsome Life"), Hydrogen storefront `winsome-hydrogen-preview` (`gid://shopify/HydrogenStorefront/1000144967`).

### Git
- **Remote:** private GitHub repo **https://github.com/DCMaker56/winsome-life-hydrogen** (branch `main`, tracking `origin/main`). Pushed 2026-10-09.
- **History:** `046b32b Scaffold Storefront` → `efe7c74 Baseline` (snapshot of all work through 2026-10-09). From here on, **commit each feedback batch** before/after deploying so changes can be rolled back.
- **Deploy is still manual via Oxygen** (`shopify hydrogen deploy`), not triggered by GitHub pushes. GitHub→Oxygen auto-deploy is a possible next step.
- **Not in git (by design):** `.env` / `.env.*`, `node_modules`, `dist`, `.shopify`, and the generated illustration output `illustrations/generated/` + `illustrations/netlify-app/` (~460 MB; pipeline scripts *are* tracked). Those generated images exist only on Daniel's Mac.
- New machine: `git clone https://github.com/DCMaker56/winsome-life-hydrogen.git`, then recreate `.env` (§4) and `npm install`.

---

## 4. Environment variables

`.env` exists locally (names below — **values are secrets, not in this file**). The new environment must recreate `.env` with real values (get them from Daniel / Shopify admin):

```
SESSION_SECRET
PUBLIC_STORE_DOMAIN
PUBLIC_STOREFRONT_API_TOKEN
PUBLIC_STOREFRONT_ID
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID   # only for /account routes
PUBLIC_CUSTOMER_ACCOUNT_API_URL
PUBLIC_CHECKOUT_DOMAIN
RECRAFT_API_KEY                          # illustration pipeline
OPENAI_API_KEY                           # illustration pipeline (gpt-image-1)
```

---

## 5. Architecture & key files

### Content Security Policy — `app/entry.server.tsx`
CSP is built with `createContentSecurityPolicy` and a nonce. **Any new external domain (image host, script, font, API) must be added to the correct allowlist here or it will be blocked in production.** Currently allowlisted: Shopify CDN, `*.cloudfront.net`, `www.thewinsomelife.com` (live-site images), Unsplash, Google Fonts (`fonts.gstatic.com`), and Google Ads/gtag domains (`googletagmanager`, `google-analytics`, `google.com`, `doubleclick.net`).

### Site chrome
- `app/root.tsx` — HTML shell. Loads Google Fonts via `<link>`, renders **gtag.js** (Google Ads **AW-17795546793**, nonce'd), and site-wide JSON-LD (`organizationJsonLd`, `websiteJsonLd`). Wraps everything in `WinsomeLayout`.
- `app/components/WinsomeLayout.tsx` — header/nav/footer wrapper.
- Nav: Title Case tabs (not all-caps), order = **Shop by Collection first … Shop All last**.

### Homepage — `app/routes/_index.tsx`
Loader fetches multiple collections in **one aliased GraphQL query** (`c0:`, `t0:` alias pattern), plus `INTEREST_QUERY` and `PRODUCT_TYPE_QUERY`. Returns `interests`, `productTypes`, `holidayImage`.

**Final section order (per Sydney — this is the source of truth):**
1. **Hero** (`HeroSection.tsx`) — desk-scene slideshow; autumn slide FIRST with text on LEFT; "Uniquely You. On Paper." animates word-by-word; watercolor honeybee does a figure-8 around "You," landing top-right.
2. **Marquee** (`Marquee.tsx`) — blue `#CADEEA`.
3. **Best Sellers / Holiday Essentials** (`TwoUpFeature.tsx`) — Holiday tile uses a real Christmas-collection product image via `holidayImage` prop.
4. **Shop by Interest** (`DesignWall.tsx`) — 10 circular genre tiles; bg `#ECF2F5`.
5. **Founder's Welcome** (`BrandStory.tsx`) — centered, script "FOUNDER'S WELCOME" title, bird-of-paradise floral (`birdofparadise.jpg`, `mix-blend-multiply`), Sydney signature script, Learn More; bg `#F6F0E7`.
6. **Value bar** (`ValueProps.tsx`) — beige `#EAE1CE`; 4 props (Exceptional Customer Service · Fine Quality/Luxury Materials · Original Art/Stunning Watercolors · Personalized Gifts for All Interests).
7. **Quotes** (`SocialProof.tsx`) — 3-up review carousel, script drop-cap first letter; bg `#ECF2F5`.
8. **Trending & Popular** (`TrendingPopular.tsx`) — script T/P header + Sparkles flourish; left copy box `#CADEEA`; right scrolling carousel; section bg `#FAF8F5`.
9. **Notes Worth Saluting** (`CollectionRow.tsx` with `stars` prop) — red `#9E1B32` / blue `#1B294E` stars under the title.
10. **Shop by Product Type** (`ShopByProductType.tsx`) — 6 square tiles (icon chip + product image); bg `#ECF2F5`.

**Rule: neighboring sections must have visibly distinct background colors.** Deleted per Sydney: Shop by Category, the 3 old FeatureBands, "Why We're Different." (`FeatureBand.tsx`, `ShopByOccasion.tsx` etc. may still exist in the tree but are not used on the homepage — don't reintroduce them.)

### Product detail pages (PDP) — `app/routes/products.$handle.tsx`
This is the **"classic" personalize-only experience** for existing catalog products (distinct from the Studio — see §7):
- Gallery above the fold: browsable with prev/next arrows (`ChevronLeft/Right`), an "n / N" counter, all thumbnails, `maxHeight: calc(100vh - 300px)`. `PRODUCT_QUERY` fetches `images(first: 100)`.
- Buy box shows the **full** `product.descriptionHtml` (styled via `.pdp-rte` in app.css) — not truncated. The old duplicate lower "Product Details" section was removed.
- Personalization via `PersonalizationPanel` with `hideMonogram={true}` and `textLabel="Text"` by default (see `PDP_PERSONALIZATION_OVERRIDES` map — currently empty, so all products get the name-only default).
- JSON-LD Product + breadcrumbs + related-products grid; canonical + OG meta.

### Personalization — `app/components/PersonalizationPanel.tsx` + `app/lib/variants.ts`
- **`variants.ts`** holds `FONTS`, `INK_COLORS`, and the personalization schema.
- **Live preview** renders the text field's current value in the chosen font + ink color and updates as you type. (Historic bug: NOTEPAD schema spread STANDARD which had `monogramStyles`, defaulting mode to "monogram" so the preview read monogram letters instead of the text field. Fixed by forcing `mode:'name'` when `hideMonogram` is set. **Don't regress this.**)
- Preview chip label: **"Preview (this is the text how it will appear on your item)"**.
- Ink defaults to **black**.

---

## 6. Fonts (⚠️ active area — read before touching)

### Two font systems, don't confuse them:
1. **Site chrome fonts** (headings/body/brand script). Live-site match:
   - Heading = **Cormorant** · Body = **Montserrat** · Script accent = **Parisian Script**.
   - "Personalized Stationery" subtitle + the "You." in the hero render in **Parisian Script** (black).
   - *(Note: `root.tsx` currently also loads Playfair Display / Source Sans from the scaffold — the brand-match fonts are the Google Fonts + Parisian `@font-face`. Verify which family the CSS actually applies before assuming.)*

2. **Personalization font picker** — the customer-facing type chooser on PDPs/Studio. **Sydney locked this to EXACTLY 10 fonts, in this order** (defined in `FONTS` in `variants.ts`; each renders its own sample so the customer previews their text in that face):

   | # | Picker label | Status |
   |---|---|---|
   | 1 | Cormorant SC Bold | ✅ live (Google Fonts, weight 700) |
   | 2 | Cormorant Garamond Medium | ✅ live (Google Fonts, weight 500) |
   | 3 | Pinyon Script | ✅ live (Google Fonts) |
   | 4 | **Buffalo** | ⛔ **font file needed** (falls back to cursive) |
   | 5 | **Jimmy Script** | ⛔ **font file needed** (fallback Sacramento) |
   | 6 | Bebas Neue | ✅ live (Google Fonts) |
   | 7 | **Chloe** | ⛔ **font file needed** (fallback Great Vibes) |
   | 8 | **Windslow Regular** | ⛔ **font file needed** (fallback Cormorant Garamond) |
   | 9 | **Eyesome Script** | ⛔ **font file needed** (fallback Sacramento) |
   | 10 | Parisian Script | ✅ live (self-hosted, see below) |

### Font-loading mechanics (learned the hard way):
- **Parisian Script** is self-hosted. Files live at `app/styles/ParisianScript.woff2` + `.otf`, referenced in `app.css` with a **relative** `url("./ParisianScript.woff2")`. Vite then bundles them into **content-hashed** asset filenames (e.g. `ParisianScript-DvlqgKr8.woff2`), which **cache-busts** — this was the fix for Sydney repeatedly seeing a stale cached font. **Always self-host custom fonts via a relative `url()` in `app.css`, never an absolute `/fonts/...` path** (absolute paths are left unprocessed → no cache-busting → stale-cache complaints).
- There are 5 `@font-face` **stubs** in `app.css` (Buffalo, Jimmy Script, Chloe, Windslow, Eyesome Script) currently pointing at `url("/fonts/<Name>.woff2")` (public path) so they **fail gracefully to fallbacks** until the real files arrive.
- `document.fonts.check(...)` returns **false for a font that hasn't painted yet** (lazy load) — that's a false negative, not a broken font. Verify a font actually renders by **measuring rendered text width** vs. a known fallback (e.g. Cormorant SC 255px vs serif 244px = it loaded).

### ⏳ OUTSTANDING — get these from Sydney (she offered):
Drop these into `public/fonts/` (and/or convert to woff2 + self-host relative like Parisian). **`.otf` / `.ttf` is fine — convert with `fonttools` + `brotli`.** Then update the 5 `@font-face` rules to the hashed relative paths.
- `Buffalo.woff2`, `JimmyScript.woff2`, `Chloe.woff2`, `Windslow.woff2`, `EyesomeScript.woff2`

---

## 7. The two-track product model (important product decision)

Sydney/Daniel drew a hard line between two experiences:
- **Track A — existing catalog products (classic PDP):** personalization only. **No live-canvas builder, no icon swapping.** Just Text + Font + Ink color, with the live text preview. This is `products.$handle.tsx` above.
- **Track B — Product Builder / "Studio"** (`app/routes/studio._index.tsx`, `studio.$format.tsx`, `app/components/studio/*`, `app/lib/studio.ts`): the richer build-your-own canvas. Kept **separate and hideable**. Default studio font = `parisian-script`.

Fulfillment constraint that shapes bundling: the fulfillment partner can co-package only **one partner's items** — notepads, notecards, gift tags, coasters, stickers, bookmarks, small wine tags, bag tags. Keep this in mind for any bundle/upsell feature.

---

## 8. Ink colors
`INK_COLORS` in `variants.ts` = the **30-color chart** Sydney provided (red, dark-red, maroon, pink, coral, island-pink, blue, light-blue, island-blue, baby-blue, sea-blue, navy-blue, green, pine, sea-green, teal, aqua, lime-green, lavender, purple, soft-purple, orange, yellow, dandelion, black, grey, brown, sand, tan, golden). **Hex values are approximations** — if Sydney gives exact hexes, update them. Default ink = **black**.

---

## 9. SEO (built, keep intact)
The site was hardened for SEO so ranking carries over from the live site:
- Full **JSON-LD** via nonced `<JsonLd>` component (`app/components/JsonLd.tsx`, helpers in `app/lib/seo.ts`): Organization, Website, Product, BreadcrumbList.
- `app/routes/[robots.txt].tsx` — hardened robots.
- `app/routes/[sitemap.xml].tsx` + `sitemap.$type.$page[.xml].tsx` — set to `locales: []` (single-locale; avoids phantom hreflang).
- `app/routes/$.tsx` — `storefrontRedirect()` so Shopify's URL redirects work before falling through to 404 (preserves old URL equity).
- Full product descriptions rendered on PDPs (thin-content fix).
- Canonical + OG tags per route.

---

## 10. Other pages
- `app/routes/about.tsx` — team cards use **real live-site people photos** (Sydney: `Screen_Shot_2025-09-08_at_00.10.png`; Darlene: `Dar_with_Painting.heic?width=600`). *(Parked: a full pixel-match rebuild to mirror the live About page — striped bg, section-header graphics, Asset_01–05.)*
- `app/routes/contact.tsx` — branded contact page with a mailto form to `info@thewinsomelife.com`.

---

## 11. Illustration pipeline (separate but related system)
Winsome's watercolor icons/illustrations are produced by a **separate operating system** documented in the `winsome-illustrations` skill (and Daniel's memory). In short: 3 locked AI-prompt styles (Watercolor / Heritage Sketch / Modern Graphic), generated via **gpt-image-1** (painterly) + **Recraft** (vector), a mandatory **rembg** transparent-cutout step, a `library.json` registry + gallery backend (`make.py` / `registry.py` / `library-server.mjs`), deployed on Netlify, and published illustrations feed the Studio on this storefront (`app/data/illustration-feed.ts`, `app/lib/illustrations.tsx`). **If any task touches illustrations, invoke the `winsome-illustrations` skill first — those decisions are settled there, don't improvise.** `honeybee.png` (the watercolor bee in the logo + hero) came from this pipeline.

---

## 12. Assets reference
- `public/honeybee.png` — watercolor bee (logo top-right of wordmark ~18–20° left slant; hero figure-8).
- `public/fonts/ParisianScript.otf` and `app/styles/ParisianScript.{woff2,otf}` — the self-hosted script face.
- Live-site images are pulled from `www.thewinsomelife.com` and the Shopify CDN (both CSP-allowlisted).
- Hero slides: `Winsome_Banner_01` (autumn), `...03.png` (floral), `...04.png` (seaside).

---

## 13. Gotchas / lessons (don't relearn these)
1. **Deploy needs `cd ... &&` in the same command.** (§3)
2. **Self-host fonts via relative `url()` in app.css** for cache-busting; absolute `/fonts/` paths don't get hashed → stale-cache complaints. (§6)
3. **Run `npm run codegen` after any GraphQL edit** or typecheck throws `any` errors.
4. **Verify UI on `localhost:3000`**, not the Oxygen URL (password-gated redirect).
5. **New external domains → add to CSP in `entry.server.tsx`** or they're blocked in prod.
6. **`document.fonts.check` false ≠ broken font** — measure rendered width instead.
7. **Don't reintroduce deleted homepage sections** (Shop by Category, old FeatureBands, "Why We're Different").
8. Programmatic `window.scrollTo` often doesn't move the browser-pane; use the pane's `computer` scroll action (max `scroll_amount` 10).
9. `HeroSection` — use `loading`, not `fetchpriority` (the latter is a TS error on the img type here).

---

## 14. State at handoff (2026-09-29)
- ✅ **Just deployed:** the 10-font personalization picker (correct order, weights, live sample previews). 5 of 10 faces render from real files; 5 await font files from Sydney.
- ✅ Live-site match: fonts, nav, hero, homepage section order/backgrounds, Founder's Welcome, value bar, quotes, Trending, Notes Worth Saluting, Shop by Product Type.
- ✅ PDP classic experience: browsable gallery, full description, live text preview, "Text" field, black-default ink, 30-color chart.
- ✅ SEO (JSON-LD, redirects, robots, sitemap, canonical), gtag (AW-17795546793), Contact + About functional.

### Immediate next steps for the new agent
1. **Get the 5 font files from Sydney** (Buffalo, Jimmy Script, Chloe, Windslow Regular, Eyesome Script), self-host them (relative `url()` in `app.css`, convert to woff2), redeploy. This is the top open thread.
2. Recreate `.env` with real secret values (from Daniel / Shopify admin) — see §4.
3. Await the next feedback batch from Sydney via Daniel.

### Parked / backlog
- Full pixel-match rebuild of the About page.
- Confirm exact ink hexes if Sydney supplies them.
- Define the monogram-eligible item list.
- Product-line roadmap for **non-personalized themed seasonal products** (e.g. Halloween mugs) — a strategic thread Daniel raised re: improving ad conversion, since personalization may slow conversion. Research on stationery-adjacent seasonal lines was requested.
- Bundle/upsell feature (respecting the single-fulfillment-partner co-packaging constraint, §7).

---

## 15. How to work with this project
- **Match the live site first**, innovate second, unless told otherwise.
- Sydney's feedback comes in **batches** relayed by Daniel — implement fully, deploy to Oxygen preview, then **report what changed and explicitly flag anything you need from them** (assets, decisions, exact values).
- Daniel wants **direct, honest critique** — say when something is a bad idea or when a request needs input, don't just comply silently.
- Keep neighboring section backgrounds distinct; keep the personalization picker at exactly the 10 approved fonts unless Sydney changes the list.
