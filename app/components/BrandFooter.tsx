/*
 * Design: The Stationery Atelier
 * Footer: Warm cream background, organized links, social icons.
 * Gold accents, brand lockup, Shopify + Etsy links.
 * Internal shop links use wouter Link for SPA navigation.
 */
import { Link } from "react-router";

const shopLinks = [
  { label: "Shop All", href: "/collections/all" },
  { label: "Bestsellers", href: "/collections/bestsellers" },
  { label: "Notecards", href: "/collections/notecards" },
  { label: "Notepads", href: "/collections/notepads" },
  { label: "Gift Tags & Stickers", href: "/collections/gift-tags-stickers" },
  { label: "Wine Tags", href: "/collections/wine-tags-1" },
  { label: "Gift Ideas", href: "/collections/gift-ideas" },
  { label: "Gift Sets", href: "/gift-sets" },
];

const supportLinks = [
  { label: "FAQ", href: "https://www.thewinsomelife.com/pages/faq", external: true },
  { label: "Contact Us", href: "/contact", external: false },
  { label: "Return & Refund Policy", href: "https://www.thewinsomelife.com/policies/refund-policy", external: true },
  { label: "Terms of Service", href: "https://www.thewinsomelife.com/policies/terms-of-service", external: true },
  { label: "Privacy Policy", href: "https://www.thewinsomelife.com/policies/privacy-policy", external: true },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/thewinsomelifeco/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/thewinsomelife/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/thewinsomelife/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Etsy",
    href: "https://www.etsy.com/shop/TheWinsomeLifeCo",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.559 3.074c0-.317.039-.634.039-.951h-.039C5.895 2.123 4.5 2.56 4.5 2.56l-.039.039c0 .317-.039.634-.039.951v16.9c0 .317.039.634.039.951l.039.039s1.395.437 4.059.437h.039c0-.317-.039-.634-.039-.951V3.074zm7.882 0c0-.317.039-.634.039-.951h-.039c-2.664 0-4.059.437-4.059.437l-.039.039c0 .317-.039.634-.039.951v16.9c0 .317.039.634.039.951l.039.039s1.395.437 4.059.437h.039c0-.317-.039-.634-.039-.951V3.074z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#FAF8F5] border-t border-[#C9A96E]/15">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/">
              <h3
                className="font-serif font-medium text-xl tracking-[0.1em] text-[#2D2D2D] uppercase mb-1 hover:text-[#C9A96E] transition-colors"

              >
                The Winsome Life
              </h3>
            </Link>
            <p
              className="font-sans text-xs tracking-[0.2em] text-[#C9A96E] uppercase mb-5"

            >
              Personalized Stationery
            </p>
            <p
              className="font-sans font-light text-sm text-[#2D2D2D]/60 leading-relaxed mb-6 max-w-xs"

            >
              Luxury stationery designed to be treasured. Crafted with care,
              made to reflect your unique style.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-[#2D2D2D]/40 hover:text-[#C9A96E] transition-colors duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4
              className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#2D2D2D] mb-5"

            >
              Shop
            </h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-sans text-sm text-[#2D2D2D]/60 hover:text-[#C9A96E] transition-colors duration-300"

                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4
              className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#2D2D2D] mb-5"

            >
              Support
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-sans text-sm text-[#2D2D2D]/60 hover:text-[#C9A96E] transition-colors duration-300"

                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4
              className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#2D2D2D] mb-5"

            >
              Get in Touch
            </h4>
            <a
              href="mailto:info@thewinsomelife.com"
              className="font-sans text-sm text-[#2D2D2D]/60 hover:text-[#C9A96E] transition-colors duration-300 block mb-6"

            >
              info@thewinsomelife.com
            </a>

            <h4
              className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#2D2D2D] mb-4"

            >
              Also Find Us On
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href="https://www.thewinsomelife.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-[#2D2D2D]/60 hover:text-[#C9A96E] transition-colors duration-300"

              >
                Shopify Store
              </a>
              <a
                href="https://www.etsy.com/shop/TheWinsomeLifeCo"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-[#2D2D2D]/60 hover:text-[#C9A96E] transition-colors duration-300"

              >
                Etsy Shop
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[#C9A96E]/15 flex flex-col md:flex-row justify-between items-center gap-4">
          <p
            className="font-sans text-xs text-[#2D2D2D]/40"

          >
            &copy; {new Date().getFullYear()} The Winsome Life. All rights reserved.
          </p>
          <p
            className="font-sans text-xs text-[#2D2D2D]/30"

          >
            Luxury Personalized Stationery &middot; Made with love
          </p>
        </div>
      </div>
    </footer>
  );
}
