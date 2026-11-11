/*
 * White-label layout (Sydney, Nov 2026): for a white-label partner's page and
 * the product pages opened from it (?via=<partner>). Instead of The Winsome
 * Life header, menu and footer: a slim bar in the partner's colors with
 * their logo or name (back to their page) and the cart. The cart drawer
 * still works, so shoppers can add to cart and check out.
 */
import {Await, Link} from 'react-router';
import {Suspense} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {CartMain} from '~/components/CartMain';
import {CartButton} from '~/components/Navbar';

export type WhiteLabelPartner = {
  handle: string;
  name: string;
  logo: string | null;
  logoRound?: boolean;
  colors: {background: string; text: string; accent: string};
};

export function PartnerShell({
  partner,
  cart,
  children,
}: {
  partner: WhiteLabelPartner;
  cart: Promise<CartApiQueryFragment | null>;
  children: React.ReactNode;
}) {
  return (
    <Aside.Provider>
      <Aside type="cart" heading="CART">
        <Suspense fallback={<p>Loading cart…</p>}>
          <Await resolve={cart}>{(c) => <CartMain cart={c} layout="aside" />}</Await>
        </Suspense>
      </Aside>
      <header
        className="sticky top-0 z-50 shadow-sm"
        style={{background: partner.colors.background, color: partner.colors.text}}
      >
        <div className="container max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to={`/partners/${partner.handle}`} className="flex items-center gap-3 min-w-0" aria-label={`${partner.name} home`}>
            {partner.logo && (
              <img
                src={partner.logo}
                alt=""
                className={`h-11 w-auto object-contain ${partner.logoRound ? 'rounded-full ring-2 ring-white/80' : ''}`}
              />
            )}
            <span className="font-serif text-lg md:text-xl truncate">{partner.name}</span>
          </Link>
          <div className="[&_*]:!text-current">
            <CartButton />
          </div>
        </div>
      </header>
      {children}
    </Aside.Provider>
  );
}
