/*
 * Retail Partner Program — landing page for boutiques and shops that want to
 * offer The Winsome Life's personalized stationery with zero inventory.
 *
 * The program, per Sydney: retailers carry no stock and take no risk. We send
 * product samples, a catalog, signage and an acrylic display at no cost; the
 * store takes the customer's order; we produce and ship everything.
 * Commercial terms (partner pricing, how orders are placed, where orders ship)
 * aren't settled on this page on purpose — the FAQ invites stores to ask.
 *
 * Products shown are real Shopify products fetched by handle. The inquiry
 * form saves a `retail_partner_inquiry` metaobject in Shopify admin and only
 * confirms once Shopify has saved it.
 */
import {useEffect, useRef, useState} from 'react';
import {Form, Link, useActionData, useLoaderData, useNavigation} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {BookOpen, Frame, Layers, Signpost} from 'lucide-react';
import type {Route} from './+types/pages.retail-partners';
import {SITE_URL} from '~/lib/seo';
import {STORE_TYPES, type RetailInquiryResult} from '~/lib/retail-inquiry';
import {parseRetailInquiry, saveRetailInquiry} from '~/lib/retail-inquiry.server';

const CONTACT_EMAIL = 'info@thewinsomelife.com';
const CANONICAL = `${SITE_URL}/pages/retail-partners`;
const TITLE = 'Retail Partner Program | Personalized Stationery, Zero Inventory | The Winsome Life';
const DESCRIPTION =
  'Offer luxury personalized stationery in your store with zero inventory and no risk. We provide samples, a catalog, signage and an acrylic display at no cost, and handle all production and shipping.';
// Brand desk-scene photography from the live site: floral notecards on a writing desk.
const HERO_IMAGE =
  'https://www.thewinsomelife.com/cdn/shop/files/03.png?v=1758893929&width=1800';

export const meta: Route.MetaFunction = () => [
  {title: TITLE},
  {name: 'description', content: DESCRIPTION},
  {tagName: 'link', rel: 'canonical', href: CANONICAL},
  {property: 'og:type', content: 'website'},
  {property: 'og:title', content: TITLE},
  {property: 'og:description', content: DESCRIPTION},
  {property: 'og:url', content: CANONICAL},
  {property: 'og:image', content: HERO_IMAGE},
];

/* ------------------------------------------------------------------ */
/* Products: a small, varied taste of the catalog                      */
/* ------------------------------------------------------------------ */

const PRODUCTS = {
  borderedSet:
    'bordered-stationery-set-personalized-mens-and-womens-stationary-bordered-notecards-elegant-notecards-mens-womens-birthday-gift-1',
  foldedMonogram:
    'folded-monogram-notecards-custom-bordered-stationery-personalized-monogram-initials-stationary-elegant-stationery-set-1',
  seaside:
    'personalized-seaside-stationery-coastal-notecards-choose-your-icon-starfish-scallop-shell-sand-dollar-manatee',
  monogramNotepad:
    'personalized-monogram-notepad-customize-colors-and-name-personalized-gift-preppy-notepad-custom-notepad',
  giftTags:
    'monogram-gift-tags-and-stickers-custom-family-gift-tags-personalized-monogram-gift-tags-preppy-gift-tags-for-couples-christmas-tags',
  scalloped: 'scalloped-stationery-set-with-border',
  stripe: 'personalized-stripe-stationery-set-preppy-stationary-classic-notecards-1',
  thankYou:
    'elegant-thank-you-notecards-folded-thank-you-notes-bordered-thank-you-notes-1',
} as const;

type ProductKey = keyof typeof PRODUCTS;

type CardProduct = {
  handle: string;
  title: string;
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
};

const PRODUCTS_QUERY = `
  query RetailPartnerProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    ${Object.entries(PRODUCTS)
      .map(
        ([key, handle]) =>
          `${key}: product(handle: "${handle}") {
            handle
            title
            featuredImage { url altText width height }
            priceRange { minVariantPrice { amount currencyCode } }
          }`,
      )
      .join('\n')}
  }
`;

export async function loader({context}: Route.LoaderArgs) {
  const data = await context.storefront
    .query<Record<ProductKey, CardProduct | null>>(PRODUCTS_QUERY, {
      cache: context.storefront.CacheShort(),
    })
    .catch((err: unknown) => {
      console.error('Retail partner products failed to load', err);
      return null;
    });

  const products = (Object.keys(PRODUCTS) as ProductKey[])
    .map((k) => data?.[k] ?? null)
    .filter((p): p is CardProduct => Boolean(p));
  return {products};
}

export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();
  // Honeypot: real visitors never see or fill this field.
  if (String(form.get('website_url') ?? '').trim()) {
    return {ok: true} satisfies RetailInquiryResult;
  }
  const parsed = parseRetailInquiry(form);
  if ('fieldErrors' in parsed) {
    return {
      ok: false,
      error: 'invalid',
      fieldErrors: parsed.fieldErrors,
    } satisfies RetailInquiryResult;
  }
  return saveRetailInquiry(context.env, parsed.fields);
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const IDS = {how: 'how-it-works', inquiry: 'become-a-partner'};
const SCRIPT = "'Parisian Script', 'Great Vibes', cursive";

function scrollToId(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  history.replaceState(null, '', `#${id}`);
}

const BTN =
  'inline-flex items-center justify-center text-center font-sans font-medium text-[12px] tracking-[0.18em] uppercase px-8 py-4 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';
const BTN_SOLID = `${BTN} bg-[#1B294E] text-white hover:bg-[#2D2D2D]`;
const BTN_OUTLINE = `${BTN} ring-1 ring-inset ring-[#1B294E]/40 text-[#1B294E] hover:bg-[#1B294E] hover:text-white`;
const LINK_TEXT =
  'font-sans font-medium text-[12px] tracking-[0.18em] uppercase text-[#1B294E] underline decoration-[#C9A96E] underline-offset-[6px] hover:text-[#C9A96E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]';

function Anchor({
  to,
  className,
  children,
}: {
  to: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a href={`#${to}`} onClick={(e) => scrollToId(e, to)} className={className}>
      {children}
    </a>
  );
}

function Eyebrow({children}: {children: React.ReactNode}) {
  return (
    <p className="font-sans font-medium text-[11px] md:text-xs tracking-[0.3em] uppercase text-[#5B7A99] mb-4">
      {children}
    </p>
  );
}

function Rule({className = ''}: {className?: string}) {
  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-12 bg-[#C9A96E]/60" />
      <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A96E]/70" />
      <span className="h-px w-12 bg-[#C9A96E]/60" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  id,
  children,
  sub,
}: {
  eyebrow: string;
  id: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="font-serif font-medium text-3xl md:text-[2.6rem] leading-tight text-[#1B294E] text-balance"
      >
        {children}
      </h2>
      {sub ? (
        <p className="font-sans font-light text-[15px] md:text-base leading-relaxed text-[#2D2D2D]/70 mt-5">
          {sub}
        </p>
      ) : (
        <Rule className="mt-6" />
      )}
    </div>
  );
}

function shortTitle(title: string) {
  return title.split('|')[0].trim();
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function RetailPartnersPage() {
  const {products} = useLoaderData<typeof loader>();
  return (
    <main id="main" className="bg-[#FAF8F5] text-[#2D2D2D]">
      <Hero />
      <Promises />
      <PartnerKit />
      <HowItWorks />
      <WhoDoesWhat />
      <Showcase products={products} />
      <IdealFor />
      <Faq />
      <Inquiry />
      <MobileInquiryBar />
    </main>
  );
}

/* ---------------------------- Hero -------------------------------- */

function Hero() {
  return (
    <section
      id="retail-hero"
      aria-labelledby="retail-hero-title"
      className="relative overflow-hidden bg-[#FAF8F5]"
    >
      <div className="grid lg:grid-cols-[1.05fr_1fr] items-stretch">
        <div className="flex items-center px-5 sm:px-8 lg:px-16 xl:px-24 pt-10 pb-10 lg:py-24">
          <div className="max-w-xl">
            <nav
              aria-label="Breadcrumb"
              className="font-sans text-[11px] uppercase tracking-wider text-[#2D2D2D]/45 mb-6"
            >
              <Link to="/" className="hover:text-[#C9A96E]">
                Home
              </Link>{' '}
              /{' '}
              <span className="text-[#2D2D2D]/70" aria-current="page">
                Retail Partner Program
              </span>
            </nav>
            <Eyebrow>The Winsome Life Retail Partner Program</Eyebrow>
            <h1
              id="retail-hero-title"
              className="font-serif font-medium leading-[1.05] text-[2.6rem] sm:text-5xl lg:text-[3.6rem] xl:text-[4rem] text-[#1B294E]"
            >
              Your Store.
              <span className="block mt-2">
                <span
                  className="text-[#2D2D2D]"
                  style={{fontFamily: SCRIPT, fontSize: '1.1em', lineHeight: 1}}
                >
                  Uniquely
                </span>{' '}
                Personal.
              </span>
            </h1>
            <p className="font-sans font-light text-[16px] md:text-lg leading-relaxed text-[#2D2D2D]/80 mt-6">
              Offer your customers The Winsome Life&rsquo;s beautiful,
              personalized stationery without buying a single piece of stock.
            </p>
            <p className="font-sans font-light text-[14px] md:text-[15px] leading-relaxed text-[#2D2D2D]/65 mt-4">
              We provide the product samples, catalog, signage and an acrylic
              display at no cost to you, and we handle all of the production
              and shipping. All you do is take the order.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Anchor to={IDS.inquiry} className={BTN_SOLID}>
                Become a Retail Partner
              </Anchor>
              <Anchor to={IDS.how} className={BTN_OUTLINE}>
                See How It Works
              </Anchor>
            </div>
          </div>
        </div>

        <div className="relative min-h-[300px] sm:min-h-[420px] lg:min-h-[640px]">
          <img
            src={HERO_IMAGE}
            alt="Personalized Winsome Life floral notecards arranged on an elegant writing desk"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            width={1800}
            height={1200}
          />
          <div
            aria-hidden
            className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#FAF8F5] to-transparent"
          />
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />
    </section>
  );
}

/* --------------------------- Promises ----------------------------- */

function Promises() {
  const items = [
    {big: 'Zero', label: 'inventory to buy or store'},
    {big: 'No cost', label: 'for samples, catalog, signage and display'},
    {big: 'We ship', label: 'every order, made to order'},
  ];
  return (
    <section aria-label="Program at a glance" className="bg-[#1B294E] text-white">
      <ul className="container max-w-6xl mx-auto px-5 lg:px-8 py-10 lg:py-12 grid sm:grid-cols-3 gap-8 sm:gap-6 text-center">
        {items.map((it) => (
          <li key={it.big} className="flex flex-col items-center">
            <span className="font-serif text-[2.2rem] lg:text-[2.6rem] leading-none text-[#E8D9B5]">
              {it.big}
            </span>
            <span className="mt-3 font-sans font-light text-[13px] tracking-[0.12em] uppercase text-white/80 max-w-[16rem]">
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------- Partner kit -------------------------- */

function PartnerKit() {
  const kit = [
    {
      Icon: Layers,
      title: 'Product samples',
      body: 'Real pieces your customers can hold, so they can feel the paper and see the printing before they order.',
    },
    {
      Icon: BookOpen,
      title: 'Catalog',
      body: 'Our designs and personalization options in one place, so customers can browse and choose with ease.',
    },
    {
      Icon: Signpost,
      title: 'Signage',
      body: 'Elegant in-store signs that let shoppers know they can order personalized stationery right here.',
    },
    {
      Icon: Frame,
      title: 'Acrylic display',
      body: 'A clear acrylic display that presents the samples beautifully on your counter or shelf.',
    },
  ];
  return (
    <section aria-labelledby="kit-title" className="bg-white py-16 lg:py-24">
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <SectionHeading
          eyebrow="Your Partner Kit"
          id="kit-title"
          sub="Everything you need to offer our stationery arrives ready to set out. There is no cost to you for any of it."
        >
          Everything you need, provided at no cost.
        </SectionHeading>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {kit.map(({Icon, title, body}) => (
            <li
              key={title}
              className="bg-[#FAF8F5] ring-1 ring-[#C9A96E]/20 px-6 py-8 text-center flex flex-col items-center"
            >
              <span className="w-14 h-14 rounded-full ring-1 ring-[#C9A96E]/60 flex items-center justify-center text-[#1B294E]">
                <Icon size={22} strokeWidth={1.25} aria-hidden />
              </span>
              <h3 className="font-serif font-medium text-[1.45rem] text-[#1B294E] mt-5 mb-2">
                {title}
              </h3>
              <p className="font-sans font-light text-[14px] leading-relaxed text-[#2D2D2D]/70">
                {body}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-center mt-10 font-serif italic text-[1.25rem] text-[#2D2D2D]/75">
          No inventory. No upfront cost. No risk.
        </p>
      </div>
    </section>
  );
}

/* --------------------------- How it works ------------------------- */

function HowItWorks() {
  const steps = [
    {
      title: 'We set you up',
      body: 'We send your partner kit: samples, catalog, signage and the acrylic display, all at no cost.',
    },
    {
      title: 'Your customer chooses',
      body: 'Shoppers browse the samples and catalog, then pick their design and personalization.',
    },
    {
      title: 'You take the order',
      body: 'That’s your only job. No stock to manage, no production, no packing.',
    },
    {
      title: 'We craft and ship',
      body: 'We personalize, produce and ship every order, so you never handle a thing.',
    },
  ];
  return (
    <section
      id={IDS.how}
      aria-labelledby="how-title"
      className="scroll-mt-28 bg-[#ECF2F5] py-16 lg:py-24"
    >
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <SectionHeading eyebrow="How It Works" id="how-title">
          Seamless for you. Beautiful for your customers.
        </SectionHeading>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {steps.map((s, i) => (
            <li key={s.title} className="text-center px-2">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white ring-1 ring-[#C9A96E]/70 font-serif text-[1.35rem] text-[#1B294E]">
                {i + 1}
              </span>
              <h3 className="font-serif font-medium text-[1.45rem] leading-snug text-[#1B294E] mt-5 mb-3">
                {s.title}
              </h3>
              <p className="font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/70 max-w-xs mx-auto">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="text-center mt-12">
          <Anchor to={IDS.inquiry} className={LINK_TEXT}>
            Request your partner kit
          </Anchor>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Who does what ------------------------ */

function WhoDoesWhat() {
  const you = ['Set out the display', 'Share the samples and catalog', 'Take the order'];
  const us = [
    'Provide samples, catalog, signage and display',
    'Carry all of the inventory',
    'Personalize and produce every piece',
    'Ship every order',
  ];
  return (
    <section aria-labelledby="split-title" className="bg-[#FAF8F5] py-16 lg:py-24">
      <div className="container max-w-5xl mx-auto px-5 lg:px-8">
        <SectionHeading eyebrow="Truly Effortless" id="split-title">
          You take the order. We take care of everything else.
        </SectionHeading>
        <div className="grid md:grid-cols-[1fr_1.35fr] gap-6 lg:gap-8">
          <div className="bg-white ring-1 ring-[#C9A96E]/25 p-8">
            <p className="font-sans font-medium text-[11px] tracking-[0.26em] uppercase text-[#C9A96E] mb-2">
              Your part
            </p>
            <p className="text-[2.2rem] leading-none text-[#1B294E] mb-6" style={{fontFamily: SCRIPT}}>
              Simple
            </p>
            <ul className="space-y-3">
              {you.map((t) => (
                <li key={t} className="flex items-start gap-3 font-sans text-[15px] text-[#2D2D2D]/85">
                  <span aria-hidden className="mt-[8px] w-1.5 h-1.5 shrink-0 rotate-45 bg-[#C9A96E]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#1B294E] text-white p-8">
            <p className="font-sans font-medium text-[11px] tracking-[0.26em] uppercase text-[#E8D9B5] mb-2">
              Our part
            </p>
            <p className="text-[2.2rem] leading-none text-white mb-6" style={{fontFamily: SCRIPT}}>
              Everything else
            </p>
            <ul className="space-y-3">
              {us.map((t) => (
                <li key={t} className="flex items-start gap-3 font-sans text-[15px] text-white/90">
                  <span aria-hidden className="mt-[8px] w-1.5 h-1.5 shrink-0 rotate-45 bg-[#E8D9B5]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Showcase ---------------------------- */

function Showcase({products}: {products: CardProduct[]}) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="showcase-title" className="bg-[#F6F0E7] py-16 lg:py-24">
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <SectionHeading
          eyebrow="What Your Customers Will Love"
          id="showcase-title"
          sub="Notecards, notepads, gift tags and more, each one personalized with your customer’s name, monogram, font and ink color."
        >
          A collection worth sharing.
        </SectionHeading>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((p) => (
            <li key={p.handle}>
              <Link
                to={`/products/${p.handle}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
              >
                <div className="overflow-hidden bg-white">
                  {p.featuredImage ? (
                    <Image
                      data={{...p.featuredImage, altText: p.featuredImage.altText ?? shortTitle(p.title)}}
                      aspectRatio="1/1"
                      crop="center"
                      sizes="(min-width: 1024px) 270px, 45vw"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div aria-hidden className="aspect-square bg-[#EFE8DA]" />
                  )}
                </div>
                <h3 className="font-serif text-[1.1rem] leading-snug text-[#1B294E] mt-3 group-hover:text-[#5B7A99] transition-colors line-clamp-2">
                  {shortTitle(p.title)}
                </h3>
                <p className="font-sans text-[12px] text-[#2D2D2D]/55 mt-1">
                  Retail from <Money as="span" data={p.priceRange.minVariantPrice as any} />
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="text-center mt-10">
          <Link to="/collections/all" className={BTN_OUTLINE}>
            Browse the Full Collection
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Ideal for --------------------------- */

function IdealFor() {
  const stores = [
    'Gift boutiques',
    'Stationery & paper shops',
    'Home décor stores',
    'Bridal & wedding shops',
    'Baby & children’s boutiques',
    'Clothing & accessories boutiques',
    'Pharmacies & general stores',
    'Resort & hotel gift shops',
  ];
  return (
    <section aria-labelledby="ideal-title" className="bg-white py-16 lg:py-20">
      <div className="container max-w-5xl mx-auto px-5 lg:px-8 text-center">
        <Eyebrow>A Natural Fit</Eyebrow>
        <h2
          id="ideal-title"
          className="font-serif font-medium text-3xl md:text-[2.4rem] leading-tight text-[#1B294E]"
        >
          Made for shops that love a thoughtful gift.
        </h2>
        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {stores.map((s) => (
            <li
              key={s}
              className="font-sans text-[14px] text-[#2D2D2D]/85 px-5 py-2.5 ring-1 ring-[#C9A96E]/40 bg-[#FAF8F5]"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- FAQ ------------------------------ */

const FAQS = [
  {
    q: 'Is there any cost to join?',
    a: 'No. We provide the product samples, catalog, signage and acrylic display at no cost to you.',
  },
  {
    q: 'Do I need to buy or keep inventory?',
    a: 'No. You carry zero inventory. Every piece is personalized and made to order by us.',
  },
  {
    q: 'Who makes and ships the orders?',
    a: 'We do. We handle all of the production and shipping, so you never have to pack or send anything.',
  },
  {
    q: 'What do I need to do?',
    a: 'Set out the display, let customers browse the samples and catalog, and take their order. We’ll walk you through exactly how to place orders when we set you up.',
  },
  {
    q: 'How does partner pricing work?',
    a: 'We’ll share the details of partner pricing when we connect. Tell us a little about your store below and we’ll be in touch.',
  },
];

function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-[#FAF8F5] py-16 lg:py-24">
      <div className="container max-w-3xl mx-auto px-5 lg:px-8">
        <SectionHeading eyebrow="Questions" id="faq-title">
          Frequently Asked Questions
        </SectionHeading>
        <div className="border-t border-[#C9A96E]/35">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-[#C9A96E]/35">
              <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]">
                <span className="font-serif text-[1.2rem] md:text-[1.3rem] leading-snug text-[#1B294E]">
                  {f.q}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 w-7 h-7 rounded-full ring-1 ring-[#C9A96E]/60 flex items-center justify-center text-[#C9A96E] transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 pr-12 font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/75">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Inquiry ---------------------------- */

function Inquiry() {
  const result = useActionData<typeof action>() as RetailInquiryResult | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';
  const confirmRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const fieldErrors = result && !result.ok ? result.fieldErrors ?? {} : {};

  useEffect(() => {
    if (result?.ok) confirmRef.current?.focus();
    else if (result && !result.ok) errorRef.current?.focus();
  }, [result]);

  const input =
    'font-sans w-full px-4 py-3 bg-[#FAF8F5] border border-[#1B294E]/20 text-[15px] text-[#2D2D2D] placeholder:text-[#2D2D2D]/35 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-1 aria-[invalid=true]:border-[#9E1B32]';
  const label =
    'block font-sans font-medium text-[11px] tracking-[0.16em] uppercase text-[#2D2D2D]/75 mb-2';
  const optional = (
    <span className="normal-case tracking-normal font-light text-[#2D2D2D]/50"> (optional)</span>
  );

  const text = (
    id: string,
    name: string,
    title: string,
    opts: {required?: boolean; type?: string; autoComplete?: string} = {},
  ) => {
    const err = (fieldErrors as Record<string, string | undefined>)[name];
    return (
      <div>
        <label htmlFor={id} className={label}>
          {title}
          {opts.required ? (
            <span className="text-[#C9A96E]" aria-hidden>
              {' '}*
            </span>
          ) : (
            optional
          )}
        </label>
        <input
          id={id}
          name={name}
          type={opts.type ?? 'text'}
          required={opts.required}
          autoComplete={opts.autoComplete}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
          className={input}
        />
        {err ? (
          <p id={`${id}-error`} className="mt-1.5 font-sans text-[13px] text-[#9E1B32]">
            {err}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <section
      id={IDS.inquiry}
      aria-labelledby="inquiry-title"
      className="scroll-mt-28 bg-[#ECF2F5] py-16 lg:py-24 pb-28 md:pb-24"
    >
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <Eyebrow>Become a Retail Partner</Eyebrow>
            <h2
              id="inquiry-title"
              className="font-serif font-medium text-[2.3rem] md:text-5xl leading-[1.08] text-[#1B294E]"
            >
              Let&rsquo;s bring The Winsome Life to your store.
            </h2>
            <p className="mt-6 font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/75">
              Tell us a little about your shop. We&rsquo;ll be in touch to share
              the details and get your partner kit on its way.
            </p>
            <p className="mt-8 font-sans font-light text-[13px] text-[#2D2D2D]/60">
              Prefer email? Write to us at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Retail Partner Program')}`}
                className="text-[#1B294E] underline decoration-[#C9A96E] underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>

          <div className="bg-white ring-1 ring-[#1B294E]/10 shadow-[0_24px_50px_-30px_rgba(27,41,78,0.3)] p-6 sm:p-9">
            {result?.ok ? (
              <div ref={confirmRef} tabIndex={-1} role="status" className="text-center py-10 focus:outline-none">
                <Rule />
                <p className="mt-6 text-[2.4rem] text-[#1B294E]" style={{fontFamily: SCRIPT}}>
                  Thank you
                </p>
                <h3 className="font-serif font-medium text-2xl text-[#1B294E] mt-2">
                  We&rsquo;ve received your request.
                </h3>
                <p className="font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/70 mt-4 max-w-md mx-auto">
                  We&rsquo;re so glad you&rsquo;re interested in partnering with
                  us. A member of our team will be in touch soon.
                </p>
              </div>
            ) : (
              <Form method="post" preventScrollReset>
                {result && !result.ok ? (
                  <div
                    ref={errorRef}
                    tabIndex={-1}
                    role="alert"
                    className="mb-6 p-4 bg-[#9E1B32]/5 ring-1 ring-[#9E1B32]/25 font-sans text-[14px] leading-relaxed text-[#7A1527] focus:outline-none"
                  >
                    {result.error === 'invalid' ? (
                      'Please check the highlighted fields below.'
                    ) : (
                      <>
                        We couldn&rsquo;t send your request just now. Please try
                        again in a moment, or email us at{' '}
                        <a
                          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Retail Partner Program')}`}
                          className="underline underline-offset-2"
                        >
                          {CONTACT_EMAIL}
                        </a>
                        .
                      </>
                    )}
                  </div>
                ) : null}

                {/* Honeypot (hidden from people and screen readers) */}
                <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
                  <label>
                    Website URL
                    <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {text('rp-name', 'name', 'Your name', {required: true, autoComplete: 'name'})}
                  {text('rp-email', 'email', 'Email', {required: true, type: 'email', autoComplete: 'email'})}
                  {text('rp-store', 'store', 'Store name', {required: true, autoComplete: 'organization'})}
                  {text('rp-location', 'location', 'City & state', {required: true})}
                  {text('rp-phone', 'phone', 'Phone', {type: 'tel', autoComplete: 'tel'})}
                  {text('rp-website', 'website', 'Website or Instagram', {autoComplete: 'url'})}
                </div>

                <div className="mt-5">
                  <label htmlFor="rp-type" className={label}>
                    Type of store{optional}
                  </label>
                  <select id="rp-type" name="storeType" defaultValue="" className={input}>
                    <option value="">Choose one</option>
                    {STORE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-5">
                  <label htmlFor="rp-message" className={label}>
                    Tell us about your store{optional}
                  </label>
                  <textarea
                    id="rp-message"
                    name="message"
                    rows={4}
                    maxLength={5000}
                    placeholder="What you carry, who your customers are, or any questions you have."
                    className={`${input} resize-y`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`${BTN_SOLID} mt-8 w-full sm:w-auto disabled:opacity-60 disabled:cursor-wait`}
                >
                  {submitting ? 'Sending…' : 'Become a Retail Partner'}
                </button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Mobile sticky CTA ----------------------- */

function MobileInquiryBar() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('retail-hero');
    const form = document.getElementById(IDS.inquiry);
    if (!hero || !form || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroVisible(e.isIntersecting);
        if (e.target === form) setFormVisible(e.isIntersecting);
      }
    });
    io.observe(hero);
    io.observe(form);
    return () => io.disconnect();
  }, []);

  const show = !heroVisible && !formVisible;
  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 bg-[#FAF8F5]/95 backdrop-blur border-t border-[#C9A96E]/30 transition-transform duration-300 ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!show}
    >
      <a
        href={`#${IDS.inquiry}`}
        onClick={(e) => scrollToId(e, IDS.inquiry)}
        tabIndex={show ? 0 : -1}
        className="flex items-center justify-center w-full bg-[#1B294E] text-white py-3.5 font-sans font-medium text-[12px] tracking-[0.18em] uppercase"
      >
        Become a Retail Partner
      </a>
    </div>
  );
}
