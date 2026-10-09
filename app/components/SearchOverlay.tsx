/*
 * Design: The Stationery Atelier
 * SearchOverlay: Full-screen command-palette style search overlay.
 * Searches across products and gift sets with instant filtering.
 * Triggered from the navbar search icon. Keyboard shortcut: Cmd/Ctrl + K.
 * Uses the existing cmdk-based Command primitives from shadcn/ui.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAllProducts, useCollections } from "@/hooks/useProducts";
import { formatPrice, type Product } from "@/lib/products";
import { giftSets, type GiftSet } from "@/lib/bundles";
import {
  Search,
  Package,
  Gift,
  Tag,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Popular searches for quick access
const popularSearches = [
  { label: "Monogram Notecards", slug: "/collections/monogram-styles" },
  { label: "Monogram Sets", slug: "/collections/monogram" },
  { label: "Gift Sets", slug: "/gift-sets" },
  { label: "Wedding Stationery", slug: "/collections/weddings" },
  { label: "Build Your Own", slug: "/build-your-own" },
];

const quickLinks = [
  { label: "All Collections", href: "/collections/all", icon: Package },
  { label: "Gift Sets", href: "/gift-sets", icon: Gift },
  { label: "Bestsellers", href: "/collections/bestsellers", icon: TrendingUp },
  { label: "Build Your Own", href: "/build-your-own", icon: Sparkles },
];

export default function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: products = [] } = useAllProducts();
  const { data: collections = [] } = useCollections();

  // Reset query when overlay closes
  useEffect(() => {
    if (!open) {
      // Small delay so the animation finishes before clearing
      const timer = setTimeout(() => setQuery(""), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [query]);

  // Filter gift sets
  const filteredGiftSets = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return giftSets.filter(
      (gs) =>
        gs.name.toLowerCase().includes(q) ||
        gs.tagline.toLowerCase().includes(q) ||
        gs.categoryLabel.toLowerCase().includes(q) ||
        gs.category.toLowerCase().includes(q)
    );
  }, [query]);

  // Filter collections
  const filteredCollections = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return collections.filter(
      (c) =>
        c.slug !== "all" &&
        (c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q))
    );
  }, [query]);

  const hasResults = filteredProducts.length > 0 || filteredGiftSets.length > 0 || filteredCollections.length > 0;
  const isSearching = query.trim().length > 0;

  const handleSelect = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Search</DialogTitle>
        <DialogDescription>Search products, gift sets, and collections</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-[600px] bg-[#FAF8F5] border-[#C9A96E]/20"
        showCloseButton={false}
      >
        <Command
          className="bg-[#FAF8F5]"
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-[#C9A96E]/20 px-4 py-3">
            <Search size={18} className="text-[#C9A96E] shrink-0" />
            <CommandInput
              placeholder="Search products, gift sets, collections..."
              value={query}
              onValueChange={setQuery}
              className="font-sans text-[#2D2D2D] placeholder:text-[#2D2D2D]/40 text-base"

            />
            <kbd
              className="font-sans hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-wider uppercase text-[#2D2D2D]/40 border border-[#C9A96E]/20 rounded bg-white/50"

            >
              ESC
            </kbd>
          </div>

          <CommandList className="max-h-[400px] overflow-y-auto">
            {/* No results */}
            {isSearching && !hasResults && (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-3 py-8">
                  <Search size={32} className="text-[#C9A96E]/40" />
                  <p
                    className="font-sans text-sm text-[#2D2D2D]/60"

                  >
                    No results found for "{query}"
                  </p>
                  <p
                    className="font-sans text-xs text-[#2D2D2D]/40"

                  >
                    Try searching for "peony," "monogram," or "lacrosse"
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* Default state: Popular searches & quick links */}
            {!isSearching && (
              <>
                <CommandGroup>
                  <div
                    className="font-sans px-2 py-2 text-xs tracking-[0.15em] uppercase text-[#C9A96E] font-semibold"

                  >
                    Popular Searches
                  </div>
                  {popularSearches.map((item) => (
                    <CommandItem
                      key={item.slug}
                      value={item.label}
                      onSelect={() => handleSelect(item.slug)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-[#C9A96E]/5 data-[selected=true]:bg-[#C9A96E]/10"
                    >
                      <TrendingUp size={14} className="text-[#C9A96E]/60 shrink-0" />
                      <span
                        className="font-sans text-sm text-[#2D2D2D]"

                      >
                        {item.label}
                      </span>
                      <ArrowRight size={12} className="ml-auto text-[#2D2D2D]/30" />
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator className="bg-[#C9A96E]/10" />

                <CommandGroup>
                  <div
                    className="font-sans px-2 py-2 text-xs tracking-[0.15em] uppercase text-[#C9A96E] font-semibold"

                  >
                    Quick Links
                  </div>
                  {quickLinks.map((item) => (
                    <CommandItem
                      key={item.href}
                      value={item.label}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-[#C9A96E]/5 data-[selected=true]:bg-[#C9A96E]/10"
                    >
                      <item.icon size={14} className="text-[#C9A96E]/60 shrink-0" />
                      <span
                        className="font-sans text-sm text-[#2D2D2D]"

                      >
                        {item.label}
                      </span>
                      <ArrowRight size={12} className="ml-auto text-[#2D2D2D]/30" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Products results */}
            {filteredProducts.length > 0 && (
              <CommandGroup>
                <div
                  className="font-sans px-2 py-2 text-xs tracking-[0.15em] uppercase text-[#C9A96E] font-semibold flex items-center gap-2"

                >
                  <Package size={12} />
                  Products
                  <span className="text-[#2D2D2D]/30 font-normal">
                    ({filteredProducts.length})
                  </span>
                </div>
                {filteredProducts.slice(0, 5).map((product) => (
                  <ProductResult
                    key={product.id}
                    product={product}
                    onSelect={() => handleSelect(`/products/${product.slug}`)}
                  />
                ))}
                {filteredProducts.length > 5 && (
                  <CommandItem
                    value="view-all-products"
                    onSelect={() => handleSelect("/collections/all")}
                    className="flex items-center justify-center gap-2 px-3 py-2 cursor-pointer text-[#C9A96E] hover:bg-[#C9A96E]/5 data-[selected=true]:bg-[#C9A96E]/10"
                  >
                    <span
                      className="font-sans font-semibold text-xs tracking-wide uppercase"

                    >
                      View all {filteredProducts.length} products
                    </span>
                    <ArrowRight size={12} />
                  </CommandItem>
                )}
              </CommandGroup>
            )}

            {/* Gift Sets results */}
            {filteredGiftSets.length > 0 && (
              <>
                {filteredProducts.length > 0 && (
                  <CommandSeparator className="bg-[#C9A96E]/10" />
                )}
                <CommandGroup>
                  <div
                    className="font-sans px-2 py-2 text-xs tracking-[0.15em] uppercase text-[#C9A96E] font-semibold flex items-center gap-2"

                  >
                    <Gift size={12} />
                    Gift Sets
                    <span className="text-[#2D2D2D]/30 font-normal">
                      ({filteredGiftSets.length})
                    </span>
                  </div>
                  {filteredGiftSets.slice(0, 4).map((giftSet) => (
                    <GiftSetResult
                      key={giftSet.slug}
                      giftSet={giftSet}
                      onSelect={() => handleSelect(`/gift-sets/${giftSet.slug}`)}
                    />
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Collections results */}
            {filteredCollections.length > 0 && (
              <>
                {(filteredProducts.length > 0 || filteredGiftSets.length > 0) && (
                  <CommandSeparator className="bg-[#C9A96E]/10" />
                )}
                <CommandGroup>
                  <div
                    className="font-sans px-2 py-2 text-xs tracking-[0.15em] uppercase text-[#C9A96E] font-semibold flex items-center gap-2"

                  >
                    <Tag size={12} />
                    Collections
                    <span className="text-[#2D2D2D]/30 font-normal">
                      ({filteredCollections.length})
                    </span>
                  </div>
                  {filteredCollections.map((collection) => (
                    <CommandItem
                      key={collection.slug}
                      value={collection.title}
                      onSelect={() => handleSelect(`/collections/${collection.slug}`)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-[#C9A96E]/5 data-[selected=true]:bg-[#C9A96E]/10"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#C9A96E]/10 shrink-0">
                        <img
                          src={collection.image}
                          alt={collection.title}
                          className="w-full h-full object-cover" loading="lazy"
        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="font-sans font-medium text-sm text-[#2D2D2D] truncate"

                        >
                          {collection.title}
                        </span>
                        <span
                          className="font-sans text-xs text-[#2D2D2D]/50 truncate"

                        >
                          {collection.description}
                        </span>
                      </div>
                      <ArrowRight size={12} className="ml-auto text-[#2D2D2D]/30 shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>

          {/* Footer */}
          <div className="border-t border-[#C9A96E]/15 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span
                className="font-sans text-[10px] tracking-wider uppercase text-[#2D2D2D]/35 flex items-center gap-1.5"

              >
                <kbd className="px-1.5 py-0.5 border border-[#C9A96E]/15 rounded text-[9px] bg-white/50">↑↓</kbd>
                Navigate
              </span>
              <span
                className="font-sans text-[10px] tracking-wider uppercase text-[#2D2D2D]/35 flex items-center gap-1.5"

              >
                <kbd className="px-1.5 py-0.5 border border-[#C9A96E]/15 rounded text-[9px] bg-white/50">↵</kbd>
                Select
              </span>
              <span
                className="font-sans text-[10px] tracking-wider uppercase text-[#2D2D2D]/35 flex items-center gap-1.5"

              >
                <kbd className="px-1.5 py-0.5 border border-[#C9A96E]/15 rounded text-[9px] bg-white/50">Esc</kbd>
                Close
              </span>
            </div>
            <span
              className="font-sans text-[10px] tracking-wider text-[#C9A96E]/50"

            >
              {products.length + giftSets.length} items
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* ── Product Result Row ── */
function ProductResult({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={product.title}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-[#C9A96E]/5 data-[selected=true]:bg-[#C9A96E]/10"
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded overflow-hidden bg-[#C9A96E]/10 shrink-0">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover" loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="font-sans font-medium text-sm text-[#2D2D2D] truncate"

          >
            {product.title}
          </span>
          {product.badge && (
            <span
              className="font-sans font-semibold text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] shrink-0"

            >
              {product.badge}
            </span>
          )}
        </div>
        <span
          className="font-sans text-xs text-[#2D2D2D]/50 truncate"

        >
          {product.description}
        </span>
      </div>

      {/* Price */}
      <span
        className="font-sans font-semibold text-sm text-[#2D2D2D] shrink-0"

      >
        {formatPrice(product.price)}
      </span>
    </CommandItem>
  );
}

/* ── Gift Set Result Row ── */
function GiftSetResult({
  giftSet,
  onSelect,
}: {
  giftSet: GiftSet;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={giftSet.name}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md hover:bg-[#C9A96E]/5 data-[selected=true]:bg-[#C9A96E]/10"
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded overflow-hidden bg-[#C9A96E]/10 shrink-0">
        <img
          src={giftSet.image}
          alt={giftSet.name}
          className="w-full h-full object-cover" loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="font-sans font-medium text-sm text-[#2D2D2D] truncate"

          >
            {giftSet.name}
          </span>
          <span
            className="font-sans font-semibold text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[#f5b7c2]/20 text-[#2D2D2D]/60 shrink-0"

          >
            {giftSet.categoryLabel}
          </span>
          {giftSet.badge && (
            <span
              className="font-sans font-semibold text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] shrink-0"

            >
              {giftSet.badge}
            </span>
          )}
        </div>
        <span
          className="font-sans text-xs text-[#2D2D2D]/50 truncate"

        >
          {giftSet.tagline} · 5-piece set
        </span>
      </div>

      {/* Price */}
      <div className="flex flex-col items-end shrink-0">
        <span
          className="font-sans font-semibold text-sm text-[#2D2D2D]"

        >
          ${giftSet.setPrice}
        </span>
        <span
          className="font-sans text-[10px] text-green-600"

        >
          Save ${giftSet.savings}
        </span>
      </div>
    </CommandItem>
  );
}
