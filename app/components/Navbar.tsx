/*
 * Design: The Stationery Atelier
 * Navbar: Thin, elegant top bar with brand lockup center, nav links below.
 * Gold accent on hover. Warm cream background. Sticky on scroll.
 * Internal links use wouter Link for SPA navigation; cart icon deep-links
 * to the Shopify cart (hybrid mode — see lib/config.ts).
 * "Build Your Own" is prominently featured as both a highlighted nav link
 * and a palette icon in the top-right icon group.
 * Search icon triggers a command-palette style search overlay.
 * Wishlist heart with badge count (localStorage-backed).
 */
import { useState, useEffect, Suspense } from "react";
import { Link, useLocation, Await } from "react-router";
import { Menu, X, Search, ShoppingBag, Heart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics, useOptimisticCart} from "@shopify/hydrogen";
import { useRouteLoaderData } from "react-router";
import type {RootLoader} from "~/root";
import SearchOverlay from "~/components/SearchOverlay";
import { HoneyBee } from "~/components/HoneyBee";
import { useAside } from "~/components/Aside";
import { INTERNAL_URLS } from "~/lib/config";
import { useWishlistCount } from "~/hooks/useWishlist";

/** Compact cart button — opens the Hydrogen cart aside and shows live count. */
function CartButton() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  return (
    <Suspense fallback={<CartCountBadge count={null} />}>
      <Await resolve={rootData?.cart}>
        {(originalCart) => <CartCountBadge originalCart={originalCart} />}
      </Await>
    </Suspense>
  );
}

function CartCountBadge({
  originalCart,
  count: forcedCount,
}: {
  originalCart?: unknown;
  count?: number | null;
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  // Hook called at top level of this component, NOT inside an Await render-prop.
  const optimisticCart = useOptimisticCart(originalCart as Parameters<typeof useOptimisticCart>[0]);
  const count =
    forcedCount !== undefined ? forcedCount : optimisticCart?.totalQuantity ?? 0;
  return (
    <CartBadge
      count={count}
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
      }}
    />
  );
}

function CartBadge({count, onClick}: {count: number | null; onClick: () => void}) {
  return (
    <button
      onClick={onClick}
      className="relative text-[#2D2D2D] hover:text-[#C9A96E] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded"
      aria-label={`Cart, ${count ?? 0} item${count === 1 ? '' : 's'}`}
    >
      <ShoppingBag size={20} />
      {count != null && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-[#2D2D2D] text-white text-[10px] font-semibold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

// Order per Sydney: Shop by Collection (far left), Best Sellers, then the
// current-site tabs, and Shop All pinned to the far right (rendered separately).
const navLinks = [
  { label: "Shop by Collection", href: "/collections" },
  { label: "Best Sellers", href: "/collections/bestsellers" },
  { label: "Notecards", href: "/collections/notecards" },
  { label: "Notepads", href: "/collections/notepads" },
  { label: "Gift Tags & Stickers", href: "/collections/gift-tags-stickers" },
  { label: "Artwork", href: "/collections/artwork" },
  { label: "Wine Tags", href: "/collections/wine-tags-1" },
  { label: "Weddings & Events", href: "/collections/weddings" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation().pathname;
  const wishlistCount = useWishlistCount();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  return (
    <>
      {/* Announcement Bar */}
      <div className="font-sans bg-[#2D2D2D] text-white text-center py-2 text-sm tracking-wide">
        Free shipping on orders over <span className="text-[#C9A96E] font-semibold">$75</span>
        <span className="mx-2 opacity-40">·</span>
        <span className="opacity-80">Complimentary gift wrap on every order</span>
      </div>

      {/* Main Nav */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#FAF8F5]/95 backdrop-blur-md shadow-sm"
            : "bg-[#FAF8F5]"
        }`}
      >
        {/* Brand Row — 3-col grid so the logo stays truly centered regardless
            of the left/right group widths. */}
        <div className="container grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 lg:py-3.5">
          {/* Mobile menu toggle (left zone; hidden on desktop) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden justify-self-start text-[#2D2D2D] hover:text-[#C9A96E] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="hidden lg:block" aria-hidden />

          {/* Brand Lockup (center zone) */}
          <Link
            to={INTERNAL_URLS.home}
            className="col-start-2 flex flex-col items-center justify-self-center focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded"
            aria-label="The Winsome Life — home"
          >
            <span className="relative inline-block">
              <h1 className="font-serif font-medium text-xl md:text-2xl tracking-[0.14em] text-[#2D2D2D] uppercase leading-none whitespace-nowrap">
                The Winsome Life
              </h1>
              {/* Honeybee illustration — top-right of the wordmark, slanted
                  ~20° left, sized to the wordmark (matches thewinsomelife.com) */}
              <HoneyBee
                size={30}
                slant={-18}
                className="absolute -right-4 -top-3.5 md:-right-5 md:-top-4"
                alt="The Winsome Life honeybee"
              />
            </span>
            <span
              className="text-[13px] md:text-[15px] text-[#2D2D2D] leading-none mt-1"
              style={{
                fontFamily: "'Parisian Script', 'Great Vibes', cursive",
              }}
            >
              Personalized Stationery
            </span>
          </Link>

          {/* Right icons (right zone) */}
          <div className="col-start-3 justify-self-end flex items-center gap-3.5 sm:gap-4">
            {/* Product Builder — prominent "design your own" entry (the second
                shopping track: browse existing products OR design your own). */}
            <Link
              to="/studio"
              className="hidden md:inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8964f] text-white font-sans font-medium text-[12px] tracking-[0.12em] uppercase px-4 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
            >
              <Sparkles size={15} strokeWidth={2} />
              Design Your Own
            </Link>
            {/* Search icon — triggers overlay */}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-[#2D2D2D] hover:text-[#C9A96E] transition-colors hidden sm:block focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative text-[#2D2D2D] hover:text-[#C9A96E] transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded"
              aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount} items)` : ""}`}
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C9A96E] text-white text-[10px] font-semibold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {/* Cart — opens the Hydrogen cart aside */}
            <CartButton />
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:block border-t border-[#C9A96E]/20" aria-label="Primary">
          <div className="container flex items-center justify-center gap-x-4 xl:gap-x-6 py-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`font-sans font-medium text-[13px] tracking-[0.02em] whitespace-nowrap transition-colors duration-300 relative group focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded ${
                  isActive(link.href) ? "text-[#C9A96E]" : "text-[#2D2D2D] hover:text-[#C9A96E]"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] bg-[#C9A96E] transition-all duration-300 ${
                    isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}

            {/* Separator */}
            <div className="h-3.5 w-px bg-[#C9A96E]/25" />

            {/* Shop All — pinned to the far right of the tab list */}
            <Link
              to="/collections/all"
              aria-current={isActive("/collections/all") ? "page" : undefined}
              className={`font-sans font-medium text-[13px] tracking-[0.02em] whitespace-nowrap transition-colors duration-300 relative group focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded ${
                isActive("/collections/all") ? "text-[#C9A96E]" : "text-[#2D2D2D] hover:text-[#C9A96E]"
              }`}
            >
              Shop All
              <span className="absolute -bottom-1 left-0 h-[1px] bg-[#C9A96E] transition-all duration-300 w-0 group-hover:w-full" />
            </Link>
          </div>
        </nav>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden border-t border-[#C9A96E]/20 bg-[#FAF8F5]"
              aria-label="Mobile"
            >
              <div className="container py-4 flex flex-col gap-3">
                {/* Search bar in mobile menu */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="font-sans font-medium flex items-center gap-3 text-sm tracking-[0.08em] uppercase py-3 px-4 border border-[#C9A96E]/20 text-[#2D2D2D]/60 mb-1 rounded"
                >
                  <Search size={16} />
                  Search products...
                  <kbd className="ml-auto text-[10px] tracking-wider text-[#2D2D2D]/30 border border-[#C9A96E]/15 rounded px-1.5 py-0.5">
                    ⌘K
                  </kbd>
                </button>

                {/* Design Your Own — prominent at top of mobile menu */}
                <Link
                  to="/studio"
                  onClick={() => setMobileOpen(false)}
                  className="font-sans font-semibold flex items-center gap-2.5 text-sm tracking-[0.08em] uppercase py-3 px-4 bg-[#C9A96E] text-white mb-1"
                >
                  <Sparkles size={16} strokeWidth={2} />
                  Design Your Own
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`font-sans font-medium text-sm tracking-[0.02em] transition-colors py-2 border-b border-[#C9A96E]/10 ${
                      isActive(link.href) ? "text-[#C9A96E]" : "text-[#2D2D2D] hover:text-[#C9A96E]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to={INTERNAL_URLS.collections}
                  onClick={() => setMobileOpen(false)}
                  className="font-sans font-semibold text-sm tracking-[0.02em] text-[#C9A96E] py-2"
                >
                  Shop All
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
