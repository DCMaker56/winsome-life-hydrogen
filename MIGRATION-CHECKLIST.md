# Migration Checklist — moving Winsome Life to the new (corporate) environment

> For **Daniel** to run when standing up the project in the new Claude environment. Covers moving the code, recreating `.env` secrets securely, and verifying the new instance can build and deploy. **Do not paste secret values into chat, commits, or any Claude message** — handle them only through the channels below.

---

## Part A — Move the code

> **Update 2026-10-09:** the code is now on GitHub — **https://github.com/DCMaker56/winsome-life-hydrogen** (private). On a new machine, just `git clone` it and skip the zip steps below. Only `.env` (Part B) and, if needed, the generated illustration output (`illustrations/generated/`, `illustrations/netlify-app/`, ~460 MB, not in git) still need a manual transfer.

*Original notes (pre-GitHub):* the repo was **local-only** (no git remote, single scaffold commit), so the working files had to be transferred directly.

- [ ] **Zip the project excluding secrets & build junk**, from `/Users/daniel/ClaudeCode`:
  ```bash
  cd /Users/daniel/ClaudeCode && zip -r winsome-life-hydrogen.zip winsome-life-hydrogen \
    -x '*/node_modules/*' -x '*/.env' -x '*/dist/*' -x '*/.cache/*' -x '*/.shopify/*'
  ```
  *(Deliberately excludes `.env` — that moves separately in Part B — plus `node_modules`, build output, and local Shopify link state.)*
- [ ] Transfer the zip to the new environment via your approved corporate channel (see Part C).
- [ ] On the new machine: unzip, then `cd winsome-life-hydrogen && npm install`.
- [ ] *(Optional but recommended)* Initialize source control now so the new env isn't local-only too:
  ```bash
  git add -A && git commit -m "Baseline: Winsome Life storefront migrated from prior environment"
  # then add your corporate remote and push
  ```
  ⚠️ Confirm `.env` is git-ignored **before** the first push. Verify: `git check-ignore .env` should print `.env`. If it doesn't, add `.env` to `.gitignore` first.

---

## Part B — Recreate `.env` (the secrets)

The new environment needs a fresh `.env` at the project root. Below is every key, what it's for, and where to get/regenerate its value. **Type or paste values directly into the new `.env` file on the new machine — never through Claude.**

### Shopify Storefront (required — site won't load without these)
- [ ] `PUBLIC_STORE_DOMAIN` — the myshopify domain (`caatee-kr.myshopify.com`). *Not secret, but required.*
- [ ] `PUBLIC_STOREFRONT_API_TOKEN` — Shopify admin → **Hydrogen/Headless** channel → Storefront API token.
- [ ] `PUBLIC_STOREFRONT_ID` — from the same Hydrogen storefront settings.
- [ ] `PUBLIC_CHECKOUT_DOMAIN` — checkout domain (the store's `.myshopify.com` or custom checkout domain).
- [ ] `SESSION_SECRET` — session signing secret. **Generate a fresh random one for the new env** (don't reuse):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Shopify Customer Account API (only needed for `/account` routes)
- [ ] `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` — Shopify admin → Customer Account API settings.
- [ ] `PUBLIC_CUSTOMER_ACCOUNT_API_URL` — same location.
  *(If `/account` isn't a priority, the site builds without these — the account routes just won't work.)*

### Illustration pipeline (only if you run illustration generation from this env)
- [ ] `RECRAFT_API_KEY` — Recraft dashboard → API keys.
- [ ] `OPENAI_API_KEY` — OpenAI dashboard → API keys (used for `gpt-image-1`).
  *(Not needed to run/deploy the storefront itself — only for the `winsome-illustrations` workflow.)*

### Fastest path if you'd rather copy than regenerate
- [ ] Instead of regenerating each one, you can copy the existing values straight from the current `.env` on this machine:
  ```
  /Users/daniel/ClaudeCode/winsome-life-hydrogen/.env
  ```
  Move that file over your secure channel (Part C) and drop it in the new project root. **Then rotate `SESSION_SECRET`** (generate a fresh one as above) so the two environments don't share a signing key.

---

## Part C — Secure transfer channels (pick one)

Move the `.env` (and the code zip) through a channel that isn't chat/email-in-the-clear:
- [ ] Your corporate **secrets manager / password vault** (1Password, Vault, etc.) — best option; store `.env` as a secure note or document.
- [ ] Encrypted file transfer or the corporate-approved file share.
- [ ] Direct machine-to-machine copy (AirDrop / `scp` over your own network) if both machines are yours.
- [ ] ❌ **Never:** paste secrets into a Claude message, a git commit, Slack, or plain email.

---

## Part D — Verify the new environment

Run these in the new project root, in order:
- [ ] `npm install` — clean install.
- [ ] `cat .env` shows all required keys populated (no `<redacted>` / blanks).
- [ ] `npm run codegen` — succeeds (confirms Storefront API token + domain are valid).
- [ ] `npm run typecheck` — no new errors.
- [ ] `npm run dev` → open http://localhost:3000 — homepage renders, hero + fonts load, no CSP errors in the console.
- [ ] Load a product page (e.g. the dog notepad) — gallery browses, personalization panel shows the **10-font picker**, live text preview updates as you type.
- [ ] **Test deploy:** `cd <project-dir> && npx shopify hydrogen deploy --force --env preview`
  - First run will prompt to authenticate with Shopify (`shopify auth`) and confirm the linked storefront. Link to the **winsome-hydrogen-preview** storefront on shop `caatee-kr.myshopify.com`.
  - Confirm it prints a successful Oxygen deploy URL.

---

## Part E — Confirm the docs are in place
- [ ] `CLAUDE.md` present in project root (auto-loads for the new agent).
- [ ] `HANDOFF.md` present (the full reference).
- [ ] New agent's first action: read `CLAUDE.md` → `HANDOFF.md`, then pick up the **top open thread** (chase the 5 font files from Sydney: Buffalo, Jimmy Script, Chloe, Windslow Regular, Eyesome Script).

---

### Rotation note
If there's any chance the current `.env` was exposed during migration (wrong channel, shared screen, etc.), rotate the affected credentials in Shopify / Recraft / OpenAI after the move. `SESSION_SECRET` should be fresh per environment regardless.
