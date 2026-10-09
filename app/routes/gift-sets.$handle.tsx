/**
 * Gift Set Detail Page — Hydrogen + Winsome brand UI.
 *
 * Renders a curated 5-piece gift set. The gift set catalog lives client-side
 * in ~/lib/bundles (no Storefront query yet — these are not Shopify products),
 * so the loader just resolves the handle and the component looks up the gift
 * set synchronously. Add-to-Cart uses Hydrogen's CartForm with personalization
 * + gift options serialized as line item attributes (matching the PDP pattern).
 */
import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {motion} from 'framer-motion';
import {
  Gift,
  Tag,
  Check,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Minus,
  Plus,
  FileText,
  StickyNote,
  Calendar,
  Coffee,
} from 'lucide-react';
import type {Route} from './+types/gift-sets.$handle';
import GiftMessage from '~/components/GiftMessage';
import SubscribeAndSave, {
  type PurchaseMode,
  type SubscriptionCadence,
  calculateSubscriptionPrice,
} from '~/components/SubscribeAndSave';
import {
  getGiftSetBySlug,
  getRelatedGiftSets,
  type GiftSet,
  type ItemType,
} from '~/lib/bundles';
import {
  defaultPersonalizationValue,
  PersonalizationPanel,
  type PersonalizationValue,
} from '~/components/PersonalizationPanel';
import {VARIANT_PRESETS} from '~/lib/variants';

export const meta: Route.MetaFunction = ({data}) => {
  const name = data?.giftSet?.name ?? 'Gift Set';
  return [
    {title: `${name} | The Winsome Life`},
    {
      name: 'description',
      content:
        data?.giftSet?.tagline ??
        'A carefully curated gift set from The Winsome Life — personalized stationery paired with matching lifestyle pieces.',
    },
  ];
};

export async function loader({params}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Response(null, {status: 404});
  const giftSet = getGiftSetBySlug(handle) ?? null;
  return {handle, giftSet};
}

const itemTypeIcons: Record<ItemType, typeof FileText> = {
  notecards: FileText,
  notepad: StickyNote,
  calendar: Calendar,
  mug: Coffee,
  'gift-tags': Gift,
};

const itemTypeLabels: Record<ItemType, string> = {
  notecards: 'Notecards',
  notepad: 'Notepad',
  calendar: 'Desk Calendar',
  mug: 'Ceramic Mug',
  'gift-tags': 'Gift Tags',
};

/**
 * Serialize the personalization payload into Shopify cart line attributes.
 * Mirrors the helper in routes/products.$handle.tsx so gift sets and PDPs
 * pass identical structured data into the cart/order.
 */
function buildLineAttributes(p: PersonalizationValue) {
  const attrs: Array<{key: string; value: string}> = [];
  if (p.mode) attrs.push({key: '_Personalization Mode', value: p.mode});
  if (p.monogramStyleKey)
    attrs.push({key: '_Monogram Style', value: p.monogramStyleKey});
  if (p.fontKey) attrs.push({key: '_Font', value: p.fontKey});
  if (p.inkKey) attrs.push({key: '_Ink Color', value: p.inkKey});
  for (const [k, v] of Object.entries(p.fields ?? {})) {
    if (v) attrs.push({key: `_${k}`, value: String(v)});
  }
  return attrs;
}

function GiftSetHero({giftSet}: {giftSet: GiftSet}) {
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('one-time');
  const [cadence, setCadence] = useState<SubscriptionCadence>('monthly');
  const [giftMessage, setGiftMessage] = useState<string | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);

  // Personalization — gift sets always use the notecards preset as the
  // canonical schema (name/monogram fields all five pieces share).
  const preset = VARIANT_PRESETS.notecards;
  const [personalization, setPersonalization] = useState<PersonalizationValue>(
    () => defaultPersonalizationValue(preset.personalization),
  );

  const totalIndividual = giftSet.items.reduce(
    (sum, item) => sum + item.individualPrice,
    0,
  );
  const activePrice =
    purchaseMode === 'subscribe'
      ? calculateSubscriptionPrice(giftSet.setPrice)
      : giftSet.setPrice;

  const lineAttributes = [
    ...buildLineAttributes(personalization),
    {key: '_Gift Set', value: giftSet.name},
    {key: '_Purchase Mode', value: purchaseMode},
    ...(purchaseMode === 'subscribe'
      ? [{key: '_Subscription Cadence', value: cadence}]
      : []),
    ...(giftWrap ? [{key: '_Gift Wrap', value: 'Yes'}] : []),
    ...(giftMessage ? [{key: 'Gift Message', value: giftMessage}] : []),
  ];

  // Gift sets aren't real Shopify variants yet — use the slug as a stand-in id
  // so the CartForm payload is structurally complete. Swap to a real variant
  // id once the gift-set products land in Shopify.
  const merchandiseId = `gid://shopify/ProductVariant/giftset-${giftSet.slug}`;

  return (
    <section className="py-8 lg:py-14 bg-white">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="mb-6 lg:mb-8">
          <ol className="font-sans flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[#2D2D2D]/40">
            <li>
              <Link to="/" className="hover:text-[#2D2D2D] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight size={12} className="text-[#2D2D2D]/25" />
            </li>
            <li>
              <Link
                to="/gift-sets"
                className="hover:text-[#2D2D2D] transition-colors"
              >
                Gift Sets
              </Link>
            </li>
            <li>
              <ChevronRight size={12} className="text-[#2D2D2D]/25" />
            </li>
            <li className="text-[#2D2D2D]/70">{giftSet.name}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Image */}
          <motion.div
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.6, ease: 'easeOut'}}
          >
            <div className="relative bg-[#FAF8F5] overflow-hidden">
              <div className="aspect-[4/3]">
                <img
                  src={giftSet.image}
                  alt={giftSet.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="font-sans font-semibold absolute top-5 right-5 px-4 py-2 bg-white/90 backdrop-blur-sm text-[#C9A96E] text-xs tracking-[0.15em] uppercase flex items-center gap-2">
                <Tag size={14} strokeWidth={1.5} />
                Save ${giftSet.savings}
              </div>
              {giftSet.badge && (
                <div className="font-sans font-semibold absolute top-5 left-5 px-3 py-1.5 bg-[#C9A96E] text-white text-[10px] tracking-[0.2em] uppercase">
                  {giftSet.badge}
                </div>
              )}
            </div>

            {/* 5-piece icon strip */}
            <div className="mt-4 flex items-center justify-center gap-4 py-3 bg-[#FAF8F5] border border-[#2D2D2D]/5">
              {giftSet.items.map((item) => {
                const Icon = itemTypeIcons[item.type];
                return (
                  <div
                    key={item.type}
                    className="flex flex-col items-center gap-1"
                  >
                    <Icon
                      size={16}
                      className="text-[#C9A96E]"
                      strokeWidth={1.5}
                    />
                    <span className="font-sans font-medium text-[9px] tracking-[0.1em] uppercase text-[#2D2D2D]/40">
                      {itemTypeLabels[item.type]}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.6, ease: 'easeOut', delay: 0.1}}
          >
            <p className="font-sans font-medium text-[10px] tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
              {giftSet.categoryLabel} Gift Set &middot; {giftSet.items.length}{' '}
              Pieces
            </p>
            <h1 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D] mb-2 leading-tight">
              {giftSet.name}
            </h1>
            <p
              className="text-base text-[#2D2D2D]/50 mb-6"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              {giftSet.tagline}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-serif font-semibold text-3xl text-[#2D2D2D]">
                $
                {purchaseMode === 'subscribe'
                  ? activePrice.toFixed(0)
                  : giftSet.setPrice}
              </span>
              <span className="font-sans font-light text-lg text-[#2D2D2D]/30 line-through">
                $
                {purchaseMode === 'subscribe'
                  ? giftSet.setPrice
                  : totalIndividual}
              </span>
              <span className="font-sans font-semibold text-xs px-2.5 py-1 bg-[#C9A96E]/10 text-[#C9A96E] tracking-[0.1em] uppercase">
                {purchaseMode === 'subscribe'
                  ? `Save ${Math.round(giftSet.setPrice - activePrice + giftSet.savings)} total`
                  : `Save ${Math.round((giftSet.savings / totalIndividual) * 100)}%`}
              </span>
            </div>

            <div className="w-full h-[1px] bg-[#2D2D2D]/8 mb-6" />

            <p className="font-sans font-light text-sm text-[#2D2D2D]/60 leading-relaxed mb-8">
              {giftSet.description}
            </p>

            {/* What's included */}
            <div className="mb-8">
              <p className="font-sans font-medium text-xs tracking-[0.2em] uppercase text-[#2D2D2D]/40 mb-4">
                What&rsquo;s In This Gift Set
              </p>
              <div className="space-y-3">
                {giftSet.items.map((item) => {
                  const Icon = itemTypeIcons[item.type];
                  return (
                    <div
                      key={item.type}
                      className="flex items-start gap-3 p-3 bg-[#FAF8F5] border border-[#2D2D2D]/5"
                    >
                      <div className="w-8 h-8 rounded-full bg-white border border-[#C9A96E]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon
                          size={14}
                          className="text-[#C9A96E]"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className="text-sm text-[#2D2D2D]"
                            style={{
                              fontFamily: "'Montserrat', sans-serif",
                              fontWeight: 500,
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            className="text-xs text-[#2D2D2D]/35 line-through"
                            style={{
                              fontFamily: "'Montserrat', sans-serif",
                              fontWeight: 300,
                            }}
                          >
                            ${item.individualPrice}
                          </p>
                        </div>
                        <p
                          className="text-xs text-[#2D2D2D]/45 mt-0.5"
                          style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 300,
                          }}
                        >
                          {item.quantity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personalization */}
            {giftSet.personalizable && (
              <div className="mb-6">
                <PersonalizationPanel
                  schema={preset.personalization}
                  value={personalization}
                  onChange={setPersonalization}
                />
              </div>
            )}

            {/* Subscribe & Save */}
            <SubscribeAndSave
              price={giftSet.setPrice}
              onModeChange={setPurchaseMode}
              onCadenceChange={setCadence}
            />

            {/* Gift Message */}
            <GiftMessage
              onGiftMessageChange={setGiftMessage}
              onGiftWrapChange={setGiftWrap}
              className="mb-6"
            />

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-[#2D2D2D]/15">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#2D2D2D]/40 hover:text-[#2D2D2D] transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="font-sans font-medium w-10 h-10 flex items-center justify-center text-sm text-[#2D2D2D] border-x border-[#2D2D2D]/15">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#2D2D2D]/40 hover:text-[#2D2D2D] transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <CartForm
                route="/cart"
                inputs={{
                  lines: [
                    {
                      merchandiseId,
                      quantity,
                      attributes: lineAttributes,
                    },
                  ],
                }}
                action={CartForm.ACTIONS.LinesAdd}
              >
                {(fetcher) => (
                  <button
                    type="submit"
                    disabled={fetcher.state !== 'idle'}
                    className="font-sans font-medium flex-1 h-12 bg-[#2D2D2D] text-white text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={15} strokeWidth={1.5} />
                    {fetcher.state !== 'idle'
                      ? 'Adding…'
                      : purchaseMode === 'subscribe'
                        ? 'Subscribe & Save'
                        : 'Add Gift Set to Cart'}
                  </button>
                )}
              </CartForm>
            </div>

            <a
              href="https://www.thewinsomelife.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-medium w-full h-11 border border-[#C9A96E] text-[#C9A96E] text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-[#C9A96E] hover:text-white transition-colors duration-300"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              Buy on Shopify
            </a>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {[
                'Free shipping over $75',
                'Personalized for you',
                'Gift-ready packaging',
              ].map((text) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Check
                    size={13}
                    className="text-[#C9A96E]"
                    strokeWidth={2}
                  />
                  <span
                    className="text-xs text-[#2D2D2D]/45"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ItemsShowcase({giftSet}: {giftSet: GiftSet}) {
  return (
    <section className="py-16 lg:py-22 bg-[#FAF8F5]">
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.15}}
          transition={{duration: 0.6, ease: 'easeOut'}}
          className="text-center mb-12"
        >
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            Inside This Gift Set
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            Five Pieces, One Beautiful Design
          </h2>
        </motion.div>

        {/* Top row: 3 items */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-6 lg:mb-8">
          {giftSet.items.slice(0, 3).map((item, i) => {
            const Icon = itemTypeIcons[item.type];
            return (
              <motion.div
                key={item.type}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.15}}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                  delay: 0.1 + i * 0.1,
                }}
                className="bg-white p-6 lg:p-8 border border-[#2D2D2D]/5 text-center"
              >
                <div className="w-14 h-14 rounded-full border border-[#C9A96E]/25 flex items-center justify-center mx-auto mb-5">
                  <Icon
                    size={22}
                    className="text-[#C9A96E]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-serif font-medium text-base text-[#2D2D2D] mb-2">
                  {item.label}
                </h3>
                <p className="font-sans font-medium text-xs text-[#C9A96E] tracking-[0.15em] uppercase mb-3">
                  {item.quantity}
                </p>
                <p className="font-sans font-light text-sm text-[#2D2D2D]/50 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom row: 2 items centered */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          {giftSet.items.slice(3).map((item, i) => {
            const Icon = itemTypeIcons[item.type];
            return (
              <motion.div
                key={item.type}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.15}}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                  delay: 0.4 + i * 0.1,
                }}
                className="bg-white p-6 lg:p-8 border border-[#2D2D2D]/5 text-center"
              >
                <div className="w-14 h-14 rounded-full border border-[#C9A96E]/25 flex items-center justify-center mx-auto mb-5">
                  <Icon
                    size={22}
                    className="text-[#C9A96E]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-serif font-medium text-base text-[#2D2D2D] mb-2">
                  {item.label}
                </h3>
                <p className="font-sans font-medium text-xs text-[#C9A96E] tracking-[0.15em] uppercase mb-3">
                  {item.quantity}
                </p>
                <p className="font-sans font-light text-sm text-[#2D2D2D]/50 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RelatedGiftSets({currentSlug}: {currentSlug: string}) {
  const related = getRelatedGiftSets(currentSlug, 3);
  if (related.length === 0) return null;

  return (
    <section className="py-16 lg:py-22 bg-white">
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.1}}
          transition={{duration: 0.6, ease: 'easeOut'}}
          className="text-center mb-10 lg:mb-12"
        >
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            You Might Also Love
          </p>
          <h2 className="font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">
            More Gift Sets
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {related.map((gs, i) => {
            const totalIndividual = gs.items.reduce(
              (sum, item) => sum + item.individualPrice,
              0,
            );
            return (
              <motion.div
                key={gs.slug}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.1}}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                  delay: 0.1 + i * 0.08,
                }}
              >
                <Link to={`/gift-sets/${gs.slug}`} className="group block">
                  <div className="relative overflow-hidden mb-4 bg-[#FAF8F5]">
                    <div className="aspect-[4/3]">
                      <img
                        src={gs.image}
                        alt={gs.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-[#2D2D2D]/0 group-hover:bg-[#2D2D2D]/10 transition-colors duration-500" />
                  </div>
                  <p className="font-sans font-medium text-[10px] tracking-[0.25em] uppercase text-[#C9A96E] mb-1">
                    {gs.categoryLabel} &middot; {gs.items.length} Pieces
                  </p>
                  <h3 className="font-serif font-medium text-base text-[#2D2D2D] mb-1 group-hover:text-[#C9A96E] transition-colors">
                    {gs.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-base text-[#2D2D2D]">
                      ${gs.setPrice}
                    </span>
                    <span className="font-sans text-sm text-[#2D2D2D]/30 line-through">
                      ${totalIndividual}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/gift-sets"
            className="font-sans font-medium inline-flex items-center gap-2 px-8 py-3 border border-[#C9A96E] text-[#C9A96E] text-xs tracking-[0.15em] uppercase hover:bg-[#C9A96E] hover:text-white transition-colors duration-300"
          >
            View All Gift Sets
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function GiftSetDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const {handle, giftSet} = loaderData;
  // navigate is reserved for future flows (e.g. after-add redirects).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [handle]);

  if (!giftSet) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <div className="container py-32 text-center">
          <h1 className="font-serif font-medium text-3xl text-[#2D2D2D] mb-4">
            Gift Set Not Found
          </h1>
          <p className="font-sans font-light text-base text-[#2D2D2D]/50 mb-8">
            We couldn&rsquo;t find the gift set you&rsquo;re looking for.
          </p>
          <Link
            to="/gift-sets"
            className="font-sans font-medium inline-flex items-center gap-2 px-8 py-3 bg-[#2D2D2D] text-white text-xs tracking-[0.15em] uppercase hover:bg-[#1a1a1a] transition-colors"
          >
            Browse All Gift Sets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <GiftSetHero giftSet={giftSet} />
      <ItemsShowcase giftSet={giftSet} />
      <RelatedGiftSets currentSlug={giftSet.slug} />
    </div>
  );
}
