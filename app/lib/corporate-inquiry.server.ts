/*
 * Corporate inquiry storage — saves each Business & Corporate Gifting form
 * submission as a `corporate_inquiry` metaobject entry in Shopify admin
 * (Content → Metaobjects → Corporate Inquiry), where the team can track it via
 * its Status field. Shopify Flow can email the team when a new entry is
 * created.
 *
 * Needs an Admin API access token (custom app with `write_metaobjects`) in the
 * storefront's environment variables as PRIVATE_ADMIN_API_TOKEN. Without it,
 * saving fails loudly and the form tells the visitor to email us instead. It
 * never shows a false success.
 */

import {
  INTEREST_OPTIONS,
  QUANTITY_OPTIONS,
  type InquiryFields,
  type InquiryResult,
} from './corporate-inquiry';

const ADMIN_API_VERSION = '2025-10';

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

const CREATE_INQUIRY = `
  mutation CreateCorporateInquiry($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id }
      userErrors { field message }
    }
  }
`;

export async function saveInquiry(
  env: Env,
  fields: InquiryFields,
): Promise<InquiryResult> {
  const token = env.PRIVATE_ADMIN_API_TOKEN;
  const shop = env.PUBLIC_STORE_DOMAIN;
  if (!token || !shop) {
    console.error('Corporate inquiry not saved: PRIVATE_ADMIN_API_TOKEN is not configured.');
    return {ok: false, error: 'unavailable'};
  }

  const metaobjectFields = [
    {key: 'company', value: fields.company},
    {key: 'contact_name', value: fields.name},
    {key: 'email', value: fields.email},
    {key: 'interests', value: JSON.stringify(fields.interests)},
    {key: 'quantity', value: fields.quantity},
    {key: 'project', value: fields.project},
    {key: 'submitted_at', value: new Date().toISOString()},
    {key: 'status', value: 'New'},
  ].filter((f) => f.value !== '');

  try {
    const res = await fetch(
      `https://${shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify({
          query: CREATE_INQUIRY,
          variables: {
            metaobject: {type: 'corporate_inquiry', fields: metaobjectFields},
          },
        }),
      },
    );
    if (!res.ok) {
      console.error('Corporate inquiry not saved: Admin API HTTP', res.status);
      return {ok: false, error: 'unavailable'};
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
        'Corporate inquiry not saved:',
        JSON.stringify(result?.userErrors ?? json.errors),
      );
      return {ok: false, error: 'unavailable'};
    }
    return {ok: true};
  } catch (err) {
    console.error('Corporate inquiry not saved:', err);
    return {ok: false, error: 'unavailable'};
  }
}
