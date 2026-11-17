/*
 * Partner earnings (Sydney, Nov 2026): orders placed through a partner's
 * customer link (/shop/<handle>) carry the "Partner referral" attribute. We
 * find them with the Admin API and work out the partner's commission:
 * commission % of the order's product total after refunds and discounts
 * (no shipping or tax).
 *
 * Paid: once The Winsome Life pays the partner for an order, that order gets
 * the tag "partner-paid" in Shopify admin; it then counts as paid, not owed.
 *
 * Needs the website's admin app (Dev Dashboard, "Winsome Website Forms") to
 * have the read_orders scope (and read_all_orders for orders older than 60
 * days). Until then this returns null and the page says so.
 */
import {ADMIN_API_VERSION, ADMIN_SHOP_DOMAIN, getAdminToken} from './corporate-inquiry.server';
import {REFERRAL_ATTRIBUTE, type Partner} from './partners';

export const PAID_TAG = 'partner-paid';

export type EarningsOrder = {
  name: string;
  date: string;
  total: number;
  commission: number;
  status: 'Paid' | 'Owed' | 'Awaiting payment' | 'Cancelled';
};
export type Earnings = {
  orders: EarningsOrder[];
  owed: number;
  paid: number;
  sales: number;
};

const QUERY = `
  query PartnerOrders($q: String!, $after: String) {
    orders(first: 100, after: $after, query: $q, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        createdAt
        cancelledAt
        displayFinancialStatus
        tags
        customAttributes { key value }
        currentSubtotalPriceSet { shopMoney { amount } }
      }
    }
  }
`;

type OrderNode = {
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  displayFinancialStatus: string | null;
  tags: string[];
  customAttributes: {key: string; value: string | null}[];
  currentSubtotalPriceSet: {shopMoney: {amount: string}};
};

const round = (n: number) => Math.round(n * 100) / 100;

export async function loadPartnerEarnings(env: Env, partner: Partner): Promise<Earnings | null> {
  if (!partner.commission) return null;
  const token = await getAdminToken(env);
  if (!token) return null;
  const nodes: OrderNode[] = [];
  let after: string | null = null;
  // Up to 2,000 orders since the partner started; plenty for one partner.
  for (let page = 0; page < 20; page++) {
    const res: Response = await fetch(
      `https://${ADMIN_SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
        body: JSON.stringify({
          query: QUERY,
          variables: {q: `created_at:>=${partner.commission.since}`, after},
        }),
      },
    );
    if (!res.ok) {
      console.error('Partner earnings: Admin API HTTP', res.status);
      return null;
    }
    const json = (await res.json()) as {
      data?: {orders: {pageInfo: {hasNextPage: boolean; endCursor: string | null}; nodes: OrderNode[]}};
      errors?: unknown;
    };
    if (!json.data?.orders) {
      // Usually a missing read_orders scope.
      console.error('Partner earnings: orders not readable', JSON.stringify(json.errors ?? null));
      return null;
    }
    nodes.push(...json.data.orders.nodes);
    if (!json.data.orders.pageInfo.hasNextPage) break;
    after = json.data.orders.pageInfo.endCursor;
  }

  const percent = partner.commission.percent / 100;
  const orders: EarningsOrder[] = nodes
    .filter((o) => o.customAttributes.some((a) => a.key === REFERRAL_ATTRIBUTE && a.value === partner.name))
    .map((o) => {
      const total = Number(o.currentSubtotalPriceSet.shopMoney.amount) || 0;
      const settled = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(o.displayFinancialStatus ?? '');
      const status: EarningsOrder['status'] = o.cancelledAt
        ? 'Cancelled'
        : o.tags.includes(PAID_TAG)
          ? 'Paid'
          : settled
            ? 'Owed'
            : 'Awaiting payment';
      return {
        name: o.name,
        date: o.createdAt,
        total: o.cancelledAt ? 0 : total,
        commission: o.cancelledAt ? 0 : round(total * percent),
        status,
      };
    });
  const sum = (s: EarningsOrder['status']) =>
    round(orders.filter((o) => o.status === s).reduce((t, o) => t + o.commission, 0));
  return {
    orders,
    owed: sum('Owed'),
    paid: sum('Paid'),
    sales: round(orders.reduce((t, o) => t + o.total, 0)),
  };
}
