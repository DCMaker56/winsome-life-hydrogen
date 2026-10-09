/*
 * Template source — the consumer side of the composer↔studio seam.
 *
 * The internal product composer publishes each format as a ProductTemplate in
 * this app's own shape, at a CORS-open URL. This helper fetches it and merges
 * the authored fields over the hardcoded STUDIO_FORMATS baseline.
 *
 * Safety first (this runs on the live storefront):
 *   • Hard fallback to STUDIO_FORMATS on ANY error or timeout.
 *   • Short abort timeout so a slow composer never stalls a page render.
 *   • Targeted merge — only known-safe fields are overridden, so an unexpected
 *     payload can't corrupt the format the renderer depends on.
 *
 * Flip the seam on/off with COMPOSER_TEMPLATES_URL (unset = always hardcoded).
 */
import { STUDIO_FORMATS, type StudioFormat, type StudioFormatKey } from "~/lib/studio";

// On by default (points at the live composer). To DISABLE the seam, set
// COMPOSER_TEMPLATES_URL="" in the Oxygen env — that forces the hardcoded path.
const COMPOSER_ENV =
  typeof process !== "undefined" ? process.env?.COMPOSER_TEMPLATES_URL : undefined;
const COMPOSER_BASE =
  COMPOSER_ENV === undefined
    ? "https://winsome-studio.vercel.app/api/contract/templates"
    : COMPOSER_ENV; // empty string ⇒ disabled

const FETCH_TIMEOUT_MS = 2500;

/** Fetch the authored ProductTemplate for a format, merged over the baseline.
 *  Always returns a usable StudioFormat — never throws. */
export async function loadStudioFormat(
  key: StudioFormatKey,
): Promise<StudioFormat> {
  const baseline = STUDIO_FORMATS[key];
  if (!baseline) return baseline; // caller handles 404
  if (!COMPOSER_BASE) return baseline;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${COMPOSER_BASE}/${key}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return baseline;
    const t = (await res.json()) as Partial<StudioFormat> & Record<string, unknown>;

    // Targeted, type-guarded merge — only fields the renderer reads.
    const merged: StudioFormat = { ...baseline };
    if (typeof t.label === "string") merged.label = t.label;
    if (typeof t.sizeNote === "string") merged.sizeNote = t.sizeNote;
    if (typeof t.width === "number") merged.width = t.width;
    if (typeof t.height === "number") merged.height = t.height;
    if (Array.isArray(t.zones) && t.zones.length) merged.zones = t.zones as StudioFormat["zones"];
    if (Array.isArray(t.scenes)) merged.scenes = t.scenes as StudioFormat["scenes"];
    if (Array.isArray(t.axes)) merged.axes = t.axes as StudioFormat["axes"];
    if (Array.isArray(t.quantityLadder))
      merged.quantityLadder = t.quantityLadder as StudioFormat["quantityLadder"];
    if (t.hole && typeof t.hole === "object") merged.hole = t.hole as StudioFormat["hole"];
    if (t.ruledLines && typeof t.ruledLines === "object")
      merged.ruledLines = t.ruledLines as StudioFormat["ruledLines"];
    return merged;
  } catch {
    return baseline; // network error, timeout, bad JSON → safe fallback
  }
}
