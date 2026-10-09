/*
 * Contact — a real, branded contact page (replaces the bare Hydrogen
 * /pages/contact skeleton). No email backend is wired, so the form composes a
 * pre-filled message and opens the customer's email app addressed to
 * info@thewinsomelife.com — genuinely functional, nothing faked. The direct
 * channels (email, socials, help links) are always one tap away.
 */
import {useState} from 'react';
import type {Route} from './+types/contact';
import {Link} from 'react-router';
import {Mail, Clock, MessageCircle, ArrowRight} from 'lucide-react';

const SUPPORT_EMAIL = 'info@thewinsomelife.com';

export const meta: Route.MetaFunction = () => [
  {title: 'Contact Us | The Winsome Life'},
  {
    name: 'description',
    content:
      'Questions about an order, a custom request, or wholesale? Get in touch with The Winsome Life — we usually reply within one business day.',
  },
];

const SOCIALS = [
  {label: 'Instagram', href: 'https://www.instagram.com/thewinsomelifeco/'},
  {label: 'Facebook', href: 'https://www.facebook.com/thewinsomelife/'},
  {label: 'Pinterest', href: 'https://www.pinterest.com/thewinsomelife/'},
  {label: 'Etsy Shop', href: 'https://www.etsy.com/shop/TheWinsomeLifeCo'},
];

const HELP_LINKS = [
  {label: 'Frequently Asked Questions', href: 'https://www.thewinsomelife.com/pages/faq', external: true},
  {label: 'Shipping & Turnaround', href: 'https://www.thewinsomelife.com/policies/shipping-policy', external: true},
  {label: 'Returns & Refunds', href: 'https://www.thewinsomelife.com/policies/refund-policy', external: true},
];

const SUBJECTS = [
  'Question about an order',
  'Custom / personalization request',
  'Wholesale inquiry',
  'Something else',
];

function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: SUBJECTS[0],
    message: '',
  });
  const [opened, setOpened] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({...f, [k]: v}));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `[Winsome Life] ${form.subject}${
      form.name ? ` — ${form.name}` : ''
    }`;
    const body = `${form.message}\n\n— ${form.name}${
      form.email ? `\n${form.email}` : ''
    }`;
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setOpened(true);
  };

  const inputCls =
    'font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-[15px] text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-1 rounded-sm';
  const labelCls =
    'block font-sans font-medium text-[11px] tracking-[0.14em] uppercase text-[#2D2D2D]/70 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="c-name" className={labelCls}>
            Name
          </label>
          <input
            id="c-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-subject" className={labelCls}>
          How can we help?
        </label>
        <select
          id="c-subject"
          value={form.subject}
          onChange={(e) => set('subject', e.target.value)}
          className={inputCls}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="c-message" className={labelCls}>
          Message
        </label>
        <textarea
          id="c-message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Tell us a little about what you need — include your order number if it's about an existing order."
          className={`${inputCls} resize-y`}
        />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto bg-[#2D2D2D] text-white font-sans font-medium text-sm tracking-[0.15em] uppercase px-10 py-4 hover:bg-[#C9A96E] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2"
      >
        Send Message
      </button>

      <p className="font-sans font-light text-[12px] text-[#2D2D2D]/50 leading-relaxed">
        {opened ? (
          <>
            Your email app should have opened with your message ready to send. If
            it didn&rsquo;t, email us directly at{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[#C9A96E] underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        ) : (
          <>
            This opens a pre-filled message in your email app. Prefer to write us
            directly?{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[#C9A96E] underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
          </>
        )}
      </p>
    </form>
  );
}

export default function ContactRoute() {
  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      {/* Header */}
      <section className="container max-w-6xl mx-auto px-4 lg:px-8 pt-8 lg:pt-10">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-wider text-[#2D2D2D]/45 mb-6">
          <Link to="/" className="hover:text-[#C9A96E]">
            Home
          </Link>{' '}
          / <span className="text-[#2D2D2D]/70" aria-current="page">Contact</span>
        </nav>
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
          <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase text-[#C9A96E] mb-3">
            We&rsquo;d Love to Hear From You
          </p>
          <h1 className="font-serif font-medium text-4xl md:text-5xl text-[#2D2D2D] mb-4">
            Get in Touch
          </h1>
          <p className="font-sans font-light text-base text-[#2D2D2D]/65 leading-relaxed">
            Questions about an order, a custom personalization, or wholesale?
            Send a note and a real person will get back to you.
          </p>
        </div>
      </section>

      {/* Form + channels */}
      <section className="container max-w-6xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-10 lg:gap-16 items-start">
          {/* Form */}
          <div className="bg-white ring-1 ring-[#C9A96E]/15 p-6 lg:p-9">
            <h2 className="font-serif text-2xl text-[#2D2D2D] mb-6">
              Send us a message
            </h2>
            <ContactForm />
          </div>

          {/* Direct channels */}
          <aside className="space-y-8">
            <div>
              <h3 className="font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-[#2D2D2D]/60 mb-4">
                Reach us directly
              </h3>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-start gap-3 group"
              >
                <span className="w-9 h-9 shrink-0 rounded-full bg-white ring-1 ring-[#C9A96E]/25 flex items-center justify-center text-[#C9A96E] group-hover:bg-[#C9A96E] group-hover:text-white transition-colors">
                  <Mail size={16} />
                </span>
                <span>
                  <span className="block font-serif text-[17px] text-[#2D2D2D] group-hover:text-[#C9A96E] transition-colors">
                    {SUPPORT_EMAIL}
                  </span>
                  <span className="block font-sans font-light text-[12px] text-[#2D2D2D]/50">
                    Email us anytime
                  </span>
                </span>
              </a>
              <div className="flex items-start gap-3 mt-4">
                <span className="w-9 h-9 shrink-0 rounded-full bg-white ring-1 ring-[#C9A96E]/25 flex items-center justify-center text-[#C9A96E]">
                  <Clock size={16} />
                </span>
                <span>
                  <span className="block font-serif text-[17px] text-[#2D2D2D]">
                    Within 1 business day
                  </span>
                  <span className="block font-sans font-light text-[12px] text-[#2D2D2D]/50">
                    Typical reply time, Mon–Fri
                  </span>
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-[#2D2D2D]/60 mb-4">
                Follow along
              </h3>
              <ul className="space-y-2.5">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm text-[#2D2D2D]/75 hover:text-[#C9A96E] transition-colors inline-flex items-center gap-2"
                    >
                      <span className="text-[#C9A96E]">&#8250;</span>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-[#2D2D2D]/60 mb-4">
                Quick answers
              </h3>
              <ul className="space-y-2.5">
                {HELP_LINKS.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm text-[#2D2D2D]/75 hover:text-[#C9A96E] transition-colors inline-flex items-center gap-1.5 group"
                    >
                      {l.label}
                      <ArrowRight
                        size={13}
                        className="text-[#C9A96E] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white ring-1 ring-[#C9A96E]/15 p-5">
              <p className="font-sans font-light text-[13px] text-[#2D2D2D]/70 leading-relaxed flex items-start gap-2.5">
                <MessageCircle size={16} className="text-[#C9A96E] shrink-0 mt-0.5" />
                <span>
                  Working on a custom or bulk order? Mention the details and
                  quantities and we&rsquo;ll put together a quote.
                </span>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
