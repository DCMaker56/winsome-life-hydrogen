/*
 * Holiday Sale promotion pieces (see ~/lib/holiday-sale): the countdown,
 * the announcement bar, the home-page banner, and the small badge for
 * product pages and the Christmas / Holiday collection.
 */
import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {BLACK_FRIDAY, blackFridayActive, HOLIDAY_SALE, holidaySaleActive, timeLeft} from '~/lib/holiday-sale';

/** Ticks once a second on the client; the server renders the same numbers
 * at request time, so only the seconds can differ on load. */
function useTimeLeft() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return {active: holidaySaleActive(now), blackFriday: blackFridayActive(now), ...timeLeft(now)};
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "5d 04h 12m" (short) for the bar and badges. */
function ShortCountdown() {
  const t = useTimeLeft();
  return (
    <span suppressHydrationWarning className="tabular-nums">
      {t.days > 0 ? `${t.days}d ` : ''}
      {pad(t.hours)}h {pad(t.minutes)}m{t.days === 0 ? ` ${pad(t.seconds)}s` : ''}
    </span>
  );
}

/** Top-of-site bar (replaces the free-shipping line while the sale runs). */
export function HolidaySaleBar() {
  const t = useTimeLeft();
  if (!t.active) return null;
  if (t.blackFriday)
    return (
      <Link
        to={BLACK_FRIDAY.href}
        className="block font-sans bg-[#111111] text-white text-center py-2 px-3 text-[13px] sm:text-sm tracking-wide hover:bg-black transition-colors"
      >
        <span className="font-semibold text-[#E8C98E]">Black Friday:</span> {BLACK_FRIDAY.percent}% off everything
        <span className="hidden sm:inline"> · no code needed</span>
        <span className="mx-1.5 opacity-60" aria-hidden>·</span>
        Ends in <ShortCountdown />
        <span className="ml-2 underline underline-offset-2 decoration-[#E8C98E]/70">Shop now</span>
      </Link>
    );
  return (
    <Link
      to={HOLIDAY_SALE.href}
      className="block font-sans bg-[#7A1F1F] text-white text-center py-2 px-3 text-[13px] sm:text-sm tracking-wide hover:bg-[#661919] transition-colors"
    >
      <span className="font-semibold text-[#F3D9A4]">Holiday Sale:</span> {HOLIDAY_SALE.percent}% off Holiday
      Cards &amp; all Christmas
      <span className="hidden sm:inline"> · applied at checkout</span>
      <span className="mx-1.5 opacity-60" aria-hidden>·</span>
      Ends in <ShortCountdown />
      <span className="hidden md:inline">
        <span className="mx-1.5 opacity-60" aria-hidden>·</span>
        Free shipping over $75
      </span>
      <span className="ml-2 underline underline-offset-2 decoration-[#F3D9A4]/70">Shop now</span>
    </Link>
  );
}

/** Home page banner with a big countdown. */
export function HolidaySaleBanner() {
  const t = useTimeLeft();
  if (!t.active || t.blackFriday) return null;
  const boxes = [
    [t.days, 'Days'],
    [t.hours, 'Hours'],
    [t.minutes, 'Minutes'],
    [t.seconds, 'Seconds'],
  ] as const;
  return (
    <section
      className="relative bg-[#1F3D2E] text-white py-12 md:py-16 overflow-hidden"
      aria-labelledby="holiday-sale-title"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(90deg,#7A1F1F_0_24px,#F3D9A4_24px_30px,#7A1F1F_30px_54px,#1F3D2E_54px_60px)]" />
      <div className="container max-w-5xl mx-auto px-5 text-center">
        <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#F3D9A4]">
          Holiday Sale · Ends Nov 30
        </p>
        <h2 id="holiday-sale-title" className="mt-3 font-serif font-medium text-3xl md:text-[2.75rem] leading-tight">
          <span
            className="inline-block text-[1.35em] leading-none relative top-[0.3em] mr-[0.15em] text-[#F3D9A4]"
            style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
          >
            {HOLIDAY_SALE.percent}% off
          </span>{' '}
          Holiday Cards &amp; all Christmas
        </h2>
        <p className="mt-6 font-sans font-light text-base md:text-[17px] text-white/85 max-w-xl mx-auto leading-relaxed">
          Send your family photo card in time for Christmas, and save on Christmas gift tags, place
          cards, coasters and more. Taken off automatically at checkout, no code needed.
        </p>
        <div className="mt-8 flex justify-center gap-3 md:gap-4" role="timer" aria-label="Time left in the Holiday Sale">
          {boxes.map(([n, label]) => (
            <div key={label} className="w-[68px] md:w-[88px] py-3 bg-white/10 ring-1 ring-[#F3D9A4]/40">
              <p suppressHydrationWarning className="font-serif text-3xl md:text-4xl tabular-nums leading-none">
                {pad(n)}
              </p>
              <p className="mt-1.5 font-sans text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-white/70">
                {label}
              </p>
            </div>
          ))}
        </div>
        <Link
          to={HOLIDAY_SALE.href}
          className="mt-9 inline-flex items-center gap-2 px-9 py-3.5 bg-[#F3D9A4] text-[#1F3D2E] font-sans font-semibold text-[12px] tracking-[0.18em] uppercase hover:bg-white transition-colors"
        >
          Shop Holiday Cards <span aria-hidden>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

/** Product page / collection page: "20% off · ends in …". */
export function HolidaySaleBadge({price, className = ''}: {price?: number; className?: string}) {
  const t = useTimeLeft();
  if (!t.active) return null;
  const sale = price ? price * (1 - HOLIDAY_SALE.percent / 100) : null;
  return (
    <p className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 bg-[#7A1F1F] text-white font-sans text-[13px] ${className}`}>
      <span className="font-semibold tracking-wide">
        {t.blackFriday ? 'Black Friday' : 'Holiday Sale'}: {HOLIDAY_SALE.percent}% off
      </span>
      {sale ? <span>· ${sale.toFixed(2)} at checkout</span> : <span>· applied at checkout</span>}
      <span className="text-[#F3D9A4]">· ends in <ShortCountdown /></span>
    </p>
  );
}

/** Tag on the holiday hero slides: "Holiday Sale · 20% off · ends in …". */
export function HolidaySaleHeroTag({className = ''}: {className?: string}) {
  const t = useTimeLeft();
  if (!t.active) return null;
  return (
    <Link
      to={HOLIDAY_SALE.href}
      className={`wl-sale inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3.5 py-2 bg-[#7A1F1F] ring-1 ring-[#F3D9A4]/80 text-white font-sans text-[12px] md:text-[14px] tracking-wide shadow-md hover:bg-[#661919] transition-colors ${className}`}
    >
      <span className="font-semibold uppercase tracking-[0.12em]">{HOLIDAY_SALE.percent}% off Holiday Cards &amp; Christmas</span>
      <span className="opacity-90">· ends in <ShortCountdown /></span>
    </Link>
  );
}

/** Black Friday home hero: solid black with gold type and a big countdown. */
export function BlackFridayHero({fill = false}: {fill?: boolean} = {}) {
  const t = useTimeLeft();
  if (!t.blackFriday) return null;
  const boxes = [
    [t.days, 'Days'],
    [t.hours, 'Hours'],
    [t.minutes, 'Minutes'],
    [t.seconds, 'Seconds'],
  ] as const;
  return (
    <section
      className={`relative bg-[#111111] text-white overflow-hidden flex items-center ${fill ? 'h-full' : 'min-h-[560px] md:min-h-[640px]'}`}
      aria-labelledby="black-friday-title"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8C98E]/70 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E8C98E]/70 to-transparent" />
      <div className={`container max-w-4xl mx-auto px-5 ${fill ? "pt-6 pb-14 md:py-10" : "py-16"} text-center`}>
        <p className="font-sans font-medium text-xs md:text-sm tracking-[0.4em] uppercase text-[#E8C98E]">
          Black Friday &middot; Cyber Monday
        </p>
        <h2 id="black-friday-title" className={`${fill ? "mt-4 text-[2.6rem]" : "mt-6 text-5xl"} md:mt-6 font-serif font-medium leading-[1.05] md:text-7xl`}>
          {BLACK_FRIDAY.percent}% off{' '}
          <span
            className="block md:inline-block text-[1.15em] leading-none mt-2 md:mt-0 md:relative md:top-[0.12em] text-[#E8C98E]"
            style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
          >
            everything
          </span>
        </h2>
        <p className={`mt-7 font-sans font-light text-base md:text-lg text-white/80 max-w-xl mx-auto leading-relaxed ${fill ? "hidden md:block" : ""}`}>
          Personalized stationery, holiday cards and gifts. Taken off automatically at checkout,
          no code needed. Ends Monday at midnight.
        </p>
        {fill && (
          <p className="md:hidden mt-4 font-sans font-light text-[15px] text-white/80">
            No code needed &middot; Ends Monday at midnight
          </p>
        )}
        <div className={`${fill ? "mt-6" : "mt-9"} md:mt-9 flex justify-center gap-2.5 md:gap-4`} role="timer" aria-label="Time left in the Black Friday sale">
          {boxes.map(([n, label]) => (
            <div key={label} className="w-[64px] md:w-[92px] py-2.5 md:py-3 ring-1 ring-[#E8C98E]/50 bg-white/[0.04]">
              <p suppressHydrationWarning className="font-serif text-3xl md:text-[2.6rem] tabular-nums leading-none">
                {pad(n)}
              </p>
              <p className="mt-1.5 font-sans text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-white/60">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className={`${fill ? "mt-7" : "mt-10"} md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3`}>
          <Link
            to={BLACK_FRIDAY.href}
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#E8C98E] text-[#111111] font-sans font-semibold text-[12px] tracking-[0.2em] uppercase hover:bg-white transition-colors"
          >
            Shop Everything <span aria-hidden>&rarr;</span>
          </Link>
          <Link
            to="/collections/holiday-photo-cards"
            className={`${fill ? "hidden sm:inline-flex" : "inline-flex"} items-center gap-2 px-8 py-4 ring-1 ring-white/50 text-white font-sans font-medium text-[12px] tracking-[0.2em] uppercase hover:ring-white transition-colors`}
          >
            Shop Holiday Cards
          </Link>
        </div>
      </div>
    </section>
  );
}
