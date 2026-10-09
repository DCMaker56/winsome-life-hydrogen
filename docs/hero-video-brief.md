# The Winsome Life — Hero Video Brief

A brief for the homepage background video. Hand this to a videographer, or use
it to choose royalty-free stock. When the file exists, it drops into one line:
`HERO_VIDEO = "<url>"` in `app/components/HeroSection.tsx`.

## The feeling (Sydney's words)

> Quality. Elegant. Elevated. Tasteful. **Authentic connection.**

The emotional throughline: *words on paper that last.* A note you wrote — or
received — years ago can transport you. Self-expression through beautiful paper
and what's written on it. The video should evoke **connection, quality, and
beauty** — calm and unhurried, never busy or "commercial."

Tagline that sits over it: **"Uniquely You. On Paper."**

## Look & feel

- **Palette:** warm neutrals — cream, ivory, linen, soft white, with gold and
  muted sage/blush accents. No bright or saturated color. Match the site:
  cream `#FAF8F5`, charcoal `#2D2D2D`, gold `#C9A96E`.
- **Light:** soft, natural, directional (window light / golden hour). Gentle
  shadows. Slightly overexposed highlights are welcome — airy, not moody.
- **Motion:** slow, deliberate, macro. Shallow depth of field. Think *meditative*,
  not energetic. Every shot should feel like it could be paused and framed.
- **Surfaces:** linen, marble, warm wood, fine cotton paper with visible texture.
- **Hands:** elegant, natural, unhurried — a few well-manicured hands, no faces
  needed. Inclusive and timeless.

## Shot list (4–6 shots, ~3–5s each)

1. **The pen meets paper** — extreme close-up, a fountain or calligraphy pen
   drawing the first stroke of a name in script. Ink catching the light.
2. **Wax seal** — a brass seal pressed into warm wax on the back of an envelope,
   lifting away to reveal the monogram. (Signature luxury-stationery moment.)
3. **The suite, arranged** — overhead, hands laying out a coordinated set:
   notecard, envelope, gift tag, a sprig of eucalyptus, twine. Slow reveal.
4. **Texture & detail** — macro drift across letterpress/printed texture, deckled
   edge, gold foil glinting as the light moves.
5. **The personal touch** — a hand sliding a finished, personalized card into an
   envelope, or tying a gift tag onto a wrapped gift with twine.
6. *(optional, emotional anchor)* — someone opening/reading a handwritten card,
   a soft smile implied (hands + card only, face optional).

Open on shot 1 or 2 (the most arresting), close on shot 5 (the "gift" payoff so
it loops back to the beginning gracefully).

## Technical specs (for the homepage hero)

- **Aspect:** 16:9, full-bleed. Composition must keep the **left third clean**
  (lighter / less busy) — the ivory copy panel + tagline sit there on desktop.
- **Duration:** 12–25s, **seamless loop** (first and last frame should match so
  it cycles invisibly).
- **No audio needed** — it plays muted/autoplay. (Capture sound anyway for
  social cutdowns.)
- **No on-screen text or people's faces** — the site adds the headline; the
  video is pure atmosphere.
- **Delivery:** `.mp4` (H.264) **and** `.webm` (VP9) for browser coverage.
  Master 4K, export the web loop at 1920×1080.
- **File size:** target **≤ 4–6 MB** for the web loop (compress hard — it's a
  muted background; quality tolerance is generous). A 1280×720 version ≤ 2.5 MB
  is ideal for mobile.
- **Poster frame:** pick one beautiful still (likely the suite-arranged overhead)
  — it shows before the video loads and on reduced-motion/low-bandwidth. The
  current hero photo serves as the fallback today.

## Stock-footage route (if not filming)

Search Pexels, Artgrid, Storyblocks, or Filmsupply for: *calligraphy writing
macro, wax seal stamp, wedding invitation suite flat lay, fountain pen ink close
up, letterpress texture, hands writing letter natural light*. Pick clips that
share one consistent light/palette so a 4–6 shot edit feels like one piece.

## How it ships

1. Host the final `.mp4`/`.webm` (Shopify Files, a CDN, or `public/`).
2. Set `const HERO_VIDEO = "<url>"` in `HeroSection.tsx`.
3. Done — the backdrop swaps from the animated still to the real video, with the
   current photo automatically becoming the poster/fallback. Everything else
   (tagline, panel, CTAs) is unchanged.
