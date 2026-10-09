/*
 * Design: The Stationery Atelier
 * Build Your Own Bundle: Three-panel interactive builder.
 * Panel 1: Categories (Sports, Coastal, Pets, Floral)
 * Panel 2: Themes within selected category
 * Panel 3: Preview of selected theme graphic
 * After selecting → live personalization with name/initials overlay on bundle image.
 * Includes Subscribe & Save 15% option integrated into the personalization step.
 */
import {useState, useEffect} from 'react';
import {Link} from 'react-router';
import {motion, AnimatePresence} from 'framer-motion';
import {CartForm} from '@shopify/hydrogen';
import type {Route} from './+types/build-your-own';
import {FONTS, INK_COLORS} from '~/lib/variants';
import {cn} from '~/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Palette,
  Type,
  Gift,
  FileText,
  StickyNote,
  Calendar,
  Coffee,
  Tag,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import Newsletter from '~/components/Newsletter';
import {giftSets, type GiftSet} from '~/lib/bundles';
import {toast} from 'sonner';
import GiftMessage from '~/components/GiftMessage';

export const meta: Route.MetaFunction = () => [
  {title: 'Build Your Own | The Winsome Life'},
  {
    name: 'description',
    content:
      "Design your own custom gift set. Choose a theme, personalize with initials or a name, and we'll wrap and ship — beautifully.",
  },
];

/* ─── Category metadata ─── */
const CATEGORIES = [
  {
    slug: 'sports',
    label: 'Sports',
    description: 'Lacrosse, tennis, pickleball & more',
    icon: '🏆',
    color: '#4A7C59',
  },
  {
    slug: 'coastal',
    label: 'Coastal',
    description: 'Seahorses, sailboats & ocean life',
    icon: '🐚',
    color: '#92cde1',
  },
  {
    slug: 'pets',
    label: 'Pets',
    description: 'Golden retrievers, labradors & friends',
    icon: '🐾',
    color: '#C9A96E',
  },
  {
    slug: 'floral',
    label: 'Floral',
    description: 'Hydrangeas, peonies & garden blooms',
    icon: '🌸',
    color: '#f5b7c2',
  },
];

const ITEM_ICONS = [
  {icon: FileText, label: 'Notecards', detail: 'Set of 24'},
  {icon: StickyNote, label: 'Notepad', detail: '50 sheets'},
  {icon: Calendar, label: 'Calendar', detail: '12 months'},
  {icon: Coffee, label: 'Mug', detail: '15 oz'},
  {icon: Tag, label: 'Gift Tags', detail: 'Set of 12'},
];

type PersonalizationType = 'monogram' | 'full-name';
type PurchaseMode = 'one-time' | 'subscribe';
type SubscriptionCadence = 'monthly' | 'quarterly';

/* ─── Local progress persistence (replaces useBYOProgress hook) ─── */
interface BYOState {
  selectedCategory: string | null;
  selectedThemeSlug: string | null;
  step: 'browse' | 'personalize';
  personalizationType: PersonalizationType;
  personalizationText: string;
  personalizationFontKey: string;
  personalizationInkKey: string;
  purchaseMode: PurchaseMode;
  cadence: SubscriptionCadence;
  giftMessage: string | null;
  giftWrap: boolean;
}

const BYO_STORAGE_KEY = 'winsome:byo-progress';

function loadSaved(): BYOState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BYO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BYOState) : null;
  } catch {
    return null;
  }
}

function saveProgress(state: BYOState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BYO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * Serialize the bundle config into Shopify cart line attributes so the
 * personalization survives into checkout and the order detail.
 * Mirrors `buildLineAttributes` from products.$handle.tsx.
 */
function buildLineAttributes(opts: {
  theme: GiftSet;
  personalizationType: PersonalizationType;
  personalizationText: string;
  personalizationFontKey: string;
  personalizationInkKey: string;
  purchaseMode: PurchaseMode;
  cadence: SubscriptionCadence;
  giftMessage: string | null;
  giftWrap: boolean;
}) {
  const attrs: Array<{key: string; value: string}> = [];
  attrs.push({key: '_Bundle Slug', value: opts.theme.slug});
  attrs.push({key: '_Bundle Name', value: opts.theme.name});
  attrs.push({key: '_Personalization Mode', value: opts.personalizationType});
  if (opts.personalizationText)
    attrs.push({key: '_Personalization Text', value: opts.personalizationText});
  attrs.push({key: '_Font', value: opts.personalizationFontKey});
  attrs.push({key: '_Ink Color', value: opts.personalizationInkKey});
  attrs.push({key: '_Purchase Mode', value: opts.purchaseMode});
  if (opts.purchaseMode === 'subscribe')
    attrs.push({key: '_Subscription Cadence', value: opts.cadence});
  if (opts.giftMessage)
    attrs.push({key: '_Gift Message', value: opts.giftMessage});
  if (opts.giftWrap) attrs.push({key: '_Gift Wrap', value: 'yes'});
  return attrs;
}

/* ─── Main Page ─── */
export default function BuildYourOwnRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<GiftSet | null>(null);
  const [step, setStep] = useState<'browse' | 'personalize'>('browse');
  const [personalizationType, setPersonalizationType] =
    useState<PersonalizationType>('monogram');
  const [personalizationText, setPersonalizationText] = useState('');
  const [personalizationFontKey, setPersonalizationFontKey] = useState<string>(
    'parisian-script',
  );
  const [personalizationInkKey, setPersonalizationInkKey] =
    useState<string>('gold');
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('one-time');
  const [cadence, setCadence] = useState<SubscriptionCadence>('monthly');
  const [giftMessage, setGiftMessage] = useState<string | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);
  const [restoredFromSave, setRestoredFromSave] = useState(false);

  // Scroll to top on mount, restore saved progress if present
  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = loadSaved();
    if (saved && !restoredFromSave) {
      setSelectedCategory(saved.selectedCategory);
      if (saved.selectedThemeSlug) {
        const theme =
          giftSets.find((s) => s.slug === saved.selectedThemeSlug) ?? null;
        setSelectedTheme(theme);
      }
      setStep(saved.step);
      setPersonalizationType(saved.personalizationType);
      setPersonalizationText(saved.personalizationText);
      if (saved.personalizationFontKey)
        setPersonalizationFontKey(saved.personalizationFontKey);
      if (saved.personalizationInkKey)
        setPersonalizationInkKey(saved.personalizationInkKey);
      setPurchaseMode(saved.purchaseMode);
      setCadence(saved.cadence);
      setGiftMessage(saved.giftMessage);
      setGiftWrap(saved.giftWrap);
      setRestoredFromSave(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on any change
  useEffect(() => {
    if (!selectedCategory && step === 'browse' && !personalizationText) return;
    saveProgress({
      selectedCategory,
      selectedThemeSlug: selectedTheme?.slug ?? null,
      step,
      personalizationType,
      personalizationText,
      personalizationFontKey,
      personalizationInkKey,
      purchaseMode,
      cadence,
      giftMessage,
      giftWrap,
    });
  }, [
    selectedCategory,
    selectedTheme?.slug,
    step,
    personalizationType,
    personalizationText,
    personalizationFontKey,
    personalizationInkKey,
    purchaseMode,
    cadence,
    giftMessage,
    giftWrap,
  ]);

  // Get themes for selected category
  const themesInCategory = selectedCategory
    ? giftSets.filter((s) => s.category === selectedCategory)
    : [];

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedTheme(null);
  };

  const handleThemeSelect = (gs: GiftSet) => {
    setSelectedTheme(gs);
  };

  const handleSubmit = () => {
    if (selectedTheme) {
      setStep('personalize');
      setPersonalizationText('');
      setPurchaseMode('one-time');
      setCadence('monthly');
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const handleBackToBrowse = () => {
    setStep('browse');
  };

  // Calculate subscription price
  const subscriptionPrice = selectedTheme
    ? Math.round(selectedTheme.setPrice * 0.85 * 100) / 100
    : 0;

  // Active price based on purchase mode
  const activePrice = selectedTheme
    ? purchaseMode === 'subscribe'
      ? subscriptionPrice
      : selectedTheme.setPrice
    : 0;

  // Display text for preview
  const displayText =
    personalizationText ||
    (personalizationType === 'monogram' ? 'ABC' : 'Your Name');
  const isPlaceholder = !personalizationText;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <main>
        {/* Header */}
        <div className="bg-white border-b border-[#C9A96E]/15">
          <div className="container py-6 lg:py-8">
            <div className="flex items-center gap-2 text-xs mb-3">
              <Link
                to="/"
                className="font-sans text-[#2D2D2D]/40 hover:text-[#C9A96E] transition-colors"
              >
                Home
              </Link>
              <ChevronRight size={12} className="text-[#2D2D2D]/20" />
              <Link
                to="/gift-sets"
                className="font-sans text-[#2D2D2D]/40 hover:text-[#C9A96E] transition-colors"
              >
                Gift Sets
              </Link>
              <ChevronRight size={12} className="text-[#2D2D2D]/20" />
              <span className="font-sans text-[#C9A96E]">Build Your Own</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                <Palette size={18} className="text-[#C9A96E]" />
              </div>
              <div>
                <h1 className="font-serif font-medium text-2xl md:text-3xl text-[#2D2D2D]">
                  Build Your Own Gift Set
                </h1>
                <p className="font-sans font-light text-sm text-[#2D2D2D]/50 mt-0.5">
                  Choose a design, personalize it, and we&rsquo;ll create your
                  custom 5-piece collection
                </p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-4 mt-5">
              <StepPill
                number={1}
                label="Choose a Design"
                active={step === 'browse'}
                completed={step === 'personalize'}
              />
              <div className="w-8 h-[1px] bg-[#C9A96E]/20" />
              <StepPill
                number={2}
                label="Personalize & Purchase"
                active={step === 'personalize'}
                completed={false}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'browse' ? (
            <motion.div
              key="browse"
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -20}}
              transition={{duration: 0.35}}
            >
              <BrowseStep
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                themesInCategory={themesInCategory}
                selectedTheme={selectedTheme}
                onCategorySelect={handleCategorySelect}
                onThemeSelect={handleThemeSelect}
                onSubmit={handleSubmit}
              />
            </motion.div>
          ) : (
            <motion.div
              key="personalize"
              initial={{opacity: 0, x: 20}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 20}}
              transition={{duration: 0.35}}
            >
              <PersonalizeStep
                theme={selectedTheme!}
                personalizationType={personalizationType}
                personalizationText={personalizationText}
                personalizationFontKey={personalizationFontKey}
                personalizationInkKey={personalizationInkKey}
                displayText={displayText}
                isPlaceholder={isPlaceholder}
                purchaseMode={purchaseMode}
                cadence={cadence}
                activePrice={activePrice}
                subscriptionPrice={subscriptionPrice}
                onTypeChange={setPersonalizationType}
                onTextChange={setPersonalizationText}
                onFontKeyChange={setPersonalizationFontKey}
                onInkKeyChange={setPersonalizationInkKey}
                onPurchaseModeChange={setPurchaseMode}
                onCadenceChange={setCadence}
                onBack={handleBackToBrowse}
                giftMessage={giftMessage}
                giftWrap={giftWrap}
                onGiftMessageChange={setGiftMessage}
                onGiftWrapChange={setGiftWrap}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Newsletter />
    </div>
  );
}

/* ─── Step Pill ─── */
function StepPill({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`font-sans font-semibold w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
          completed
            ? 'bg-[#C9A96E] text-white'
            : active
              ? 'bg-[#2D2D2D] text-white'
              : 'bg-[#2D2D2D]/10 text-[#2D2D2D]/40'
        }`}
      >
        {completed ? <Check size={12} strokeWidth={3} /> : number}
      </div>
      <span
        className={`text-xs tracking-[0.05em] uppercase transition-colors duration-300 ${
          active
            ? 'text-[#2D2D2D]'
            : completed
              ? 'text-[#C9A96E]'
              : 'text-[#2D2D2D]/30'
        }`}
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: active ? 600 : 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Browse Step: Three-Panel Layout ─── */
function BrowseStep({
  categories,
  selectedCategory,
  themesInCategory,
  selectedTheme,
  onCategorySelect,
  onThemeSelect,
  onSubmit,
}: {
  categories: typeof CATEGORIES;
  selectedCategory: string | null;
  themesInCategory: GiftSet[];
  selectedTheme: GiftSet | null;
  onCategorySelect: (slug: string) => void;
  onThemeSelect: (gs: GiftSet) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="container py-8 lg:py-10">
      <div className="grid lg:grid-cols-12 gap-5 lg:gap-6 min-h-[520px]">
        {/* Panel 1: Categories */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[#C9A96E]/10 h-full">
            <div className="px-5 py-4 border-b border-[#C9A96E]/10">
              <h3 className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E]">
                1. Choose a Category
              </h3>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => onCategorySelect(cat.slug)}
                  className={`flex items-center gap-3 p-3.5 text-left transition-all duration-300 ${
                    selectedCategory === cat.slug
                      ? 'bg-[#FAF8F5] border border-[#C9A96E]/30'
                      : 'border border-transparent hover:bg-[#FAF8F5]/60'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p
                      className={`font-serif font-medium text-sm transition-colors ${
                        selectedCategory === cat.slug
                          ? 'text-[#2D2D2D]'
                          : 'text-[#2D2D2D]/60'
                      }`}
                    >
                      {cat.label}
                    </p>
                    <p className="font-sans font-light text-[10px] text-[#2D2D2D]/35 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                  {selectedCategory === cat.slug && (
                    <ChevronRight
                      size={14}
                      className="text-[#C9A96E] ml-auto"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Themes in category */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-[#C9A96E]/10 h-full">
            <div className="px-5 py-4 border-b border-[#C9A96E]/10">
              <h3 className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E]">
                2. Pick a Design
              </h3>
            </div>
            <div className="p-3">
              <AnimatePresence mode="wait">
                {selectedCategory ? (
                  <motion.div
                    key={selectedCategory}
                    initial={{opacity: 0, y: 8}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -8}}
                    transition={{duration: 0.25}}
                    className="grid grid-cols-2 gap-3"
                  >
                    {themesInCategory.map((gs) => (
                      <button
                        key={gs.slug}
                        onClick={() => onThemeSelect(gs)}
                        className={`group relative overflow-hidden border transition-all duration-300 ${
                          selectedTheme?.slug === gs.slug
                            ? 'border-[#C9A96E] shadow-md'
                            : 'border-[#C9A96E]/10 hover:border-[#C9A96E]/30'
                        }`}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={gs.image}
                            alt={gs.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {selectedTheme?.slug === gs.slug && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-[#C9A96E] rounded-full flex items-center justify-center">
                              <Check
                                size={11}
                                className="text-white"
                                strokeWidth={3}
                              />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 bg-white">
                          <p className="font-serif font-medium text-xs text-[#2D2D2D] text-center">
                            {gs.name.replace(' Gift Set', '')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-themes"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <p className="font-sans font-light text-sm text-[#2D2D2D]/25">
                      Select a category to see available designs
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Panel 3: Preview */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-[#C9A96E]/10 h-full">
            <div className="px-5 py-4 border-b border-[#C9A96E]/10">
              <h3 className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E]">
                3. Preview
              </h3>
            </div>
            <div className="p-4">
              <AnimatePresence mode="wait">
                {selectedTheme ? (
                  <motion.div
                    key={selectedTheme.slug}
                    initial={{opacity: 0, scale: 0.97}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 0.97}}
                    transition={{duration: 0.3}}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden mb-4">
                      <img
                        src={selectedTheme.image}
                        alt={selectedTheme.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedTheme.badge && (
                        <div className="absolute top-3 left-3">
                          <span className="font-sans font-semibold text-[10px] tracking-[0.15em] uppercase bg-[#C9A96E] text-white px-3 py-1">
                            {selectedTheme.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-serif font-medium text-lg text-[#2D2D2D] mb-1">
                      {selectedTheme.name}
                    </h4>
                    <p className="font-sans font-light text-xs text-[#2D2D2D]/45 mb-3">
                      {selectedTheme.tagline}
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      {ITEM_ICONS.map(({icon: Icon, label}) => (
                        <div key={label} className="flex items-center gap-1">
                          <Icon
                            size={12}
                            className="text-[#C9A96E]"
                            strokeWidth={1.5}
                          />
                          <span className="font-sans text-[9px] text-[#2D2D2D]/40">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="font-serif font-semibold text-xl text-[#2D2D2D]">
                        ${selectedTheme.setPrice}
                      </span>
                      <span className="font-sans text-sm text-[#2D2D2D]/30 line-through">
                        $
                        {selectedTheme.items.reduce(
                          (s, i) => s + i.individualPrice,
                          0,
                        )}
                      </span>
                      <span className="font-sans font-semibold text-[10px] tracking-[0.1em] uppercase text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5">
                        Save ${selectedTheme.savings}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#C9A96E]/[0.06] border border-[#C9A96E]/15">
                      <RotateCcw
                        size={13}
                        className="text-[#C9A96E] shrink-0"
                        strokeWidth={1.5}
                      />
                      <p className="font-sans text-[11px] text-[#2D2D2D]/55">
                        Subscribe &amp; Save{' '}
                        <span className="text-[#C9A96E] font-semibold">
                          15%
                        </span>{' '}
                        — available in the next step
                      </p>
                    </div>

                    <button
                      onClick={onSubmit}
                      className="font-sans font-medium w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#2D2D2D] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#1a1a1a] transition-colors duration-300"
                    >
                      <Sparkles size={14} strokeWidth={1.5} />
                      Personalize This Set
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-preview"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mb-4">
                      <Palette size={24} className="text-[#C9A96E]/40" />
                    </div>
                    <p className="font-serif text-sm text-[#2D2D2D]/30 mb-1">
                      Your preview will appear here
                    </p>
                    <p className="font-sans font-light text-xs text-[#2D2D2D]/20">
                      Select a category and theme to get started
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Personalize Step ─── */
function PersonalizeStep({
  theme,
  personalizationType,
  personalizationText,
  personalizationFontKey,
  personalizationInkKey,
  displayText,
  isPlaceholder,
  purchaseMode,
  cadence,
  activePrice,
  subscriptionPrice,
  onTypeChange,
  onTextChange,
  onFontKeyChange,
  onInkKeyChange,
  onPurchaseModeChange,
  onCadenceChange,
  onBack,
  giftMessage,
  giftWrap,
  onGiftMessageChange,
  onGiftWrapChange,
}: {
  theme: GiftSet;
  personalizationType: PersonalizationType;
  personalizationText: string;
  personalizationFontKey: string;
  personalizationInkKey: string;
  displayText: string;
  isPlaceholder: boolean;
  purchaseMode: PurchaseMode;
  cadence: SubscriptionCadence;
  activePrice: number;
  subscriptionPrice: number;
  onTypeChange: (t: PersonalizationType) => void;
  onTextChange: (v: string) => void;
  onFontKeyChange: (key: string) => void;
  onInkKeyChange: (key: string) => void;
  onPurchaseModeChange: (m: PurchaseMode) => void;
  onCadenceChange: (c: SubscriptionCadence) => void;
  onBack: () => void;
  giftMessage: string | null;
  giftWrap: boolean;
  onGiftMessageChange: (msg: string | null) => void;
  onGiftWrapChange: (enabled: boolean) => void;
}) {
  const font =
    FONTS.find((f) => f.key === personalizationFontKey) ?? FONTS[0];
  const ink =
    INK_COLORS.find((c) => c.key === personalizationInkKey) ?? INK_COLORS[0];
  const [cadenceOpen, setCadenceOpen] = useState(false);
  const savings = (theme.setPrice - subscriptionPrice).toFixed(2);
  const originalTotal = theme.items.reduce(
    (s, i) => s + i.individualPrice,
    0,
  );

  // Build Shopify cart line attributes carrying the bundle config.
  const lineAttributes = buildLineAttributes({
    theme,
    personalizationType,
    personalizationText,
    personalizationFontKey,
    personalizationInkKey,
    purchaseMode,
    cadence,
    giftMessage,
    giftWrap,
  });

  // TODO: Replace with a real Shopify variant ID for the bundle.
  // For now we send a synthetic merchandiseId derived from the slug; the
  // backend will need a mapping from bundle slug → Storefront variant ID.
  const merchandiseId = `gid://shopify/ProductVariant/bundle-${theme.slug}`;

  return (
    <div className="container py-8 lg:py-10">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Live preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-32">
            <div className="relative bg-white border border-[#C9A96E]/10 overflow-hidden">
              <div className="aspect-[4/3] relative">
                <img
                  src={theme.image}
                  alt={theme.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    key={`${displayText}-${personalizationFontKey}-${personalizationInkKey}`}
                    initial={{opacity: 0, scale: 0.92}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 0.28}}
                    className="bg-[#FBF5E9]/95 backdrop-blur-sm px-10 py-6 shadow-xl border border-[#C9A96E]/25"
                    style={{
                      boxShadow:
                        '0 1px 2px rgba(139,115,85,0.08), 0 18px 40px rgba(139,115,85,0.25)',
                    }}
                  >
                    <p className="font-sans font-medium text-[10px] tracking-[0.3em] uppercase text-[#C9A96E] text-center mb-2">
                      {personalizationType === 'monogram'
                        ? 'Monogram'
                        : 'Personalized'}
                    </p>
                    <p
                      className={cn(
                        'text-center transition-all duration-300 leading-none',
                        isPlaceholder ? 'opacity-25' : 'opacity-100',
                        personalizationType === 'monogram'
                          ? 'text-4xl md:text-5xl tracking-[0.1em]'
                          : 'text-3xl md:text-4xl tracking-normal',
                      )}
                      style={{fontFamily: font.fontFamily, color: ink.hex}}
                    >
                      {displayText}
                    </p>
                    <div
                      className="w-12 h-px mx-auto mt-3"
                      style={{backgroundColor: ink.hex, opacity: 0.4}}
                    />
                    <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-[#2D2D2D]/40 text-center mt-2">
                      {font.label} · {ink.label}
                    </p>
                  </motion.div>
                </div>

                {purchaseMode === 'subscribe' && (
                  <motion.div
                    initial={{opacity: 0, y: -8}}
                    animate={{opacity: 1, y: 0}}
                    className="absolute top-3 right-3"
                  >
                    <div className="flex items-center gap-1.5 bg-[#C9A96E] text-white px-3 py-1.5 shadow-lg">
                      <RotateCcw size={11} strokeWidth={2} />
                      <span className="font-sans font-semibold text-[10px] tracking-[0.1em] uppercase">
                        {cadence === 'monthly' ? 'Monthly' : 'Quarterly'}{' '}
                        Delivery
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {ITEM_ICONS.map(({icon: Icon, label, detail}) => (
                <div
                  key={label}
                  className="bg-white border border-[#C9A96E]/10 p-3 text-center"
                >
                  <Icon
                    size={16}
                    className="text-[#C9A96E] mx-auto mb-1.5"
                    strokeWidth={1.5}
                  />
                  <p className="font-sans font-medium text-[10px] tracking-[0.05em] uppercase text-[#2D2D2D]/60">
                    {label}
                  </p>
                  <p className="font-sans font-light text-[9px] text-[#2D2D2D]/30 mt-0.5">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Personalization controls */}
        <div className="lg:col-span-5">
          <button
            onClick={onBack}
            className="font-sans flex items-center gap-2 text-xs text-[#2D2D2D]/40 hover:text-[#C9A96E] transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            <span className="tracking-[0.1em] uppercase">Change Design</span>
          </button>

          <h2 className="font-serif font-medium text-2xl text-[#2D2D2D] mb-1">
            {theme.name}
          </h2>
          <p className="font-sans font-light text-sm text-[#2D2D2D]/50 mb-6">
            {theme.tagline}
          </p>

          {/* Personalization type toggle */}
          <div className="mb-6">
            <p className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-3">
              Personalization Style
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onTypeChange('monogram');
                  onTextChange('');
                }}
                className={`p-4 border text-center transition-all duration-300 ${
                  personalizationType === 'monogram'
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5'
                    : 'border-[#C9A96E]/10 bg-white hover:border-[#C9A96E]/30'
                }`}
              >
                <Type
                  size={20}
                  className="text-[#C9A96E] mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="font-serif font-medium text-sm text-[#2D2D2D]">
                  Monogram
                </p>
                <p className="font-sans font-light text-[10px] text-[#2D2D2D]/40 mt-1">
                  2-3 initials in gold foil
                </p>
              </button>
              <button
                onClick={() => {
                  onTypeChange('full-name');
                  onTextChange('');
                }}
                className={`p-4 border text-center transition-all duration-300 ${
                  personalizationType === 'full-name'
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5'
                    : 'border-[#C9A96E]/10 bg-white hover:border-[#C9A96E]/30'
                }`}
              >
                <FileText
                  size={20}
                  className="text-[#C9A96E] mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="font-serif font-medium text-sm text-[#2D2D2D]">
                  Full Name
                </p>
                <p className="font-sans font-light text-[10px] text-[#2D2D2D]/40 mt-1">
                  First &amp; last in script
                </p>
              </button>
            </div>
          </div>

          {/* Text input */}
          <div className="mb-6">
            <label className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-3 block">
              {personalizationType === 'monogram'
                ? 'Enter Your Initials'
                : 'Enter Your Name'}
            </label>
            <input
              type="text"
              value={personalizationText}
              onChange={(e) => {
                const val = e.target.value;
                if (personalizationType === 'monogram' && val.length > 3)
                  return;
                if (personalizationType === 'full-name' && val.length > 30)
                  return;
                onTextChange(val);
              }}
              placeholder={
                personalizationType === 'monogram'
                  ? 'e.g. ABC'
                  : 'e.g. Eleanor James'
              }
              className="w-full px-5 py-4 bg-white border border-[#C9A96E]/20 text-[#2D2D2D] placeholder:text-[#2D2D2D]/20 focus:outline-none focus:border-[#C9A96E] transition-colors"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 400,
                fontStyle:
                  personalizationType === 'full-name' ? 'italic' : 'normal',
              }}
              maxLength={personalizationType === 'monogram' ? 3 : 30}
            />
            <p className="font-sans font-light text-[11px] text-[#2D2D2D]/50 mt-2">
              {personalizationType === 'monogram'
                ? "Enter 2-3 initials. They'll appear on all 5 pieces."
                : "Enter your name as you'd like it to appear on the set."}
            </p>
          </div>

          {/* Font picker */}
          <div className="mb-6">
            <p className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-3">
              Font
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((f) => {
                const active = personalizationFontKey === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => onFontKeyChange(f.key)}
                    aria-pressed={active}
                    className={cn(
                      'px-2 py-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2',
                      active
                        ? 'border-2 border-[#C9A96E] bg-[#C9A96E]/5'
                        : 'border border-[#C9A96E]/25 bg-white hover:border-[#C9A96E]/60',
                    )}
                  >
                    <span
                      className="block text-xl leading-tight text-[#2D2D2D]"
                      style={{fontFamily: f.fontFamily}}
                    >
                      {f.previewText ?? 'Aa'}
                    </span>
                    <span className="font-sans font-medium text-[9px] tracking-[0.1em] uppercase text-[#2D2D2D]/55 mt-1 block">
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ink color picker */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E]">
                Ink Color
              </p>
              <span className="font-sans text-xs text-[#2D2D2D]/50">
                {ink.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INK_COLORS.map((c) => {
                const active = personalizationInkKey === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => onInkKeyChange(c.key)}
                    aria-pressed={active}
                    aria-label={c.label}
                    title={c.label}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2',
                      active
                        ? 'border-[#2D2D2D] scale-110'
                        : 'border-[#C9A96E]/25 hover:border-[#C9A96E]',
                    )}
                    style={{backgroundColor: c.hex}}
                  />
                );
              })}
            </div>
          </div>

          {/* What's Included */}
          <div className="mb-6 border border-[#C9A96E]/20 bg-white p-4">
            <p className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-3">
              Includes these items
            </p>
            <ul className="space-y-2">
              {theme.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-2 text-sm"
                >
                  <Check
                    size={14}
                    className="text-[#C9A96E] mt-0.5 shrink-0"
                    strokeWidth={2}
                  />
                  <div className="flex-1 flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[#2D2D2D]">
                      {item.label}
                      {item.quantity && (
                        <span className="font-sans font-light text-xs text-[#2D2D2D]/45 ml-1.5">
                          · {item.quantity}
                        </span>
                      )}
                    </span>
                    <span className="font-sans text-xs text-[#2D2D2D]/45 line-through">
                      ${item.individualPrice.toFixed(2)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-[#C9A96E]/15 flex items-baseline justify-between">
              <span className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/60">
                Individual value
              </span>
              <span className="font-sans text-sm text-[#2D2D2D]/70 line-through">
                ${originalTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#C9A96E]">
                Set price
              </span>
              <span className="font-serif font-medium text-lg text-[#C9A96E]">
                ${theme.setPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="h-[1px] bg-[#C9A96E]/10 mb-6" />

          {/* Subscribe & Save Section */}
          <div className="mb-6">
            <p className="font-sans font-semibold text-xs tracking-[0.2em] uppercase text-[#C9A96E] mb-3">
              Purchase Option
            </p>

            <button
              onClick={() => onPurchaseModeChange('one-time')}
              className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 text-left mb-3 ${
                purchaseMode === 'one-time'
                  ? 'border-[#C9A96E] bg-[#C9A96E]/[0.03]'
                  : 'border-[#2D2D2D]/10 hover:border-[#C9A96E]/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  purchaseMode === 'one-time'
                    ? 'border-[#C9A96E]'
                    : 'border-[#2D2D2D]/20'
                }`}
              >
                {purchaseMode === 'one-time' && (
                  <motion.div
                    initial={{scale: 0}}
                    animate={{scale: 1}}
                    className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-medium text-sm text-[#2D2D2D]">
                    One-Time Purchase
                  </span>
                  <span className="font-sans font-semibold text-sm text-[#2D2D2D]">
                    ${theme.setPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </button>

            <div
              className={`border transition-all duration-300 ${
                purchaseMode === 'subscribe'
                  ? 'border-[#C9A96E] bg-[#C9A96E]/[0.03]'
                  : 'border-[#2D2D2D]/10 hover:border-[#C9A96E]/40'
              }`}
            >
              <button
                onClick={() => onPurchaseModeChange('subscribe')}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    purchaseMode === 'subscribe'
                      ? 'border-[#C9A96E]'
                      : 'border-[#2D2D2D]/20'
                  }`}
                >
                  {purchaseMode === 'subscribe' && (
                    <motion.div
                      initial={{scale: 0}}
                      animate={{scale: 1}}
                      className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-medium text-sm text-[#2D2D2D]">
                        Subscribe & Save
                      </span>
                      <span className="font-sans font-semibold text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 bg-[#C9A96E] text-white">
                        15% Off
                      </span>
                    </div>
                    <span className="font-sans font-semibold text-sm text-[#C9A96E]">
                      ${subscriptionPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="font-sans font-light text-xs text-[#2D2D2D]/45 mt-1">
                    Save ${savings} per delivery &middot; Cancel anytime
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {purchaseMode === 'subscribe' && (
                  <motion.div
                    initial={{height: 0, opacity: 0}}
                    animate={{height: 'auto', opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    transition={{duration: 0.25, ease: 'easeInOut'}}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="border-t border-[#C9A96E]/15 pt-4">
                        <p className="font-sans font-medium text-[10px] tracking-[0.2em] uppercase text-[#2D2D2D]/40 mb-3">
                          Delivery Frequency
                        </p>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCadenceOpen(!cadenceOpen);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 border border-[#C9A96E]/25 bg-white hover:border-[#C9A96E]/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <RotateCcw
                                size={14}
                                className="text-[#C9A96E]"
                                strokeWidth={1.5}
                              />
                              <span className="font-sans font-medium text-sm text-[#2D2D2D]">
                                {cadence === 'monthly'
                                  ? 'Every Month'
                                  : 'Every 3 Months'}
                              </span>
                            </div>
                            <ChevronDown
                              size={14}
                              className={`text-[#C9A96E] transition-transform duration-200 ${
                                cadenceOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {cadenceOpen && (
                              <motion.div
                                initial={{opacity: 0, y: -4}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -4}}
                                transition={{duration: 0.15}}
                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C9A96E]/25 shadow-lg z-10"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCadenceChange('monthly');
                                    setCadenceOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAF8F5] transition-colors ${
                                    cadence === 'monthly' ? 'bg-[#FAF8F5]' : ''
                                  }`}
                                >
                                  <div>
                                    <span className="font-sans font-medium text-sm text-[#2D2D2D] block">
                                      Every Month
                                    </span>
                                    <span className="font-sans font-light text-xs text-[#2D2D2D]/40">
                                      Most popular &middot; Never run out
                                    </span>
                                  </div>
                                  {cadence === 'monthly' && (
                                    <Check
                                      size={14}
                                      className="text-[#C9A96E]"
                                    />
                                  )}
                                </button>
                                <div className="h-px bg-[#C9A96E]/10" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCadenceChange('quarterly');
                                    setCadenceOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAF8F5] transition-colors ${
                                    cadence === 'quarterly'
                                      ? 'bg-[#FAF8F5]'
                                      : ''
                                  }`}
                                >
                                  <div>
                                    <span className="font-sans font-medium text-sm text-[#2D2D2D] block">
                                      Every 3 Months
                                    </span>
                                    <span className="font-sans font-light text-xs text-[#2D2D2D]/40">
                                      Seasonal refresh &middot; Great for gifts
                                    </span>
                                  </div>
                                  {cadence === 'quarterly' && (
                                    <Check
                                      size={14}
                                      className="text-[#C9A96E]"
                                    />
                                  )}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="mt-4 space-y-2">
                          {[
                            'Save 15% on every delivery',
                            'Free shipping on all subscription orders',
                            'Skip, pause, or cancel anytime',
                            'Exclusive subscriber-only designs',
                          ].map((benefit) => (
                            <div
                              key={benefit}
                              className="flex items-center gap-2"
                            >
                              <Check
                                size={12}
                                className="text-[#C9A96E] shrink-0"
                                strokeWidth={2}
                              />
                              <span className="font-sans text-xs text-[#2D2D2D]/50">
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Gift Message */}
          <GiftMessage
            onGiftMessageChange={onGiftMessageChange}
            onGiftWrapChange={onGiftWrapChange}
            className="mb-6"
          />

          <div className="h-[1px] bg-[#C9A96E]/10 mb-6" />

          {/* Price summary */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-sans text-sm text-[#2D2D2D]/50">
                5-piece personalized gift set
              </span>
              <span className="font-sans text-sm text-[#2D2D2D]/30 line-through">
                ${originalTotal}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-serif font-semibold text-lg text-[#2D2D2D]">
                {purchaseMode === 'subscribe'
                  ? 'Subscription Price'
                  : 'Your Price'}
              </span>
              <span className="font-serif font-semibold text-2xl text-[#2D2D2D]">
                ${activePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              {purchaseMode === 'subscribe' && (
                <span className="font-sans text-[10px] text-[#2D2D2D]/30 line-through">
                  ${theme.setPrice.toFixed(2)}
                </span>
              )}
              <p className="font-sans font-semibold text-[10px] text-[#C9A96E]">
                {purchaseMode === 'subscribe'
                  ? `You save $${(originalTotal - subscriptionPrice).toFixed(2)} total`
                  : `You save $${theme.savings}`}
              </p>
            </div>
            {purchaseMode === 'subscribe' && (
              <motion.p
                initial={{opacity: 0, y: 4}}
                animate={{opacity: 1, y: 0}}
                className="font-sans font-light text-right text-[10px] text-[#2D2D2D]/35 mt-0.5"
              >
                {cadence === 'monthly'
                  ? 'Billed monthly'
                  : 'Billed every 3 months'}{' '}
                &middot; Cancel anytime
              </motion.p>
            )}
          </div>

          {/* Add bundle to cart — Hydrogen CartForm */}
          <CartForm
            route="/cart"
            inputs={{
              lines: [
                {
                  merchandiseId,
                  quantity: 1,
                  attributes: lineAttributes,
                },
              ],
            }}
            action={CartForm.ACTIONS.LinesAdd}
          >
            {(fetcher) => {
              const adding = fetcher.state !== 'idle';
              return (
                <button
                  type="submit"
                  disabled={adding}
                  onClick={() => {
                    if (purchaseMode === 'subscribe') {
                      toast.success('Subscription added to cart!', {
                        description: `${theme.name} — ${
                          cadence === 'monthly' ? 'Monthly' : 'Quarterly'
                        } delivery at $${subscriptionPrice.toFixed(2)}/delivery${
                          giftMessage ? ' · Gift message included' : ''
                        }`,
                      });
                    } else {
                      toast.success('Added to cart!', {
                        description: `${theme.name} — One-time purchase at $${theme.setPrice}${
                          giftWrap ? ' · Gift wrapped' : ''
                        }${giftMessage ? ' · Gift message included' : ''}`,
                      });
                    }
                  }}
                  className={`font-sans font-medium w-full flex items-center justify-center gap-2.5 px-6 py-4 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
                    adding
                      ? 'bg-[#C9A96E] text-white'
                      : 'bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]'
                  } disabled:opacity-80 disabled:cursor-not-allowed`}
                >
                  {adding ? (
                    <>
                      <Check size={16} strokeWidth={2} />
                      Adding…
                    </>
                  ) : purchaseMode === 'subscribe' ? (
                    <>
                      <RotateCcw size={14} strokeWidth={1.5} />
                      Subscribe &amp; Add to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} strokeWidth={1.5} />
                      Add Custom Gift Set to Cart
                    </>
                  )}
                </button>
              );
            }}
          </CartForm>

          {/* Secondary CTA */}
          <a
            href="https://www.thewinsomelife.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans w-full flex items-center justify-center gap-2 mt-3 px-6 py-3 border border-[#C9A96E]/20 text-[#C9A96E] text-xs tracking-[0.15em] uppercase hover:bg-[#C9A96E]/5 transition-colors duration-300"
          >
            Buy on Shopify
            <ArrowRight size={13} strokeWidth={1.5} />
          </a>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-6 text-[#2D2D2D]/25">
            <div className="flex items-center gap-1.5">
              <Gift size={13} strokeWidth={1.5} />
              <span className="font-sans text-[10px] tracking-[0.05em]">
                Gift-ready packaging
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} strokeWidth={1.5} />
              <span className="font-sans text-[10px] tracking-[0.05em]">
                Gold foil personalization
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
