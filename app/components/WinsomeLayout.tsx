/**
 * Brand layout for the Winsome storefront.
 *
 * Replaces the Hydrogen skeleton's PageLayout. Uses the brand Navbar +
 * Footer; keeps Hydrogen's Cart Aside + Search Aside so add-to-cart and
 * search-as-you-type still work the Shopify way.
 */
import {Await, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {CartMain} from '~/components/CartMain';
import Navbar from '~/components/Navbar';
import BrandFooter from '~/components/BrandFooter';

interface WinsomeLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function WinsomeLayout({
  cart,
  children = null,
}: WinsomeLayoutProps) {
  // The Product Builder's editor (/studio/<format>) is a full-screen takeover
  // (like Minted's editor) — no announcement bar, navbar, or footer; it brings
  // its own slim top bar. The builder LANDING (/studio) keeps normal chrome so
  // customers can still navigate back to shopping. The cart aside stays mounted
  // so Add to Cart still slides the drawer in.
  const {pathname} = useLocation();
  const immersive = pathname.startsWith('/studio/');

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      {!immersive && <Navbar />}
      {children}
      {!immersive && <BrandFooter />}
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: WinsomeLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart…</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}
