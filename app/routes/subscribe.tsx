import type {Route} from './+types/subscribe';
import {useState} from 'react';
import {Link} from 'react-router';
import {Mail, Sparkles, PenLine} from 'lucide-react';

export const meta: Route.MetaFunction = () => [
  {title: 'Join the List | The Winsome Life'},
  {
    name: 'description',
    content:
      'Join The Winsome List for first looks at new stationery designs, subscriber-only seasonal inspiration, and a 10% welcome note.',
  },
];

const perks = [
  {
    icon: Mail,
    label: 'First look at new designs',
  },
  {
    icon: Sparkles,
    label: 'Subscriber-only seasonal ideas',
  },
  {
    icon: PenLine,
    label: 'A 10% welcome note',
  },
];

export default function SubscribeRoute() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Wire this up to Shopify customer creation / email marketing
    // consent (customerEmailMarketingConsentUpdate) instead of local state.
    setSubmitted(true);
  }

  return (
    <div className="bg-[#FAF8F5]">
      {/* Hero + signup */}
      <section className="mx-auto max-w-2xl px-6 pt-24 pb-16 text-center sm:pt-32">
        <p className="text-xs font-sans uppercase tracking-[0.3em] text-[#C9A96E]">
          The Winsome List
        </p>

        <h1 className="mt-6 font-serif text-4xl leading-tight text-[#2D2D2D] sm:text-5xl">
          Good things,{' '}
          <span
            className="text-[#C9A96E]"
            style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
          >
            on paper
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md font-sans text-base leading-relaxed text-[#2D2D2D]/70">
          An occasional letter from our studio — new designs before anyone
          else, and a little seasonal inspiration for your desk.
        </p>

        {submitted ? (
          <p
            className="mt-10 font-serif text-xl italic text-[#2D2D2D]"
            role="status"
          >
            You&rsquo;re on the list — welcome.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
              className="h-12 flex-1 border border-[#2D2D2D]/20 bg-white px-4 font-sans text-sm text-[#2D2D2D] placeholder:text-[#2D2D2D]/40 focus:border-[#C9A96E] focus:outline-none"
            />
            <button
              type="submit"
              className="h-12 bg-[#2D2D2D] px-8 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#C9A96E]"
            >
              Join
            </button>
          </form>
        )}

        <p className="mt-4 font-sans text-xs text-[#2D2D2D]/50">
          No noise, no clutter. Unsubscribe anytime.
        </p>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-10 border-y border-[#2D2D2D]/10 py-10 text-center sm:grid-cols-3 sm:gap-6">
          {perks.map(({icon: Icon, label}) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <Icon className="h-5 w-5 text-[#C9A96E]" strokeWidth={1.5} />
              <p className="font-sans text-sm text-[#2D2D2D]/80">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-xl px-6 pb-24 text-center">
        <p className="font-serif text-lg text-[#2D2D2D]/80">
          In the meantime, the paper is waiting.
        </p>
        <Link
          to="/collections/all"
          className="mt-4 inline-block font-sans text-xs uppercase tracking-[0.15em] text-[#2D2D2D] underline decoration-[#C9A96E] underline-offset-4 transition-colors hover:text-[#C9A96E]"
        >
          Browse the collections
        </Link>
      </section>
    </div>
  );
}
