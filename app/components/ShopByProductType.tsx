/*
 * ShopByProductType — square tiles for the 6 core product types (per Sydney:
 * same format as the old Shop by Occasion, but each tile carries a product
 * image AND a small icon, kept square). Images resolve in the homepage loader.
 */
import { Link } from "react-router";
import { Mail, StickyNote, Tag, Image as ImageIcon, Wine, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ProductType {
  label: string;
  handle: string;
  image: string | null;
}

const ICONS: Record<string, LucideIcon> = {
  notecards: Mail,
  notepads: StickyNote,
  "gift-tags-stickers": Tag,
  artwork: ImageIcon,
  "wine-tags-1": Wine,
  "place-cards": Utensils,
};

export default function ShopByProductType({
  productTypes,
}: {
  productTypes: ProductType[];
}) {
  if (!productTypes?.length) return null;

  return (
    <section className="py-20 lg:py-24 bg-[#ECF2F5]" aria-label="Shop by product type">
      <div className="container">
        <div className="text-center mb-12">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Find Your Format
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-4">
            Shop by{" "}
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                fontSize: "1.25em",
                lineHeight: "0.9",
                verticalAlign: "-0.05em",
              }}
            >
              Product Type
            </span>
          </h2>
          <div className="gold-rule w-24 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {productTypes.map((t) => {
            const Icon = ICONS[t.handle] ?? Mail;
            return (
              <Link
                key={t.handle}
                to={`/collections/${t.handle}`}
                prefetch="intent"
                className="group relative flex flex-col justify-end aspect-square overflow-hidden ring-1 ring-[#C9A96E]/12 hover:ring-[#C9A96E] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
              >
                {t.image ? (
                  <img
                    src={t.image}
                    alt={t.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <span className="absolute inset-0 bg-[#F3EEE6]" aria-hidden />
                )}
                {/* Gradient so the icon + label read over any image */}
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(45,45,45,0.62) 0%, rgba(45,45,45,0.15) 45%, rgba(45,45,45,0) 72%)",
                  }}
                  aria-hidden
                />
                {/* Icon chip, top-left */}
                <span className="absolute top-3 left-3 flex items-center justify-center w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm ring-1 ring-[#C9A96E]/25">
                  <Icon size={17} strokeWidth={1.5} className="text-[#C9A96E]" />
                </span>
                <span className="relative p-4 text-center">
                  <span className="block font-serif font-medium text-[15px] lg:text-base text-white leading-tight">
                    {t.label}
                  </span>
                  <span className="font-sans font-medium text-[9px] tracking-[0.18em] uppercase text-white/85 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 block">
                    Shop →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
