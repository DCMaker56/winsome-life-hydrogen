/*
 * Design: The Stationery Atelier
 * SubscriptionBadge: A small, elegant badge showing "Subscribe & Save 15%"
 * Used on product cards and gift set cards across the site.
 * Positioned in the bottom-right of the image container.
 */
import { RotateCcw } from "lucide-react";

interface SubscriptionBadgeProps {
  /** Position variant: 'image' renders inside image overlay, 'inline' renders in card info */
  variant?: "image" | "inline";
  /** Custom class overrides */
  className?: string;
}

export default function SubscriptionBadge({
  variant = "image",
  className = "",
}: SubscriptionBadgeProps) {
  if (variant === "inline") {
    return (
      <span
        className={`font-sans font-medium inline-flex items-center gap-1.5 text-[10px] tracking-[0.08em] text-[#C9A96E] ${className}`}

      >
        <RotateCcw size={10} strokeWidth={2} className="text-[#C9A96E]" />
        Subscribe &amp; Save 15%
      </span>
    );
  }

  return (
    <div
      className={`font-sans font-semibold absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/92 backdrop-blur-sm text-[10px] tracking-[0.08em] text-[#C9A96E] shadow-sm ${className}`}

    >
      <RotateCcw size={10} strokeWidth={2} />
      Subscribe &amp; Save 15%
    </div>
  );
}
