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
import { useState, useEffect, useRef, Suspense } from "react";
import { Link, useLocation, Await } from "react-router";
import { Menu, X, Search, ShoppingBag, Heart, Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import { STUDIO_OPEN } from "~/lib/features";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics, useOptimisticCart} from "@shopify/hydrogen";
import { useRouteLoaderData } from "react-router";
import type {RootLoader} from "~/root";
import SearchOverlay from "~/components/SearchOverlay";
import { HoneyBee } from "~/components/HoneyBee";
import { useAside } from "~/components/Aside";
import { INTERNAL_URLS } from "~/lib/config";
import { useWishlistCount } from "~/hooks/useWishlist";
import { PRODUCT_TYPE_COLLECTIONS, SEASON_COLLECTIONS } from "~/lib/collection-filters";

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

// Order per Sydney: Shop (far left, a dropdown with Shop All first —
// rendered separately), Best Sellers, then the current-site tabs. The separate
// Shop All tab was folded into the Shop dropdown (Nov 2026).
const navLinks = [
  { label: "Best Sellers", href: "/collections/bestsellers" },
  { label: "Notecards", href: "/collections/notecards" },
  { label: "Notepads", href: "/collections/notepads" },
  { label: "Gift Tags & Stickers", href: "/collections/gift-tags-stickers" },
  { label: "Artwork", href: "/collections/artwork" },
  { label: "Wine Tags", href: "/collections/wine-tags-1" },
  { label: "Weddings & Events", href: "/collections/weddings-events" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * "Shop" dropdown: Shop All first, then theme collections, product types
 * and seasons, each A–Z. Built live from Shopify (root loader), so new
 * collections appear on their own; MENU_HIDDEN and partner-only collections
 * are left out.
 */
type MenuCollection = { handle: string; title: string };
/** Never listed in the dropdown: Best Sellers has its own tab; Hands Up For
 *  History (and Apparel, which only holds its shirts and hat) is private. */
const MENU_HIDDEN = ["bestsellers", "all", "hands-up-for-history", "apparel"];
function useCollectionMenu() {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const all = (rootData?.menuCollections ?? []) as MenuCollection[];
  const clean = all
    .filter(
      (c) =>
        !c.handle.startsWith("partner-") &&
        !MENU_HIDDEN.includes(c.handle),
    )
    .map((c) => ({ ...c, title: c.title.replace(/ Collection$/i, "") }));
  const pick = (handles: string[]) =>
    handles
      .map((h) => clean.find((c) => c.handle === h))
      .filter((c): c is MenuCollection => !!c);
  const az = (a: MenuCollection, b: MenuCollection) => a.title.localeCompare(b.title);
  const productTypes = pick(PRODUCT_TYPE_COLLECTIONS).sort(az);
  const seasons = pick(SEASON_COLLECTIONS).sort(az);
  const themes = clean
    .filter(
      (c) =>
        !SEASON_COLLECTIONS.includes(c.handle) &&
        !PRODUCT_TYPE_COLLECTIONS.includes(c.handle),
    )
    .sort(az);
  return { themes, productTypes, seasons };
}

function ShopByCollectionMenu({ isActive }: { isActive: (href: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { themes, productTypes, seasons } = useCollectionMenu();
  const active = isActive("/collections") && !isActive("/collections/all");

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = (href: string, label: string) => (
    <li key={href}>
      <Link
        to={href}
        onClick={() => setOpen(false)}
        aria-current={isActive(href) ? "page" : undefined}
        className="block py-1.5 font-sans text-[13.5px] text-[#2D2D2D] hover:text-[#C9A96E] focus-visible:text-[#C9A96E] focus-visible:outline-none transition-colors"
      >
        {label}
      </Link>
    </li>
  );
  const heading = "font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-[#2D2D2D]/50 mb-2";

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`font-sans font-medium text-[11.5px] xl:text-[13px] leading-[inherit] tracking-[0.02em] whitespace-nowrap inline-flex items-baseline gap-0.5 p-0 bg-transparent border-0 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded ${
          active || open ? "text-[#C9A96E]" : "text-[#2D2D2D] hover:text-[#C9A96E]"
        }`}
      >
        Shop
        <ChevronDown
          size={12}
          strokeWidth={1.75}
          aria-hidden
          className={`self-center transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-3 z-50">
          <div className="w-[min(860px,94vw)] bg-white ring-1 ring-[#C9A96E]/25 shadow-[0_18px_40px_-20px_rgba(45,45,45,0.35)] p-6">
            <Link
              to="/collections/all"
              onClick={() => setOpen(false)}
              className="group/all flex items-center justify-between gap-4 mb-5 px-4 py-3 bg-[#FAF8F5] ring-1 ring-[#C9A96E]/30 hover:bg-[#2D2D2D] hover:ring-[#2D2D2D] transition-colors"
            >
              <span>
                <span className="block font-serif text-[19px] leading-tight text-[#2D2D2D] group-hover/all:text-white underline decoration-[#C9A96E] underline-offset-4">
                  Shop All
                </span>
                <span className="block font-sans text-[12px] text-[#2D2D2D]/55 group-hover/all:text-white/75 mt-0.5">
                  Browse every design
                </span>
              </span>
              <ArrowRight size={18} className="text-[#2D2D2D] group-hover/all:text-white group-hover/all:translate-x-0.5 transition-transform" />
            </Link>
            <div className="grid grid-cols-[2fr_1.1fr_0.9fr] gap-8">
              <div>
                <p className={heading}>Collections</p>
                <ul className="columns-2 gap-6">{themes.map((c) => item(`/collections/${c.handle}`, c.title))}</ul>
              </div>
              <div>
                <p className={heading}>Product Types</p>
                <ul>{productTypes.map((c) => item(`/collections/${c.handle}`, c.title))}</ul>
              </div>
              <div>
                <p className={heading}>Seasons</p>
                <ul>{seasons.map((c) => item(`/collections/${c.handle}`, c.title))}</ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Phone menu: "Shop" opens to the same list. */
function MobileCollectionMenu({ close, isActive }: { close: () => void; isActive: (href: string) => boolean }) {
  const { themes, productTypes, seasons } = useCollectionMenu();
  const link = (href: string, label: string) => (
    <Link
      key={href}
      to={href}
      onClick={close}
      aria-current={isActive(href) ? "page" : undefined}
      className="block font-sans text-sm text-[#2D2D2D] hover:text-[#C9A96E] py-1.5 pl-3"
    >
      {label}
    </Link>
  );
  return (
    <details className="group border-b border-[#C9A96E]/10">
      <summary className="flex items-center justify-between cursor-pointer list-none font-sans font-medium text-sm tracking-[0.02em] text-[#2D2D2D] py-2 [&::-webkit-details-marker]:hidden">
        Shop
        <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-3">
        <Link
          to="/collections/all"
          onClick={close}
          className="flex items-center justify-between font-sans font-semibold text-sm text-[#2D2D2D] underline decoration-[#C9A96E] underline-offset-4 py-2 pl-3 pr-1"
        >
          Shop All
          <ArrowRight size={15} />
        </Link>
        <p className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-[#2D2D2D]/50 pt-3 pb-1 pl-3">Collections</p>
        {themes.map((c) => link(`/collections/${c.handle}`, c.title))}
        <p className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-[#2D2D2D]/50 pt-3 pb-1 pl-3">Product Types</p>
        {productTypes.map((c) => link(`/collections/${c.handle}`, c.title))}
        <p className="font-sans font-semibold text-[10.5px] tracking-[0.2em] uppercase text-[#2D2D2D]/50 pt-3 pb-1 pl-3">Seasons</p>
        {seasons.map((c) => link(`/collections/${c.handle}`, c.title))}
      </div>
    </details>
  );
}

// "Corporate & Retail" menu: the two business pages, shown as a small
// dropdown on desktop and a short section in the mobile menu.
const businessLinks = [
  {
    label: "Corporate Gifting",
    href: "/pages/corporate-gifting",
    blurb: "Stationery & client gifts for companies",
  },
  {
    label: "Retail Partners",
    href: "/pages/retail-partners",
    blurb: "Offer our stationery in your store",
  },
];

function BusinessMenu({ isActive }: { isActive: (href: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = businessLinks.some((l) => isActive(l.href));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`font-sans font-medium text-[11.5px] xl:text-[13px] leading-[inherit] tracking-[0.02em] whitespace-nowrap inline-flex items-baseline gap-0.5 p-0 bg-transparent border-0 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded ${
          active || open ? "text-[#C9A96E]" : "text-[#2D2D2D] hover:text-[#C9A96E]"
        }`}
      >
        Corporate &amp; Retail
        <ChevronDown
          size={12}
          strokeWidth={1.75}
          aria-hidden
          className={`self-center transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full pt-3 z-50">
          <ul className="w-72 bg-white ring-1 ring-[#C9A96E]/25 shadow-[0_18px_40px_-20px_rgba(45,45,45,0.35)] py-2">
            {businessLinks.map((l) => (
              <li key={l.href}>
                <Link
                  to={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className="block px-5 py-3 hover:bg-[#FAF8F5] focus-visible:bg-[#FAF8F5] focus-visible:outline-none group"
                >
                  <span className="block font-serif text-[17px] text-[#2D2D2D] group-hover:text-[#C9A96E] transition-colors">
                    {l.label}
                  </span>
                  <span className="block font-sans text-[12px] text-[#2D2D2D]/55 mt-0.5">
                    {l.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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
            {STUDIO_OPEN ? (
              <Link
                to="/studio"
                className="hidden md:inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8964f] text-white font-sans font-medium text-[12px] tracking-[0.12em] uppercase px-4 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
              >
                <Sparkles size={15} strokeWidth={2} />
                Design Your Own
              </Link>
            ) : (
              <span className="hidden md:inline-flex flex-col items-center leading-tight ring-1 ring-inset ring-[#C9A96E]/50 px-4 py-1.5 font-sans text-[#2D2D2D]/80 select-none">
                <span className="flex items-center gap-1.5 font-medium text-[11px] tracking-[0.12em] uppercase">
                  <Sparkles size={13} strokeWidth={1.75} className="text-[#C9A96E]" />
                  Design Your Own
                </span>
                <span className="text-[9px] tracking-[0.24em] uppercase text-[#C9A96E]">
                  Coming Soon
                </span>
              </span>
            )}
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
          <div className="container flex items-center justify-center gap-x-2 xl:gap-x-4 py-2.5">
            <ShopByCollectionMenu isActive={isActive} />
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`font-sans font-medium text-[11.5px] xl:text-[13px] tracking-[0.02em] whitespace-nowrap transition-colors duration-300 relative group focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 rounded ${
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

            <BusinessMenu isActive={isActive} />

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
                {STUDIO_OPEN ? (
                  <Link
                    to="/studio"
                    onClick={() => setMobileOpen(false)}
                    className="font-sans font-semibold flex items-center gap-2.5 text-sm tracking-[0.08em] uppercase py-3 px-4 bg-[#C9A96E] text-white mb-1"
                  >
                    <Sparkles size={16} strokeWidth={2} />
                    Design Your Own
                  </Link>
                ) : (
                  <p className="font-sans flex items-center gap-2.5 text-sm tracking-[0.08em] uppercase py-3 px-4 ring-1 ring-inset ring-[#C9A96E]/40 text-[#2D2D2D]/75 mb-1">
                    <Sparkles size={16} strokeWidth={1.75} className="text-[#C9A96E]" />
                    Design Your Own
                    <span className="ml-auto text-[10px] tracking-[0.2em] text-[#C9A96E]">
                      Coming Soon
                    </span>
                  </p>
                )}
                <MobileCollectionMenu close={() => setMobileOpen(false)} isActive={isActive} />
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
                <p className="font-sans font-semibold text-[11px] tracking-[0.2em] uppercase text-[#2D2D2D]/50 pt-4 pb-1">
                  Corporate &amp; Retail
                </p>
                {businessLinks.map((l) => (
                  <Link
                    key={l.href}
                    to={l.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={`font-sans font-medium text-sm tracking-[0.02em] transition-colors py-2 pl-3 border-b border-[#C9A96E]/10 ${
                      isActive(l.href) ? "text-[#C9A96E]" : "text-[#2D2D2D] hover:text-[#C9A96E]"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
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
