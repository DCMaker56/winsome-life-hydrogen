/*
 * Business & Corporate Gifting — landing page for companies buying
 * personalized stationery for their teams and gifts for clients.
 *
 * Every product shown is a real Shopify product fetched by handle (image, price
 * and link stay live). The "Harrison Wealth Management" collection is a clearly
 * labeled sample, not a working portal. The future private company ordering
 * experience would slot in where the Company Collection section sits.
 *
 * The inquiry form posts to this route's action, which saves a
 * `corporate_inquiry` metaobject in Shopify admin (see
 * ~/lib/corporate-inquiry.server). The confirmation only shows once Shopify
 * confirms the entry was saved.
 */
import {useEffect, useRef, useState} from 'react';
import {Form, Link, useActionData, useLoaderData, useNavigation} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {Route} from './+types/pages.corporate-gifting';
import {SITE_URL} from '~/lib/seo';
import {
  INTEREST_OPTIONS,
  QUANTITY_OPTIONS,
  type InquiryResult,
} from '~/lib/corporate-inquiry';
import {parseInquiry, saveInquiry} from '~/lib/corporate-inquiry.server';

const CONTACT_EMAIL = 'info@thewinsomelife.com';
const CANONICAL = `${SITE_URL}/pages/corporate-gifting`;
const TITLE = 'Corporate Stationery & Personalized Client Gifts | The Winsome Life';
const DESCRIPTION =
  'Elevate business relationships with personalized stationery, thoughtful corporate gifts, and curated company collections from The Winsome Life.';
// Brand desk-scene photography from the live site: notecards and a gold pen.
const HERO_IMAGE =
  'https://www.thewinsomelife.com/cdn/shop/files/04.png?v=1758894113&width=1800';

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
/* Products — real catalog items, chosen for business use              */
/* ------------------------------------------------------------------ */

const PRODUCTS = {
  businessNotecards:
    'custom-business-stationery-custom-notecards-with-your-company-logo-or-text-of-your-choice-business-stationary-1',
  businessFolded:
    'folded-notecards-custom-business-stationery-folded-notecards-with-your-company-logo-image-or-text-of-your-choice-business-stationary',
  borderedNotepad: 'personalized-bordered-elegant-notepad-business-notepad',
  customNotepad:
    'custom-notepad-customize-with-text-logo-graphics-of-your-choice-100-customizable-luxury-notepad',
  thankYou:
    'elegant-thank-you-notecards-folded-thank-you-notes-bordered-thank-you-notes-1',
  foldedMonogram:
    'folded-monogram-notecards-custom-bordered-stationery-personalized-monogram-initials-stationary-elegant-stationery-set-1',
  monogramNotepad:
    'elegant-monogram-notepad-two-letter-monogram-customize-colors-and-name-personalized-gift',
  giftTags:
    'personalized-elegant-monogram-gift-tags-sophisticated-enclosure-tag-with-initials',
  borderedSet:
    'bordered-stationery-set-personalized-mens-and-womens-stationary-bordered-notecards-elegant-notecards-mens-womens-birthday-gift-1',
  scalloped: 'scalloped-stationery-set-with-border',
  holiday:
    'personalized-monogram-wreath-bow-stationery-set-stationary-christmas-wreath-flat-notecards-red-or-blue-bow-holiday-monogram-gift',
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

// Showcase order — curated, not the whole catalog.
const SHOWCASE: ProductKey[] = [
  'businessNotecards',
  'businessFolded',
  'borderedNotepad',
  'thankYou',
  'foldedMonogram',
  'monogramNotepad',
  'giftTags',
  'scalloped',
];

const PRODUCTS_QUERY = `
  query CorporateGiftingProducts($country: CountryCode, $language: LanguageCode)
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
      console.error('Corporate gifting products failed to load', err);
      return null;
    });

  const products = {} as Record<ProductKey, CardProduct | null>;
  for (const key of Object.keys(PRODUCTS) as ProductKey[]) {
    products[key] = data?.[key] ?? null;
  }
  return {products};
}

export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();

  // Honeypot — real visitors never see or fill this field.
  if (String(form.get('website') ?? '').trim()) {
    return {ok: true} satisfies InquiryResult;
  }

  const parsed = parseInquiry(form);
  if ('fieldErrors' in parsed) {
    return {
      ok: false,
      error: 'invalid',
      fieldErrors: parsed.fieldErrors,
    } satisfies InquiryResult;
  }
  return saveInquiry(context.env, parsed.fields);
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const SECTION_IDS = {
  services: 'business-solutions',
  collection: 'company-collection',
  inquiry: 'inquire',
};

function scrollToId(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  history.replaceState(null, '', `#${id}`);
}

function AnchorButton({
  to,
  variant = 'solid',
  children,
}: {
  to: string;
  variant?: 'solid' | 'outline' | 'text';
  children: React.ReactNode;
}) {
  const styles = {
    solid:
      'bg-[#1B294E] text-white hover:bg-[#2D2D2D] px-8 py-4',
    outline:
      'ring-1 ring-inset ring-[#1B294E]/40 text-[#1B294E] hover:bg-[#1B294E] hover:text-white px-8 py-4',
    text: 'text-[#1B294E] underline decoration-[#C9A96E] underline-offset-[6px] hover:text-[#C9A96E] py-1',
  }[variant];
  return (
    <a
      href={`#${to}`}
      onClick={(e) => scrollToId(e, to)}
      className={`inline-flex items-center justify-center text-center font-sans font-medium text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E] ${styles}`}
    >
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
    <div
      aria-hidden
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <span className="h-px w-12 bg-[#C9A96E]/60" />
      <span className="w-1.5 h-1.5 rotate-45 bg-[#C9A96E]/70" />
      <span className="h-px w-12 bg-[#C9A96E]/60" />
    </div>
  );
}

function ProductPhoto({
  product,
  sizes,
  className = '',
  aspect = '1/1',
  alt,
}: {
  product: CardProduct | null;
  sizes: string;
  className?: string;
  aspect?: string;
  alt?: string;
}) {
  if (!product?.featuredImage) {
    return (
      <div
        aria-hidden
        className={`w-full h-full bg-[#EFE8DA] ${className}`}
        style={{aspectRatio: aspect}}
      />
    );
  }
  return (
    <Image
      data={{
        ...product.featuredImage,
        altText: alt ?? product.featuredImage.altText ?? product.title,
      }}
      aspectRatio={aspect}
      crop="center"
      sizes={sizes}
      loading="lazy"
      className={`w-full h-full object-cover ${className}`}
    />
  );
}

/** Product titles carry Etsy-style "A | B | C" keyword runs; show the first part. */
function shortTitle(title: string) {
  return title.split('|')[0].trim();
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CorporateGiftingPage() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <main id="main" className="bg-[#FAF8F5] text-[#2D2D2D]">
      <Hero />
      <TwoWays products={products} />
      <CompanyCollection products={products} />
      <HowItWorks />
      <Occasions products={products} />
      <Showcase products={products} />
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
      id="corporate-hero"
      aria-labelledby="corporate-hero-title"
      className="relative overflow-hidden bg-[#FAF8F5]"
    >
      <div className="grid lg:grid-cols-[1.05fr_1fr] items-stretch">
        <div className="order-1 flex items-center px-5 sm:px-8 lg:px-16 xl:px-24 pt-10 pb-10 lg:py-24">
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
                Business &amp; Corporate Gifting
              </span>
            </nav>
            <Eyebrow>Business &amp; Corporate Gifting</Eyebrow>
            <h1
              id="corporate-hero-title"
              className="font-serif font-medium leading-[1.05] text-[2.6rem] sm:text-5xl lg:text-[3.6rem] xl:text-[4rem] text-[#1B294E]"
            >
              Business is personal.{' '}
              <span className="block mt-1">
                Make it{' '}
                <span
                  className="text-[#2D2D2D] ml-1"
                  style={{
                    fontFamily: "'Parisian Script', 'Great Vibes', cursive",
                    fontSize: '1.15em',
                    lineHeight: 1,
                  }}
                >
                  memorable.
                </span>
              </span>
            </h1>
            <p className="font-sans font-light text-[16px] md:text-lg leading-relaxed text-[#2D2D2D]/80 mt-6">
              Thoughtfully personalized stationery and gifts that help your
              company build stronger relationships, celebrate meaningful
              moments, and leave a lasting impression.
            </p>
            <p className="font-sans font-light text-[14px] md:text-[15px] leading-relaxed text-[#2D2D2D]/60 mt-4">
              From handwritten thank-you notes to beautifully personalized
              client gifts, The Winsome Life makes it easy to add a thoughtful,
              personal touch to every business relationship.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <AnchorButton to={SECTION_IDS.services}>
                Explore Business Solutions
              </AnchorButton>
              <AnchorButton to={SECTION_IDS.inquiry} variant="outline">
                Let&rsquo;s Work Together
              </AnchorButton>
            </div>
          </div>
        </div>

        <div className="order-2 relative min-h-[300px] sm:min-h-[420px] lg:min-h-[640px]">
          <img
            src={HERO_IMAGE}
            alt="Personalized Winsome Life notecards and a gold pen arranged on a writing desk"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            width={1800}
            height={1200}
          />
          {/* Soft cream fade where the photo meets the copy on desktop. */}
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

/* ------------------------ Two ways to work ------------------------- */

function TwoWays({products}: {products: Record<ProductKey, CardProduct | null>}) {
  const offerings = [
    {
      eyebrow: 'Personal Stationery for Business',
      title: 'A handwritten note is never out of style.',
      body: [
        'In a digital world, a personal note stands apart. Equip your team with beautifully crafted stationery for thanking clients, welcoming new relationships, recognizing referrals, and celebrating life’s milestones.',
        'From individual monograms to company-branded designs, we’ll help you create stationery that feels as distinctive as the people sending it.',
      ],
      note: 'Ideal for wealth managers, financial advisors, real estate professionals, attorneys, sales teams, client relationship managers, and executive offices.',
      cta: {label: 'Explore Business Stationery', to: '/collections/business-professional'},
      images: [
        {key: 'businessNotecards' as const, alt: 'Custom business notecards personalized with a company name'},
        {key: 'borderedNotepad' as const, alt: 'Personalized bordered notepad for the office'},
      ],
    },
    {
      eyebrow: 'Corporate & Client Gifting',
      title: 'Because the best gifts feel personal.',
      body: [
        'Go beyond the ordinary corporate gift with something thoughtful, useful, and uniquely theirs.',
        'Whether you’re welcoming a new client, celebrating a successful partnership, recognizing an employee, or expressing gratitude at year’s end, our personalized paper goods make every gesture feel considered.',
        'Choose from elegant note cards, personalized notepads, gift tags, and curated stationery sets—beautifully made and tailored to your recipient.',
      ],
      cta: {label: 'Explore Corporate Gifting', to: '/collections/gift-ideas'},
      images: [
        {key: 'foldedMonogram' as const, alt: 'Folded monogram notecards in a coordinated stationery set'},
        {key: 'giftTags' as const, alt: 'Personalized monogram gift enclosure tags'},
      ],
    },
  ];

  return (
    <section
      id={SECTION_IDS.services}
      aria-labelledby="two-ways-title"
      className="scroll-mt-28 bg-white py-16 lg:py-24"
    >
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <Eyebrow>Business Solutions</Eyebrow>
          <h2
            id="two-ways-title"
            className="font-serif font-medium text-3xl md:text-[2.6rem] leading-tight text-[#1B294E]"
          >
            Two ways to work with us
          </h2>
          <Rule className="mt-6" />
        </div>

        <div className="grid md:grid-cols-2 gap-14 md:gap-10 lg:gap-14">
          {offerings.map((o) => (
            <article key={o.eyebrow} className="flex flex-col">
              <div className="grid grid-cols-[1.4fr_1fr] gap-3 mb-8">
                <div className="overflow-hidden bg-[#F6F0E7]">
                  <ProductPhoto
                    product={products[o.images[0].key]}
                    alt={o.images[0].alt}
                    aspect="4/5"
                    sizes="(min-width: 768px) 28vw, 58vw"
                    className="transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
                <div className="overflow-hidden bg-[#F6F0E7] self-end">
                  <ProductPhoto
                    product={products[o.images[1].key]}
                    alt={o.images[1].alt}
                    aspect="3/4"
                    sizes="(min-width: 768px) 20vw, 40vw"
                    className="transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
              </div>
              <p className="font-sans font-medium text-[11px] tracking-[0.26em] uppercase text-[#C9A96E] mb-3">
                {o.eyebrow}
              </p>
              <h3 className="font-serif font-medium text-[1.9rem] md:text-[2.1rem] leading-tight text-[#1B294E] mb-5">
                {o.title}
              </h3>
              <div className="space-y-4 font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/75">
                {o.body.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              {o.note ? (
                <p className="mt-5 pl-4 border-l border-[#C9A96E]/60 font-serif italic text-[17px] leading-snug text-[#2D2D2D]/70">
                  {o.note}
                </p>
              ) : null}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-auto md:pt-8">
                <Link
                  to={o.cta.to}
                  className="inline-flex items-center justify-center bg-[#1B294E] text-white hover:bg-[#2D2D2D] px-7 py-3.5 font-sans font-medium text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]"
                >
                  {o.cta.label}
                </Link>
                <AnchorButton to={SECTION_IDS.inquiry} variant="text">
                  Ask about an order
                </AnchorButton>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------- Company collection ------------------------ */

function CompanyCollection({
  products,
}: {
  products: Record<ProductKey, CardProduct | null>;
}) {
  const highlights = [
    'Company-approved stationery designs and colors',
    'Personalized options for individual employees',
    'Curated gift selections for clients and colleagues',
    'Coordinated products reflecting your company’s identity',
    'Convenient individual or centralized ordering arrangements',
    'Ongoing reordering opportunities',
  ];

  return (
    <section
      id={SECTION_IDS.collection}
      aria-labelledby="collection-title"
      className="scroll-mt-28 bg-[#ECF2F5] py-16 lg:py-24 relative overflow-hidden"
    >
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
          <div>
            <Eyebrow>The Winsome Company Collection</Eyebrow>
            <h2
              id="collection-title"
              className="font-serif font-medium text-[2.4rem] md:text-5xl leading-[1.05] text-[#1B294E]"
            >
              Your Company.
              <br />
              Your Collection.
            </h2>
            <p
              className="mt-3 text-[1.9rem] md:text-[2.2rem] text-[#2D2D2D]"
              style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
            >
              Beautifully curated. Effortlessly personal.
            </p>
            <div className="mt-6 space-y-4 font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/75">
              <p>
                Imagine a private collection of stationery and gifts designed
                just for your company.
              </p>
              <p>
                We work with your team to create a thoughtfully selected
                assortment of products incorporating your approved designs,
                brand colors, and personalization options.
              </p>
              <p>
                Employees can shop from a streamlined collection, customize
                their selections, and order exactly what they need&mdash;without
                starting from scratch.
              </p>
              <p>
                Whether you&rsquo;re outfitting a team of advisors or organizing
                gifts for hundreds of clients, we&rsquo;ll help make the
                experience simple, consistent, and personal.
              </p>
            </div>
            <ul className="mt-8 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {highlights.map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-3 font-sans text-[14px] leading-snug text-[#2D2D2D]/85"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] w-1.5 h-1.5 shrink-0 rotate-45 bg-[#C9A96E]"
                  />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <AnchorButton to={SECTION_IDS.inquiry}>
                Inquire About a Company Collection
              </AnchorButton>
            </div>
          </div>

          <SampleStorefront products={products} />
        </div>
      </div>
    </section>
  );
}

/**
 * A static, clearly labeled mockup of what a private company collection could
 * look like. Nothing here is interactive: it's an illustration, not a portal.
 * When the real portal ships, this is the component to replace.
 */
function SampleStorefront({
  products,
}: {
  products: Record<ProductKey, CardProduct | null>;
}) {
  const tiles: Array<{key: ProductKey; label: string; alt: string}> = [
    {key: 'businessNotecards', label: 'Personalized Note Cards', alt: 'Personalized flat note cards'},
    {key: 'borderedNotepad', label: 'Executive Notepad', alt: 'Personalized executive notepad'},
    {key: 'thankYou', label: 'Thank-You Cards', alt: 'Folded thank-you notecards'},
    {key: 'businessFolded', label: 'Folded Correspondence Cards', alt: 'Folded correspondence cards'},
    {key: 'giftTags', label: 'Client Gift Enclosures', alt: 'Monogram gift enclosure tags'},
  ];

  return (
    <figure className="relative">
      <div className="bg-white shadow-[0_30px_60px_-30px_rgba(27,41,78,0.35)] ring-1 ring-[#1B294E]/10">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#1B294E]/10 bg-[#FAF8F5]">
          <span aria-hidden className="w-2 h-2 rounded-full bg-[#1B294E]/15" />
          <span aria-hidden className="w-2 h-2 rounded-full bg-[#1B294E]/15" />
          <span aria-hidden className="w-2 h-2 rounded-full bg-[#1B294E]/15" />
          <span className="ml-auto font-sans font-medium text-[10px] tracking-[0.22em] uppercase text-[#C9A96E] ring-1 ring-[#C9A96E]/50 px-2.5 py-1">
            Sample Collection
          </span>
        </div>

        <div className="p-5 sm:p-7">
          <div className="text-center border-b border-[#C9A96E]/30 pb-5 mb-5">
            <p className="font-sans font-medium text-[10px] tracking-[0.3em] uppercase text-[#5B7A99]">
              The Winsome Company Collection for
            </p>
            <p className="font-serif font-semibold text-[1.55rem] sm:text-[1.8rem] tracking-wide text-[#1B294E] mt-1">
              Harrison Wealth Management
            </p>
            <p className="font-sans font-light text-[13px] text-[#2D2D2D]/65 mt-2 max-w-sm mx-auto leading-relaxed">
              Welcome, Harrison team. Every piece here has been approved for our
              firm&mdash;add your name, choose your quantities, and you&rsquo;re
              all set.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {tiles.map((t) => (
              <div key={t.key}>
                <div className="overflow-hidden bg-[#F6F0E7]">
                  <ProductPhoto
                    product={products[t.key]}
                    alt={t.alt}
                    sizes="(min-width: 1024px) 160px, 30vw"
                  />
                </div>
                <p className="font-serif text-[15px] leading-tight text-[#1B294E] mt-2">
                  {t.label}
                </p>
                <p className="font-sans text-[10px] tracking-[0.16em] uppercase text-[#2D2D2D]/45 mt-0.5">
                  Company approved
                </p>
              </div>
            ))}

            {/* Personalization example */}
            <div className="col-span-2 sm:col-span-1">
              <div className="aspect-square sm:aspect-auto sm:h-[calc(100%-2.75rem)] bg-[#FAF8F5] ring-1 ring-[#1B294E]/10 p-3 flex flex-col">
                <div className="flex-1 bg-white ring-[3px] ring-inset ring-[#1B294E] m-1 flex flex-col items-center justify-center text-center px-2 py-4">
                  <span
                    className="text-[#1B294E] text-[1.45rem] leading-none whitespace-nowrap"
                    style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
                  >
                    Eleanor Harrison
                  </span>
                  <span className="mt-2 font-serif text-[9px] tracking-[0.28em] uppercase text-[#2D2D2D]/60">
                    Harrison Wealth Management
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-1 font-sans text-[9px] uppercase tracking-[0.12em] text-[#2D2D2D]/60">
                  <div>
                    <dt className="text-[#2D2D2D]/40">Font</dt>
                    <dd>Parisian Script</dd>
                  </div>
                  <div>
                    <dt className="text-[#2D2D2D]/40">Ink</dt>
                    <dd className="flex items-center gap-1">
                      <span aria-hidden className="w-2 h-2 rounded-full bg-[#1B294E]" />
                      Navy
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="font-serif text-[15px] leading-tight text-[#1B294E] mt-2">
                Your personalization
              </p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center font-sans font-light text-[12px] text-[#2D2D2D]/55">
        An illustration of a private company collection. Harrison Wealth
        Management is a fictional company.
      </figcaption>
    </figure>
  );
}

/* --------------------------- How it works ------------------------- */

function HowItWorks() {
  const steps = [
    {
      title: 'Tell Us What You Have in Mind',
      body: 'Share your company’s needs, whether it’s stationery for a small team, a curated gift collection, or a company-wide program.',
    },
    {
      title: 'We’ll Curate Your Collection',
      body: 'Together, we’ll select beautiful products, personalization options, and designs that reflect your brand.',
    },
    {
      title: 'Make Every Impression Count',
      body: 'Order as needed, arrange ordering for your team, or coordinate personalized gifts for your recipients.',
    },
  ];
  return (
    <section
      aria-labelledby="how-title"
      className="bg-[#FAF8F5] py-16 lg:py-24"
    >
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
          <Eyebrow>How It Works</Eyebrow>
          <h2
            id="how-title"
            className="font-serif font-medium text-3xl md:text-[2.6rem] leading-tight text-[#1B294E]"
          >
            Thoughtful Details. A Simple Process.
          </h2>
          <Rule className="mt-6" />
        </div>
        <ol className="grid md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
          {steps.map((s, i) => (
            <li key={s.title} className="text-center px-2">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full ring-1 ring-[#C9A96E]/70 font-serif text-[1.35rem] text-[#1B294E]">
                {String(i + 1).padStart(2, '0')}
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
          <AnchorButton to={SECTION_IDS.inquiry} variant="text">
            Start with step one
          </AnchorButton>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Occasions --------------------------- */

function Occasions({products}: {products: Record<ProductKey, CardProduct | null>}) {
  const occasions: Array<{
    key: ProductKey;
    title: string;
    body: string;
    alt: string;
    span: string;
  }> = [
    {
      key: 'thankYou',
      title: 'The Handwritten Thank-You',
      body: 'For expressing appreciation after a meeting, referral, or meaningful conversation.',
      alt: 'Elegant folded thank-you notecards',
      span: 'md:col-span-7',
    },
    {
      key: 'scalloped',
      title: 'The New Client Welcome',
      body: 'Celebrate the beginning of a new relationship with a thoughtful personal gift.',
      alt: 'Personalized scalloped-edge stationery set',
      span: 'md:col-span-5',
    },
    {
      key: 'monogramNotepad',
      title: 'The Meaningful Milestone',
      body: 'Recognize birthdays, promotions, anniversaries, referrals, and special achievements.',
      alt: 'Elegant two-letter monogram notepad',
      span: 'md:col-span-5',
    },
    {
      key: 'holiday',
      title: 'The Holiday Gesture',
      body: 'Show gratitude with beautifully personalized gifts that stand apart from traditional corporate giveaways.',
      alt: 'Personalized monogram wreath and bow holiday notecards',
      span: 'md:col-span-7',
    },
  ];

  return (
    <section aria-labelledby="occasions-title" className="bg-white py-16 lg:py-24">
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
          <Eyebrow>Occasions &amp; Inspiration</Eyebrow>
          <h2
            id="occasions-title"
            className="font-serif font-medium text-3xl md:text-[2.6rem] leading-tight text-[#1B294E]"
          >
            A Little Thought Goes a Long Way.
          </h2>
          <p className="font-sans font-light text-[15px] md:text-base leading-relaxed text-[#2D2D2D]/70 mt-5">
            From the everyday thank-you to the extraordinary celebration,
            we&rsquo;re here to help you make each gesture meaningful.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-5 lg:gap-6">
          {occasions.map((o) => (
            <article key={o.title} className={`group ${o.span}`}>
              <Link
                to={
                  products[o.key]
                    ? `/products/${products[o.key]!.handle}`
                    : '/collections/business-professional'
                }
                className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
              >
                <div className="overflow-hidden bg-[#F6F0E7] aspect-[4/3] md:aspect-auto md:h-[340px] lg:h-[380px]">
                  <ProductPhoto
                    product={products[o.key]}
                    alt={o.alt}
                    aspect="4/3"
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className="h-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-5 pb-2 md:pr-8">
                  <h3 className="font-serif font-medium text-[1.5rem] leading-snug text-[#1B294E] group-hover:text-[#5B7A99] transition-colors">
                    {o.title}
                  </h3>
                  <p className="font-sans font-light text-[14px] leading-relaxed text-[#2D2D2D]/70 mt-1.5">
                    {o.body}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Showcase ---------------------------- */

function Showcase({products}: {products: Record<ProductKey, CardProduct | null>}) {
  const items = SHOWCASE.map((k) => products[k]).filter(
    (p): p is CardProduct => Boolean(p),
  );
  const track = useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    el.scrollBy({left: dir * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth'});
  };

  if (!items.length) return null;

  return (
    <section aria-labelledby="showcase-title" className="bg-[#F6F0E7] py-16 lg:py-24">
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <Eyebrow>Curated for Business</Eyebrow>
            <h2
              id="showcase-title"
              className="font-serif font-medium text-3xl md:text-[2.6rem] leading-tight text-[#1B294E]"
            >
              Thoughtful by Design. Personal by Nature.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous products"
              className="w-11 h-11 rounded-full ring-1 ring-[#1B294E]/25 text-[#1B294E] hover:bg-[#1B294E] hover:text-white transition-colors"
            >
              <span aria-hidden>&#8592;</span>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next products"
              className="w-11 h-11 rounded-full ring-1 ring-[#1B294E]/25 text-[#1B294E] hover:bg-[#1B294E] hover:text-white transition-colors"
            >
              <span aria-hidden>&#8594;</span>
            </button>
          </div>
        </div>

        <ul
          ref={track}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 lg:mx-0 lg:px-0 [scrollbar-width:thin]"
        >
          {items.map((p) => (
            <li
              key={p.handle}
              className="snap-start shrink-0 w-[72%] sm:w-[44%] lg:w-[calc(25%-15px)]"
            >
              <Link
                to={`/products/${p.handle}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A96E]"
              >
                <div className="overflow-hidden bg-white">
                  <ProductPhoto
                    product={p}
                    sizes="(min-width: 1024px) 270px, (min-width: 640px) 44vw, 72vw"
                    className="transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="font-serif text-[1.15rem] leading-snug text-[#1B294E] mt-4 group-hover:text-[#5B7A99] transition-colors line-clamp-2">
                  {shortTitle(p.title)}
                </h3>
                <p className="font-sans text-[13px] text-[#2D2D2D]/65 mt-1">
                  From <Money as="span" data={p.priceRange.minVariantPrice as any} />
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/collections/notecards"
            className="inline-flex items-center justify-center bg-[#1B294E] text-white hover:bg-[#2D2D2D] px-8 py-4 font-sans font-medium text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]"
          >
            Shop Personalized Stationery
          </Link>
          <AnchorButton to={SECTION_IDS.inquiry} variant="text">
            Ordering for a team? Let&rsquo;s talk
          </AnchorButton>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- FAQ ------------------------------ */

const FAQS = [
  {
    q: 'Can we incorporate our company’s branding?',
    a: 'Yes, in many cases. Several of our designs, including our Custom Business Stationery and custom notepads, can be made with a company logo or text of your choice, and we’re happy to work with your brand colors. Share your brand guidelines with us and we’ll talk through what’s possible for your project.',
  },
  {
    q: 'Can individual employees personalize their stationery?',
    a: 'Our stationery is personalized with names, monograms, fonts, and ink colors, so each person’s set can feel like their own. For a company program, we’ll work with you on the simplest way to gather each person’s details.',
  },
  {
    q: 'Do you offer bulk or recurring orders?',
    a: 'We’d be glad to talk about larger and repeat orders. Options depend on the products and personalization involved, so tell us a little about what you have in mind and we’ll follow up with what we can offer.',
  },
  {
    q: 'Can gifts be sent directly to individual recipients?',
    a: 'Please ask us. Delivery arrangements depend on the order, and we’ll confirm what’s possible for your recipients when we discuss your project.',
  },
  {
    q: 'Can we create a curated collection just for our company?',
    a: 'That’s the idea behind The Winsome Company Collection: a selection of designs, colors, and personalization options chosen with your team. Get in touch and we’ll share how it could work for your company.',
  },
];

function Faq() {
  return (
    <section aria-labelledby="faq-title" className="bg-[#FAF8F5] py-16 lg:py-24">
      <div className="container max-w-3xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <Eyebrow>Questions</Eyebrow>
          <h2
            id="faq-title"
            className="font-serif font-medium text-3xl md:text-[2.6rem] leading-tight text-[#1B294E]"
          >
            Frequently Asked Questions
          </h2>
          <Rule className="mt-6" />
        </div>
        <div className="border-t border-[#C9A96E]/35">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group border-b border-[#C9A96E]/35"
            >
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
        <p className="text-center mt-10 font-sans font-light text-[14px] text-[#2D2D2D]/65">
          Have a different question?{' '}
          <AnchorButton to={SECTION_IDS.inquiry} variant="text">
            Ask us directly
          </AnchorButton>
        </p>
      </div>
    </section>
  );
}

/* ----------------------------- Inquiry ---------------------------- */

function Inquiry() {
  const result = useActionData<typeof action>() as InquiryResult | undefined;
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

  return (
    <section
      id={SECTION_IDS.inquiry}
      aria-labelledby="inquiry-title"
      className="scroll-mt-28 bg-[#ECF2F5] py-16 lg:py-24 pb-28 md:pb-24"
    >
      <div className="container max-w-6xl mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <Eyebrow>Let&rsquo;s Work Together</Eyebrow>
            <h2
              id="inquiry-title"
              className="font-serif font-medium text-[2.3rem] md:text-5xl leading-[1.08] text-[#1B294E]"
            >
              Let&rsquo;s Make Business More Personal.
            </h2>
            <div className="mt-6 space-y-4 font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/75">
              <p>
                Every company is different. We&rsquo;d love to help you create a
                stationery or gifting program that feels uniquely yours.
              </p>
              <p>
                Whether you&rsquo;re ordering for five employees or five hundred
                clients, let&rsquo;s explore the possibilities.
              </p>
            </div>
            <p className="mt-8 font-sans font-light text-[13px] text-[#2D2D2D]/60">
              Prefer email? Write to us at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#1B294E] underline decoration-[#C9A96E] underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>

          <div className="bg-white ring-1 ring-[#1B294E]/10 shadow-[0_24px_50px_-30px_rgba(27,41,78,0.3)] p-6 sm:p-9">
            {result?.ok ? (
              <div
                ref={confirmRef}
                tabIndex={-1}
                role="status"
                className="text-center py-10 focus:outline-none"
              >
                <Rule />
                <p
                  className="mt-6 text-[2.4rem] text-[#1B294E]"
                  style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
                >
                  Thank you
                </p>
                <h3 className="font-serif font-medium text-2xl text-[#1B294E] mt-2">
                  We&rsquo;ve received your inquiry.
                </h3>
                <p className="font-sans font-light text-[15px] leading-relaxed text-[#2D2D2D]/70 mt-4 max-w-md mx-auto">
                  A member of our team will be in touch soon to talk through
                  your project. In the meantime, feel free to browse our{' '}
                  <Link
                    to="/collections/business-professional"
                    className="text-[#1B294E] underline decoration-[#C9A96E] underline-offset-2"
                  >
                    business stationery
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <Form method="post" preventScrollReset noValidate={false}>
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
                        We&rsquo;re sorry, we couldn&rsquo;t send your inquiry
                        just now. Please try again in a moment, or email us at{' '}
                        <a
                          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Business & Corporate Gifting inquiry')}`}
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
                    Website
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field id="ci-name" label="Name" required error={fieldErrors.name} labelCls={label}>
                    <input
                      id="ci-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      aria-invalid={Boolean(fieldErrors.name) || undefined}
                      aria-describedby={fieldErrors.name ? 'ci-name-error' : undefined}
                      className={input}
                    />
                  </Field>
                  <Field id="ci-email" label="Work email" required error={fieldErrors.email} labelCls={label}>
                    <input
                      id="ci-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email) || undefined}
                      aria-describedby={fieldErrors.email ? 'ci-email-error' : undefined}
                      className={input}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field id="ci-company" label="Company name" required error={fieldErrors.company} labelCls={label}>
                    <input
                      id="ci-company"
                      name="company"
                      type="text"
                      required
                      autoComplete="organization"
                      aria-invalid={Boolean(fieldErrors.company) || undefined}
                      aria-describedby={fieldErrors.company ? 'ci-company-error' : undefined}
                      className={input}
                    />
                  </Field>
                </div>

                <fieldset className="mt-7">
                  <legend className={label}>
                    What are you interested in?{' '}
                    <span className="normal-case tracking-normal font-light text-[#2D2D2D]/50">
                      (choose any)
                    </span>
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {INTEREST_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className="flex items-start gap-3 px-4 py-3 bg-[#FAF8F5] ring-1 ring-[#1B294E]/12 cursor-pointer hover:ring-[#C9A96E]/70 has-[:checked]:ring-[#1B294E] has-[:checked]:bg-[#ECF2F5] transition-colors"
                      >
                        <input
                          type="checkbox"
                          name="interests"
                          value={opt}
                          className="mt-0.5 w-4 h-4 accent-[#1B294E]"
                        />
                        <span className="font-sans text-[14px] leading-snug text-[#2D2D2D]/85">
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-7">
                  <legend className={label}>Approximate quantity</legend>
                  <div className="flex flex-wrap gap-2.5">
                    {QUANTITY_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className="relative px-4 py-2.5 bg-[#FAF8F5] ring-1 ring-[#1B294E]/12 cursor-pointer hover:ring-[#C9A96E]/70 has-[:checked]:ring-[#1B294E] has-[:checked]:bg-[#1B294E] has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#C9A96E] has-[:focus-visible]:outline-offset-2 font-sans text-[14px] text-[#2D2D2D]/85 transition-colors"
                      >
                        <input
                          type="radio"
                          name="quantity"
                          value={opt}
                          className="sr-only"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-7">
                  <label htmlFor="ci-project" className={label}>
                    Tell us a little about your project{' '}
                    <span className="normal-case tracking-normal font-light text-[#2D2D2D]/50">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="ci-project"
                    name="project"
                    rows={5}
                    maxLength={5000}
                    placeholder="Occasions, timing, who it's for, or anything you're imagining."
                    className={`${input} resize-y`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-8 w-full sm:w-auto inline-flex items-center justify-center bg-[#1B294E] text-white hover:bg-[#2D2D2D] disabled:opacity-60 disabled:cursor-wait px-10 py-4 font-sans font-medium text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A96E]"
                >
                  {submitting ? 'Sending…' : 'Let’s Create Something Together'}
                </button>
                <p className="mt-4 font-sans font-light text-[12px] text-[#2D2D2D]/50">
                  No phone number needed. We&rsquo;ll reply by email.
                </p>
              </Form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  required,
  error,
  labelCls,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  labelCls: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required ? (
          <span className="text-[#C9A96E]" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 font-sans text-[13px] text-[#9E1B32]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------- Mobile sticky CTA ----------------------- */

/** Phone-only inquiry bar: appears after the hero, hides once the form is on screen. */
function MobileInquiryBar() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('corporate-hero');
    const form = document.getElementById(SECTION_IDS.inquiry);
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
        href={`#${SECTION_IDS.inquiry}`}
        onClick={(e) => scrollToId(e, SECTION_IDS.inquiry)}
        tabIndex={show ? 0 : -1}
        className="flex items-center justify-center w-full bg-[#1B294E] text-white py-3.5 font-sans font-medium text-[12px] tracking-[0.18em] uppercase"
      >
        Let&rsquo;s Work Together
      </a>
    </div>
  );
}
