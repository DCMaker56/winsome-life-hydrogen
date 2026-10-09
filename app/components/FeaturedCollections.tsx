/*
 * Design: The Stationery Atelier
 * Homepage shopping section, Minted-style:
 *   §1 "Shop by Category" — neutral typographic tiles for every real
 *      collection (no floral photography; calm paper tones + line icons).
 *   §2 "Bestsellers" — a single tidy row of real products.
 * Replaces the old Monogram/Floral/Seasonal filter tabs, which only
 * surfaced a feminine sliver of the catalog.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Mail,
  StickyNote,
  Tag,
  Wine,
  CalendarDays,
  Image as ImageIcon,
  Type,
  Star,
  Heart,
  Eye,
} from "lucide-react";
import { useAllProducts } from "@/hooks/useProducts";
import { formatPrice, type Product } from "@/lib/products";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { QuickViewDialog } from "@/components/QuickViewDialog";
import { useWishlist } from "@/hooks/useWishlist";

const CATEGORIES = [
  { label: "Notecards", handle: "notecards", cat: "notecards", icon: Mail, note: "Flat & folded" },
  { label: "Notepads", handle: "notepads", cat: "notepads", icon: StickyNote, note: "40 or 80 sheets" },
  { label: "Gift Tags", handle: "gift-tags-stickers", cat: "gift-tags", icon: Tag, note: "Tags & stickers" },
  { label: "Wine Tags", handle: "wine-tags-1", cat: "wine-tags", icon: Wine, note: "Hostess favorites" },
  { label: "Calendars", handle: "calendars", cat: "calendars", icon: CalendarDays, note: "Desk & easel" },
  { label: "Artwork", handle: "artwork", cat: "artwork", icon: ImageIcon, note: "Prints & pieces" },
  { label: "Monograms", handle: "monogram-styles", cat: "monogram", icon: Type, note: "12 classic styles" },
  { label: "Bestsellers", handle: "bestsellers", cat: "bestsellers", icon: Star, note: "Customer picks" },
];

// Alternating quiet paper tones — neutral, not floral.
const TILE_TONES = [
  "bg-[#F6F2EA]",
  "bg-[#EFEAE2]",
  "bg-[#F3EEE9]",
  "bg-[#EAE5DC]",
];

export default function FeaturedCollections() {
  const [quickView, setQuickView] = useState<Product | null>(null);
  const { has, toggle } = useWishlist();
  const { data: allProducts } = useAllProducts();

  const bestsellers = useMemo(() => {
    if (!allProducts) return [];
    const starred = allProducts.filter((p) =>
      p.categories.includes("bestsellers"),
    );
    return (starred.length >= 3 ? starred : allProducts).slice(0, 6);
  }, [allProducts]);

  return (
    <section
      className="py-20 lg:py-24 bg-[#FAF8F5]"
      aria-label="Shop our collections"
    >
      <div className="container">
        {/* ── §1 Shop by Category ── */}
        <div className="text-center mb-10">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            The Collections
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
            Shop by{" "}
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                fontSize: "1.3em",
                lineHeight: "0.9",
                verticalAlign: "-0.05em",
              }}
            >
              Category
            </span>
          </h2>
          <div className="gold-rule w-24 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5 mb-20">
          {CATEGORIES.map((cat, i) => {
            const image = allProducts?.find((p) =>
              p.categories.includes(cat.cat),
            )?.images[0];
            return (
              <Link
                key={cat.handle}
                to={`/collections/${cat.handle}`}
                className={`group relative flex flex-col justify-end aspect-[4/3] overflow-hidden ring-1 ring-[#C9A96E]/15 hover:ring-[#C9A96E] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] ${
                  image ? "" : TILE_TONES[i % TILE_TONES.length]
                }`}
              >
                {image ? (
                  <>
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(45,45,45,0.72) 0%, rgba(45,45,45,0.18) 55%, rgba(45,45,45,0.05) 100%)",
                      }}
                      aria-hidden
                    />
                  </>
                ) : (
                  <cat.icon
                    size={22}
                    strokeWidth={1.4}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] text-[#C9A96E]"
                  />
                )}
                <span className="relative p-4 lg:p-5">
                  <span
                    className={`block font-serif font-medium text-lg lg:text-xl leading-tight ${
                      image ? "text-white" : "text-[#2D2D2D]"
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span
                    className={`block font-sans font-light text-[11px] mt-0.5 ${
                      image ? "text-white/75" : "text-[#2D2D2D]/50"
                    }`}
                  >
                    {cat.note}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── §2 Bestsellers ── */}
        {bestsellers.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D]">
                Bestsellers
              </h2>
              <Link
                to="/collections/bestsellers"
                className="font-sans font-medium text-xs tracking-[0.15em] uppercase text-[#C9A96E] hover:text-[#2D2D2D] transition-colors"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {bestsellers.map((product) => {
                const isWishlisted = has(product.slug);
                return (
                  <article
                    key={product.id}
                    className="group relative bg-white overflow-hidden ring-1 ring-[#C9A96E]/10 hover:ring-[#C9A96E]/40 transition-all"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(product.slug);
                      }}
                      aria-pressed={isWishlisted}
                      aria-label={
                        isWishlisted
                          ? `Remove ${product.title} from wishlist`
                          : `Save ${product.title} to wishlist`
                      }
                      className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-white focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                    >
                      <Heart
                        size={16}
                        fill={isWishlisted ? "#f5b7c2" : "none"}
                        className={isWishlisted ? "text-[#f5b7c2]" : "text-[#2D2D2D]"}
                      />
                    </button>

                    <Link
                      to={`/products/${product.slug}`}
                      className="block focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
                    >
                      <div className="relative overflow-hidden aspect-[4/5] bg-[#FAF8F5]">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-contain p-3 transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                        {product.badge && (
                          <div className="font-sans font-medium absolute top-4 left-4 px-3 py-1 text-xs tracking-[0.15em] uppercase bg-[#C9A96E] text-white">
                            {product.badge}
                          </div>
                        )}
                        <SubscriptionBadge />
                      </div>
                    </Link>

                    <button
                      onClick={() => setQuickView(product)}
                      className="font-sans font-medium absolute left-1/2 -translate-x-1/2 bottom-[120px] inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#2D2D2D] text-xs tracking-[0.15em] uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 transition-all duration-400 shadow-md focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
                      aria-label={`Quick view ${product.title}`}
                    >
                      <Eye size={14} />
                      Quick View
                    </button>

                    <Link
                      to={`/products/${product.slug}`}
                      className="block p-5 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-[-2px]"
                    >
                      <h3 className="font-serif font-medium text-base text-[#2D2D2D] leading-snug group-hover:text-[#C9A96E] transition-colors duration-300 line-clamp-2 min-h-[2.6rem] mb-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-medium text-sm text-[#2D2D2D]">
                          {product.type === "notecard" ||
                          product.type === "gift-tag" ||
                          product.type === "wine-tag"
                            ? `From ${formatPrice(product.price)}`
                            : formatPrice(product.price)}
                        </span>
                        <span className="font-sans font-medium text-[11px] tracking-[0.1em] uppercase text-[#C9A96E]">
                          View →
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <QuickViewDialog
        product={quickView}
        open={!!quickView}
        onOpenChange={(open) => !open && setQuickView(null)}
      />
    </section>
  );
}
