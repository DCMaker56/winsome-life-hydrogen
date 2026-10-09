/*
 * Design: The Stationery Atelier
 * Campaign Banner (formerly Mother's Day): seasonal promo slot driven by
 * lib/campaign.ts.
 * Layout per CEO feedback: two-column with a solid cream background on
 * the left holding the copy (crisp, legible), and the campaign image
 * bleeding off the right edge. No more full-bleed blur under the text.
 */
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Gift, Heart, ArrowRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { useState } from "react";
import { getActiveCampaign } from "@/lib/campaign";

export default function MothersDayBanner() {
  const campaign = getActiveCampaign();
  const { ref, inView } = useInView({ threshold: 0.15 });
  const [dismissed, setDismissed] = useState(false);

  if (!campaign || dismissed) return null;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#F5EAD7]"
      aria-label={campaign.eyebrow}
    >
      <div className="grid lg:grid-cols-2 min-h-[460px] lg:min-h-[520px]">
        {/* Left: Copy on solid cream */}
        <div className="relative flex items-center py-12 lg:py-0">
          <div className="container lg:pl-16 lg:pr-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-lg"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A96E] text-white">
                  <Heart size={12} strokeWidth={2} fill="currentColor" />
                  <span className="font-sans font-semibold text-[10px] tracking-[0.25em] uppercase">
                    {campaign.eyebrow}
                  </span>
                </div>
              </div>

              {/* Headline — solid charcoal + Parisian Script accent */}
              <h2 className="font-serif font-medium text-4xl md:text-5xl lg:text-[3.25rem] text-[#2D2D2D] leading-[1.05] mb-5">
                <span
                  className="text-[#C9A96E] block"
                  style={{
                    fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                    fontStyle: "normal",
                    fontSize: "1.25em",
                    lineHeight: "0.95",
                  }}
                >
                  {campaign.headline}
                </span>
              </h2>

              <p className="font-sans font-light text-base md:text-lg text-[#2D2D2D]/75 leading-relaxed mb-7 max-w-md">
                {campaign.subhead}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={campaign.ctaHref}
                  className="font-sans font-medium inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#2D2D2D] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#C9A96E] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
                >
                  <Gift size={14} strokeWidth={1.5} />
                  {campaign.ctaLabel}
                </Link>
                {campaign.secondaryCtaLabel && campaign.secondaryCtaHref && (
                  <Link
                    to={campaign.secondaryCtaHref}
                    className="font-sans inline-flex items-center gap-2 px-6 py-3.5 border border-[#2D2D2D]/25 text-[#2D2D2D] text-xs tracking-[0.2em] uppercase hover:bg-[#2D2D2D] hover:text-white hover:border-[#2D2D2D] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
                  >
                    {campaign.secondaryCtaLabel}
                    <ArrowRight size={13} strokeWidth={1.5} />
                  </Link>
                )}
              </div>

              {campaign.microcopy && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="font-sans font-light mt-5 text-[11px] text-[#2D2D2D]/55"
                >
                  {campaign.microcopy}
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Right: Campaign image */}
        <div className="relative min-h-[300px] lg:min-h-full">
          <img
            src={campaign.image}
            alt={campaign.imageAlt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Soft left-edge fade so the image blends into the cream panel */}
          <div
            className="absolute inset-y-0 left-0 w-24 hidden lg:block pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, #F5EAD7 0%, rgba(245,234,215,0) 100%)",
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-[#2D2D2D]/40 hover:text-[#2D2D2D] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] rounded"
        aria-label="Dismiss banner"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="1" y1="1" x2="13" y2="13" />
          <line x1="13" y1="1" x2="1" y2="13" />
        </svg>
      </button>

      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent" />
    </section>
  );
}
