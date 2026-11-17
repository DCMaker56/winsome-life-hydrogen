/*
 * /partners/<handle>/earnings — "My earnings" for a partner with a customer
 * link (Sydney, Nov 2026): every order placed through their link, the
 * commission on each, what's been paid and what's owed. Linked from the
 * partner's Store link only. See ~/lib/partner-earnings.server.
 */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/partners.$handle_.earnings';
import {PARTNERS, whiteLabelPartnerFor} from '~/lib/partners';
import {loadPartnerEarnings} from '~/lib/partner-earnings.server';

export const meta: Route.MetaFunction = ({data}) => [
  {title: `My earnings | ${data?.partner.name ?? 'Partner'}`},
  {name: 'robots', content: 'noindex'},
];

export async function loader({context, params}: Route.LoaderArgs) {
  const partner = params.handle ? PARTNERS[params.handle] : undefined;
  if (!partner?.commission) throw new Response(null, {status: 404});
  const earnings = await loadPartnerEarnings(context.env, partner).catch((e) => {
    console.error('Partner earnings failed', e);
    return null;
  });
  return {
    partner: {handle: partner.handle, name: partner.name, commission: partner.commission},
    earnings,
    whiteLabelPartner: whiteLabelPartnerFor(partner.handle),
  };
}

const money = (n: number) =>
  n.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});

export default function PartnerEarnings() {
  const {partner, earnings} = useLoaderData<typeof loader>();
  const since = day(`${partner.commission.since}T12:00:00Z`);
  return (
    <main id="main" className="bg-[#FAF8F5] min-h-screen pb-20">
      <section className="container max-w-4xl mx-auto px-5 lg:px-8 pt-10">
        <Link
          to={`/partners/${partner.handle}`}
          className="font-sans text-[13px] text-[#2D2D2D]/65 hover:text-[#2D2D2D]"
        >
          &larr; Back to my page
        </Link>
        <h1 className="mt-4 font-serif font-medium text-3xl md:text-4xl text-[#2D2D2D]">My earnings</h1>
        <p className="mt-2 font-sans text-[15px] text-[#2D2D2D]/75 leading-relaxed">
          You earn {partner.commission.percent}% of every order placed through your customer link
          (product total, not shipping or tax), since {since}. Updated live.
        </p>

        {!earnings ? (
          <p className="mt-10 p-5 bg-white ring-1 ring-[#2D2D2D]/10 font-sans text-[15px] text-[#2D2D2D]">
            Your earnings will appear here shortly. In the meantime, The Winsome Life can send you a
            statement anytime.
          </p>
        ) : (
          <>
            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ['Owed to you', earnings.owed, true],
                ['Paid to you', earnings.paid, false],
                ['Customer sales', earnings.sales, false],
              ].map(([label, value, strong]) => (
                <div
                  key={label as string}
                  className={`p-5 ${strong ? 'bg-[#2D2D2D] text-white' : 'bg-white ring-1 ring-[#2D2D2D]/10 text-[#2D2D2D]'}`}
                >
                  <dt className="font-sans font-semibold text-[11px] tracking-[0.18em] uppercase opacity-75">
                    {label as string}
                  </dt>
                  <dd className="mt-1.5 font-serif text-3xl">{money(value as number)}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-12 mb-3 font-serif text-2xl text-[#2D2D2D]">Orders from your link</h2>
            {earnings.orders.length === 0 ? (
              <p className="p-5 bg-white ring-1 ring-[#2D2D2D]/10 font-sans text-[15px] text-[#2D2D2D]/75">
                No orders yet. Share your customer link to get started!
              </p>
            ) : (
              <div className="overflow-x-auto bg-white ring-1 ring-[#2D2D2D]/10">
                <table className="w-full font-sans text-[14px] text-[#2D2D2D]">
                  <thead>
                    <tr className="text-left text-[11px] tracking-[0.15em] uppercase text-[#2D2D2D]/60 border-b border-[#2D2D2D]/10">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold text-right">Products</th>
                      <th className="px-4 py-3 font-semibold text-right">You earn</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.orders.map((o) => (
                      <tr key={o.name} className="border-b border-[#2D2D2D]/5 last:border-0">
                        <td className="px-4 py-3 whitespace-nowrap">{day(o.date)}</td>
                        <td className="px-4 py-3">{o.name}</td>
                        <td className="px-4 py-3 text-right">{money(o.total)}</td>
                        <td className="px-4 py-3 text-right font-medium">{money(o.commission)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                              o.status === 'Paid'
                                ? 'bg-[#1B5E3A]/10 text-[#1B5E3A]'
                                : o.status === 'Owed'
                                  ? 'bg-[#BF5700]/10 text-[#9A4600]'
                                  : 'bg-[#2D2D2D]/5 text-[#2D2D2D]/60'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
