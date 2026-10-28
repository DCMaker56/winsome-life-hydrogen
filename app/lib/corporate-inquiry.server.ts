/*
 * Corporate inquiry storage — saves each Business & Corporate Gifting form
 * submission as a `corporate_inquiry` metaobject entry in Shopify admin
 * (Content → Metaobjects → Corporate Inquiry), where the team can track it via
 * its Status field. Shopify Flow can email the team when a new entry is
 * created.
 *
 * Authenticates as a Dev Dashboard app installed on the store (scopes
 * `read_metaobjects`, `write_metaobjects`) using the client credentials grant:
 * the storefront's environment variables hold SHOPIFY_ADMIN_CLIENT_ID and
 * SHOPIFY_ADMIN_CLIENT_SECRET, and we exchange them for a 24-hour Admin API
 * token as needed. A legacy admin-created app token in PRIVATE_ADMIN_API_TOKEN
 * also works. Without either, saving fails loudly and the form tells the
 * visitor to email us instead. It never shows a false success.
 */

import {
  INTEREST_OPTIONS,
  QUANTITY_OPTIONS,
  type InquiryFields,
  type InquiryResult,
} from './corporate-inquiry';

const ADMIN_API_VERSION = '2025-10';
// The Admin API must be called on the store's myshopify.com domain.
const ADMIN_SHOP_DOMAIN = 'caatee-kr.myshopify.com';

// Reused across requests within a worker until shortly before it expires.
let cachedToken: {value: string; expiresAt: number} | null = null;

async function getAdminToken(env: Env): Promise<string | null> {
  if (env.PRIVATE_ADMIN_API_TOKEN) return env.PRIVATE_ADMIN_API_TOKEN;

  const clientId = env.SHOPIFY_ADMIN_CLIENT_ID;
  const clientSecret = env.SHOPIFY_ADMIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      'Inquiry not saved: SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET are not configured.',
    );
    return null;
  }
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const res = await fetch(`https://${ADMIN_SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    console.error('Inquiry not saved: token request failed, HTTP', res.status);
    return null;
  }
  const json = (await res.json()) as {access_token?: string; expires_in?: number};
  if (!json.access_token) {
    console.error('Inquiry not saved: token response had no access_token.');
    return null;
  }
  // Refresh five minutes early; fall back to one hour if no expiry is given.
  const ttlMs = ((json.expires_in ?? 3600) - 300) * 1000;
  cachedToken = {value: json.access_token, expiresAt: Date.now() + ttlMs};
  return json.access_token;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInquiry(form: FormData):
  | {fields: InquiryFields}
  | {fieldErrors: Partial<Record<keyof InquiryFields, string>>} {
  const str = (k: string, max: number) =>
    String(form.get(k) ?? '').trim().slice(0, max);

  const fields: InquiryFields = {
    name: str('name', 200),
    email: str('email', 254),
    company: str('company', 200),
    interests: form
      .getAll('interests')
      .map(String)
      .filter((v) => (INTEREST_OPTIONS as readonly string[]).includes(v)),
    quantity: (QUANTITY_OPTIONS as readonly string[]).includes(str('quantity', 50))
      ? str('quantity', 50)
      : '',
    project: str('project', 5000),
  };

  const fieldErrors: Partial<Record<keyof InquiryFields, string>> = {};
  if (!fields.name) fieldErrors.name = 'Please share your name.';
  if (!EMAIL_RE.test(fields.email))
    fieldErrors.email = 'Please enter a valid work email.';
  if (!fields.company) fieldErrors.company = 'Please share your company name.';

  return Object.keys(fieldErrors).length ? {fieldErrors} : {fields};
}

const CREATE_METAOBJECT = `
  mutation CreateInquiry($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

/**
 * Saves one metaobject entry of `type` in Shopify admin. Empty values are
 * skipped. Returns true only when Shopify confirms the entry was created.
 * Shared by every inquiry form on the site.
 */
export async function saveMetaobjectEntry(
  env: Env,
  type: string,
  fields: Array<{key: string; value: string}>,
): Promise<boolean> {
  try {
    const token = await getAdminToken(env);
    if (!token) return false;

    const res = await fetch(
      `https://${ADMIN_SHOP_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({
          query: CREATE_METAOBJECT,
          variables: {
            metaobject: {type, fields: fields.filter((f) => f.value !== '')},
          },
        }),
      },
    );
    if (!res.ok) {
      console.error(`${type} not saved: Admin API HTTP`, res.status);
      return false;
    }
    const json = (await res.json()) as {
      data?: {
        metaobjectCreate?: {
          metaobject?: {id: string} | null;
          userErrors?: Array<{field?: string[]; message: string}>;
        };
      };
      errors?: unknown;
    };
    const result = json.data?.metaobjectCreate;
    if (!result?.metaobject?.id) {
      console.error(
        `${type} not saved:`,
        JSON.stringify(result?.userErrors ?? json.errors),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(`${type} not saved:`, err);
    return false;
  }
}

export async function saveInquiry(
  env: Env,
  fields: InquiryFields,
): Promise<InquiryResult> {
  const ok = await saveMetaobjectEntry(env, 'corporate_inquiry', [
    {key: 'company', value: fields.company},
    {key: 'contact_name', value: fields.name},
    {key: 'email', value: fields.email},
    {key: 'interests', value: JSON.stringify(fields.interests)},
    {key: 'quantity', value: fields.quantity},
    {key: 'project', value: fields.project},
    {key: 'submitted_at', value: new Date().toISOString()},
    {key: 'status', value: 'New'},
  ]);
  return ok ? {ok: true} : {ok: false, error: 'unavailable'};
}
