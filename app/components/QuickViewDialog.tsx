/*
 * Quick View Dialog: lets users peek at product info — price, short
 * description, wishlist toggle, and Shopify add-to-cart — without
 * leaving the current grid. Uses shadcn Dialog (Radix) for a11y.
 */
import { Link } from "react-router";
import { Heart, ExternalLink, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  type Product,
  formatPrice,
} from "@/lib/products";
import { summarizeVariants, VARIANT_PRESETS } from "@/lib/variants";
import { INTERNAL_URLS } from "@/lib/config";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

interface QuickViewDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewDialog({ product, open, onOpenChange }: QuickViewDialogProps) {
  const { has, toggle } = useWishlist();

  if (!product) return null;

  const isWishlisted = has(product.slug);

  const handleWishlist = () => {
    toggle(product.slug);
    toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {
      description: product.title,
      icon: (
        <Heart
          size={16}
          className="text-[#f5b7c2]"
          fill={isWishlisted ? "none" : "#f5b7c2"}
        />
      ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-[#FAF8F5]">
        <DialogTitle className="sr-only">{product.title}</DialogTitle>
        <DialogDescription className="sr-only">{product.description}</DialogDescription>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="aspect-[4/5] md:aspect-auto bg-white overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 md:p-8 flex flex-col">
            {product.badge && (
              <span className="font-sans font-medium self-start inline-block px-3 py-1 text-[10px] tracking-[0.15em] uppercase bg-[#C9A96E] text-white mb-4">
                {product.badge}
              </span>
            )}
            <h2 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D] leading-tight mb-2">
              {product.title}
            </h2>
            <p className="font-sans text-lg text-[#2D2D2D] mb-4">
              {formatPrice(product.price)}
              {product.compareAtPrice && (
                <span className="ml-2 text-sm text-[#2D2D2D]/40 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </p>
            <p className="font-sans font-light text-sm text-[#2D2D2D]/70 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Variant summary chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {summarizeVariants(product.type).map((chip) => (
                <span
                  key={chip}
                  className="font-sans font-medium text-[10px] tracking-[0.08em] uppercase text-[#C9A96E] border border-[#C9A96E]/25 px-2 py-0.5"
                >
                  {chip}
                </span>
              ))}
            </div>

            <ul className="space-y-1.5 mb-6">
              {product.details.slice(0, 3).map((d, i) => (
                <li key={i} className="font-sans font-light text-xs text-[#2D2D2D]/60">
                  · {d}
                </li>
              ))}
            </ul>

            {/* Axes summary (so director can see what options exist) */}
            {VARIANT_PRESETS[product.type].axes.length > 0 && (
              <div className="mb-6 pt-4 border-t border-[#C9A96E]/15 space-y-1">
                {VARIANT_PRESETS[product.type].axes.map((axis) => (
                  <p
                    key={axis.key}
                    className="font-sans font-light text-xs text-[#2D2D2D]/60"
                  >
                    <span className="font-medium uppercase tracking-wider text-[10px] text-[#C9A96E] mr-2">
                      {axis.label}:
                    </span>
                    {axis.options.map((o) => o.label).join(", ")}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-auto space-y-2">
              <Link
                to={INTERNAL_URLS.product(product.slug)}
                onClick={() => onOpenChange(false)}
                className="font-sans font-medium block w-full px-6 py-3 bg-[#2D2D2D] text-white text-sm tracking-[0.15em] uppercase text-center hover:bg-[#C9A96E] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
              >
                View Full Details
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={handleWishlist}
                  className="font-sans font-medium flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#C9A96E]/30 text-sm text-[#2D2D2D] hover:border-[#C9A96E] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
                  aria-pressed={isWishlisted}
                >
                  <Heart
                    size={14}
                    fill={isWishlisted ? "#f5b7c2" : "none"}
                    className={isWishlisted ? "text-[#f5b7c2]" : ""}
                  />
                  {isWishlisted ? "Saved" : "Save"}
                </button>
                <a
                  href={product.shopifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans font-medium flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#C9A96E]/30 text-sm text-[#2D2D2D] hover:border-[#C9A96E] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
                >
                  <ExternalLink size={14} />
                  Buy
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
