/**
 * Campaign banner config.
 *
 * The seasonal promo slot (MothersDayBanner on the home page) reads from
 * this file. To swap campaigns, edit one value here — no component edits
 * required. Set `active: false` to hide the banner entirely.
 *
 * Upgrade path: replace this file with a fetch from a CMS or feature-flag
 * service; the Campaign type stays the same.
 */

export interface Campaign {
  active: boolean;
  /** Short eyebrow label, e.g. "Mother's Day Collection" */
  eyebrow: string;
  /** Headline, e.g. "Made to Be Treasured" */
  headline: string;
  /** Supporting copy under the headline */
  subhead: string;
  /** Primary CTA label */
  ctaLabel: string;
  /** Primary CTA href — use `internal()` or `shopify()` helpers */
  ctaHref: string;
  /** Secondary CTA label */
  secondaryCtaLabel?: string;
  /** Secondary CTA href */
  secondaryCtaHref?: string;
  /** Small "starts from" / "ships by" line beneath CTAs */
  microcopy?: string;
  /** Hero image URL */
  image: string;
  /** Short alt text */
  imageAlt: string;
  /** End date (ISO). Banner auto-deactivates after this. Omit for indefinite. */
  endsAt?: string;
}

export const CURRENT_CAMPAIGN: Campaign = {
  active: true,
  eyebrow: "Mother's Day Collection",
  headline: "Beautifully Personal",
  subhead:
    "Our curated Mother's Day gift sets pair watercolor art with personalized stationery, a matching mug, and more — all wrapped and ready to give.",
  ctaLabel: "Shop Gift Sets",
  ctaHref: "/gift-sets",
  secondaryCtaLabel: "Browse All",
  secondaryCtaHref: "/collections/all",
  microcopy: "5-piece sets from $98 · Save up to $30 · Free shipping over $75",
  image:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663510562926/j8eawuYxyibob6S8H2yeLJ/mothers-day-banner-GYkFnmrEE9HV5uUe7k6y6h.webp",
  imageAlt:
    "Mother's Day gift set with personalized notecards, peonies, and a matching mug",
  endsAt: "2026-05-11T23:59:59-07:00",
};

/** Returns the campaign if active and not expired, else null. */
export function getActiveCampaign(): Campaign | null {
  if (!CURRENT_CAMPAIGN.active) return null;
  if (CURRENT_CAMPAIGN.endsAt && new Date(CURRENT_CAMPAIGN.endsAt) < new Date()) {
    return null;
  }
  return CURRENT_CAMPAIGN;
}
