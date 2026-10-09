/*
 * Wishlist Route: all saved products, with remove-from-wishlist and
 * quick path to the product detail page or Shopify checkout.
 *
 * Wishlist state lives in localStorage, so it's client-only. We render an
 * empty skeleton during SSR and hydrate the real list in an effect.
 */
import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {Heart, X} from 'lucide-react';
import type {Route} from './+types/wishlist';
import {useWishlist} from '~/hooks/useWishlist';
import {useAllProducts} from '~/hooks/useProducts';
import {formatPrice} from '~/lib/products';
import {INTERNAL_URLS} from '~/lib/config';

export const meta: Route.MetaFunction = () => [
  {title: 'Wishlist | The Winsome Life'},
  {
    name: 'description',
    content: 'Your saved stationery favorites from The Winsome Life.',
  },
];

export default function WishlistRoute() {
  const {wishlist, toggle, clear} = useWishlist();
  const {data: allProducts} = useAllProducts();

  // Only render the wishlist contents after hydration. The useWishlist hook
  // returns an empty array on the server and on the first client render,
  // so without this guard the SSR markup and the hydrated markup would
  // disagree the moment localStorage gets read.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const items = hydrated
    ? wishlist
        .map((slug) => allProducts.find((p) => p.slug === slug))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : [];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <main id="main" className="container py-16 lg:py-20 min-h-[60vh]">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 text-center">
            <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
              Saved for Later
            </p>
            <h1 className="font-serif font-medium text-4xl md:text-5xl text-[#2D2D2D] mb-3">
              Your Wishlist
            </h1>
            <div className="gold-rule w-24 mx-auto" />
          </header>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#C9A96E]/30 mb-6">
                <Heart className="text-[#C9A96E]" size={24} strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-2xl text-[#2D2D2D] mb-2">
                {hydrated ? 'Nothing saved yet' : 'Loading your wishlist…'}
              </h2>
              <p className="font-sans text-[#2D2D2D]/60 mb-6">
                {hydrated
                  ? 'Tap the heart on any product to save it here for later.'
                  : 'One moment while we pull in your saved pieces.'}
              </p>
              <Link
                to={INTERNAL_URLS.collections}
                className="font-sans font-medium inline-flex items-center justify-center px-8 py-3.5 bg-[#2D2D2D] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A96E] transition-colors"
              >
                Shop the Collection
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 text-sm font-sans text-[#2D2D2D]/60">
                <span>
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </span>
                <button
                  onClick={clear}
                  className="underline underline-offset-2 hover:text-[#C9A96E] transition-colors"
                >
                  Clear all
                </button>
              </div>
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((product) => (
                  <li key={product.slug} className="group relative">
                    <button
                      onClick={() => toggle(product.slug)}
                      className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm opacity-80 hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${product.title} from wishlist`}
                    >
                      <X size={14} className="text-[#2D2D2D]" />
                    </button>
                    <Link to={INTERNAL_URLS.product(product.slug)}>
                      <div className="aspect-[4/5] overflow-hidden bg-white mb-3">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="font-serif text-lg text-[#2D2D2D] leading-snug">
                        {product.title}
                      </h3>
                      <p className="font-sans text-sm text-[#C9A96E] mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
