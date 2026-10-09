# CLAUDE.md — The Winsome Life Storefront

## 👋 Cover message to the new agent — read first

Welcome. You're taking over active development of **The Winsome Life** Hydrogen storefront, migrated here from another Claude environment. Everything you need to be productive on day one is in **[`HANDOFF.md`](./HANDOFF.md)** — read it top-to-bottom before making any change. It's the single source of truth for this project.

The short version:
- **The Winsome Life** is a personalized luxury stationery brand. This repo is a ground-up rebuild of thewinsomelife.com on **Shopify Hydrogen 2026 + React Router 7 + Tailwind v4**, deployed to **Oxygen** (preview for now).
- The prime directive: **match the current live winsomelife.com as closely as possible**, then improve conversion.
- Work runs in **feedback batches**: the CEO (**Sydney**) reviews the preview, **Daniel** (this environment's owner) relays her notes. You implement, deploy to Oxygen preview, and **report back — explicitly flagging anything you need from them** (assets, decisions, exact values). Daniel wants direct, honest critique, not silent compliance.

Before you touch anything, know these five things (full detail in HANDOFF.md):
1. **Deploy needs the `cd` in the same shell command:** `cd /Users/daniel/ClaudeCode/winsome-life-hydrogen && npx shopify hydrogen deploy --force --env preview` — a bare deploy fails "not a Hydrogen project."
2. **Verify UI on `localhost:3000`** (`npm run dev`), not the Oxygen URL — the preview is password-gated and redirects.
3. **Run `npm run codegen` after any GraphQL query edit**, or typecheck breaks.
4. **Self-host custom fonts via a relative `url()` in `app/styles/app.css`** (Vite content-hashes them → cache-busting); never absolute `/fonts/` paths.
5. **New external domains must be added to the CSP in `app/entry.server.tsx`** or they're blocked in production.

**Two things Daniel must hand you that are NOT in the repo:**
- **`.env` secret values** (Shopify tokens, Recraft/OpenAI keys) — see HANDOFF.md §4 for the key names to recreate.
- *(Code is on GitHub now — clone `https://github.com/DCMaker56/winsome-life-hydrogen` (private). Generated illustration output (~460 MB) is not in git; get it from Daniel if needed.)*

**Commit each feedback batch** and `git push` so GitHub stays the source of truth.

**Top open thread right now:** the personalization font picker is locked to 10 fonts; 5 render from real files, **5 still need font files from Sydney** (Buffalo, Jimmy Script, Chloe, Windslow Regular, Eyesome Script). Chase those, self-host them, redeploy. See HANDOFF.md §6 + §14.

---

## Project quick reference

- **Full handoff / source of truth:** [`HANDOFF.md`](./HANDOFF.md)
- **Dir:** `/Users/daniel/ClaudeCode/winsome-life-hydrogen`
- **Dev:** `npm run dev` → http://localhost:3000
- **Deploy:** automatic — push to `main` deploys (GitHub Actions → Oxygen); other branches get preview URLs. Manual fallback: `cd /Users/daniel/ClaudeCode/winsome-life-hydrogen && npx shopify hydrogen deploy --force --env preview`
- **Codegen (after GraphQL edits):** `npm run codegen`
- **Typecheck:** `npm run typecheck`
- **Illustration work:** invoke the `winsome-illustrations` skill first — those decisions are settled, don't improvise.

## Rules for cloud sessions (claude.ai/code — e.g. Sydney's sessions)

Sydney (CEO, non-technical) makes changes from claude.ai/code. When you are running there:
- **Never push to `main`.** Work on a new branch with a short descriptive name (e.g. `hero-text-mobile`), commit, push, and offer to open a pull request.
- Every push deploys automatically; the commit gets a **"Website preview"** check whose **Details** link opens that branch's preview. Tell her to use it, and that she must be logged in to Shopify to view it.
- **Always give Sydney the Hydrogen preview link in every reply after she makes a request** (her standing instruction). Each push gets a new URL: after pushing, read the "Website preview" commit status on the latest commit (its `target_url`, a `*.myshopify.dev` link) and paste that exact link. If the deploy hasn't finished yet, say so and give the most recent working link.
- **Merging the PR into `main` publishes it** to the main storefront within a few minutes. Remind her to check the preview before merging.
- **Never deploy manually**, never ask for or add secrets/`.env` values, and never edit `.github/workflows/` unless Daniel asks.
- Explain what you changed in plain, non-technical language, and say plainly if something needs Daniel (fonts files, Shopify settings, secrets).
- Run `pnpm install` then `pnpm run typecheck` before pushing; fix errors you introduced.

## Working agreements
- Match the live site first; innovate second unless told otherwise.
- Keep neighboring homepage sections visibly distinct in background color.
- Keep the personalization picker at exactly the 10 approved fonts unless Sydney changes the list.
- Don't reintroduce deleted homepage sections (Shop by Category, old FeatureBands, "Why We're Different").
- Implement a feedback batch fully → deploy to Oxygen preview → report what changed and what you need next.
