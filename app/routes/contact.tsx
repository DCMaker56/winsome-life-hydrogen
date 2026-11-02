/*
 * Contact — a real, branded contact page (replaces the bare Hydrogen
 * /pages/contact skeleton). The form posts to this route's action, which
 * saves each message as a `contact_message` metaobject in Shopify admin
 * (Content → Metaobjects → Contact Message) — no email app opens for the
 * customer. The thank-you only shows once Shopify confirms the save; if it
 * can't be saved, the visitor is asked to email us instead. The direct
 * channels (email, socials, help links) are always one tap away.
 */
import {useEffect, useRef} from 'react';
import type {Route} from './+types/contact';
import {Form, Link, useActionData, useNavigation} from 'react-router';
import {Mail, Clock, MessageCircle, ArrowRight} from 'lucide-react';
import {saveMetaobjectEntry} from '~/lib/corporate-inquiry.server';

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

type ContactResult =
  | {ok: true}
  | {ok: false; error: 'invalid' | 'unavailable'; fieldErrors?: Record<string, string>};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function action({request, context}: Route.ActionArgs) {
  const form = await request.formData();
  // Honeypot: real visitors never see or fill this field.
  if (String(form.get('website') ?? '').trim()) {
    return {ok: true} satisfies ContactResult;
  }
  const str = (k: string, max: number) =>
    String(form.get(k) ?? '').trim().slice(0, max);
  const name = str('name', 200);
  const email = str('email', 254);
  const subject = SUBJECTS.includes(str('subject', 100)) ? str('subject', 100) : '';
  const message = str('message', 5000);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = 'Please share your name.';
  if (!EMAIL_RE.test(email)) fieldErrors.email = 'Please enter a valid email.';
  if (!message) fieldErrors.message = 'Please write a short message.';
  if (Object.keys(fieldErrors).length) {
    return {ok: false, error: 'invalid', fieldErrors} satisfies ContactResult;
  }

  const ok = await saveMetaobjectEntry(context.env, 'contact_message', [
    {key: 'contact_name', value: name},
    {key: 'email', value: email},
    {key: 'subject', value: subject},
    {key: 'message', value: message},
    {key: 'submitted_at', value: new Date().toISOString()},
    {key: 'status', value: 'New'},
  ]);
  return (ok ? {ok: true} : {ok: false, error: 'unavailable'}) satisfies ContactResult;
}

function ContactForm() {
  const result = useActionData<typeof action>() as ContactResult | undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === 'submitting';
  const doneRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const fieldErrors = result && !result.ok ? result.fieldErrors ?? {} : {};

  useEffect(() => {
    if (result?.ok) doneRef.current?.focus();
    else if (result && !result.ok) errorRef.current?.focus();
  }, [result]);

  const inputCls =
    'font-sans w-full px-4 py-3 border border-[#C9A96E]/30 bg-[#FAF8F5] text-[15px] text-[#2D2D2D] focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-1 rounded-sm aria-[invalid=true]:border-[#9E1B32]';
  const labelCls =
    'block font-sans font-medium text-[11px] tracking-[0.14em] uppercase text-[#2D2D2D]/70 mb-1.5';
  const err = (k: string) =>
    fieldErrors[k] ? (
      <p id={`c-${k}-error`} className="mt-1.5 font-sans text-[13px] text-[#9E1B32]">
        {fieldErrors[k]}
      </p>
    ) : null;

  if (result?.ok) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="py-8 text-center focus:outline-none">
        <p
          className="text-[2.4rem] text-[#2D2D2D] leading-none"
          style={{fontFamily: "'Parisian Script', 'Great Vibes', cursive"}}
        >
          Thank you
        </p>
        <h3 className="font-serif text-2xl text-[#2D2D2D] mt-3">
          Your message is on its way to us.
        </h3>
        <p className="font-sans font-light text-[15px] text-[#2D2D2D]/65 leading-relaxed mt-3 max-w-md mx-auto">
          A real person will read it and reply to the email address you gave us.
        </p>
      </div>
    );
  }

  return (
    <Form method="post" preventScrollReset className="space-y-5">
      {result && !result.ok ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="p-4 bg-[#9E1B32]/5 ring-1 ring-[#9E1B32]/25 font-sans text-[14px] leading-relaxed text-[#7A1527] focus:outline-none"
        >
          {result.error === 'invalid' ? (
            'Please check the highlighted fields below.'
          ) : (
            <>
              We couldn&rsquo;t send your message just now. Please try again in
              a moment, or email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
                {SUPPORT_EMAIL}
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
        <div>
          <label htmlFor="c-name" className={labelCls}>
            Name
          </label>
          <input
            id="c-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? 'c-name-error' : undefined}
            className={inputCls}
          />
          {err('name')}
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>
            Email
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'c-email-error' : undefined}
            className={inputCls}
          />
          {err('email')}
        </div>
      </div>

      <div>
        <label htmlFor="c-subject" className={labelCls}>
          How can we help?
        </label>
        <select id="c-subject" name="subject" defaultValue={SUBJECTS[0]} className={inputCls}>
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
          name="message"
          required
          rows={6}
          maxLength={5000}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? 'c-message-error' : undefined}
          placeholder="Tell us a little about what you need — include your order number if it's about an existing order."
          className={`${inputCls} resize-y`}
        />
        {err('message')}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-[#2D2D2D] text-white font-sans font-medium text-sm tracking-[0.15em] uppercase px-10 py-4 hover:bg-[#C9A96E] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-wait"
      >
        {submitting ? 'Sending\u2026' : 'Send Message'}
      </button>

      <p className="font-sans font-light text-[12px] text-[#2D2D2D]/50 leading-relaxed">
        Prefer to write us directly?{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#C9A96E] underline underline-offset-2">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </Form>
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
          <p className="font-sans font-light text-sm text-[#2D2D2D]/65 leading-relaxed mt-4">
            Ordering for your company or your store? Learn about{' '}
            <Link
              to="/pages/corporate-gifting"
              className="text-[#2D2D2D] underline decoration-[#C9A96E] underline-offset-2 hover:text-[#C9A96E]"
            >
              Corporate Gifting
            </Link>{' '}
            or our{' '}
            <Link
              to="/pages/retail-partners"
              className="text-[#2D2D2D] underline decoration-[#C9A96E] underline-offset-2 hover:text-[#C9A96E]"
            >
              Retail Partner Program
            </Link>
            .
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
