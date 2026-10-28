/*
 * Retail partner inquiries — saves each Retail Partner Program form
 * submission as a `retail_partner_inquiry` metaobject in Shopify admin
 * (Content → Metaobjects → Retail Partner Inquiry), using the same admin
 * connection as the corporate inquiry form.
 */
import {saveMetaobjectEntry} from './corporate-inquiry.server';
import {
  STORE_TYPES,
  type RetailInquiryFields,
  type RetailInquiryResult,
} from './retail-inquiry';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRetailInquiry(form: FormData):
  | {fields: RetailInquiryFields}
  | {fieldErrors: Partial<Record<keyof RetailInquiryFields, string>>} {
  const str = (k: string, max: number) =>
    String(form.get(k) ?? '').trim().slice(0, max);
  const storeType = str('storeType', 100);

  const fields: RetailInquiryFields = {
    name: str('name', 200),
    email: str('email', 254),
    store: str('store', 200),
    location: str('location', 200),
    phone: str('phone', 40),
    website: str('website', 300),
    storeType: (STORE_TYPES as readonly string[]).includes(storeType) ? storeType : '',
    message: str('message', 5000),
  };

  const fieldErrors: Partial<Record<keyof RetailInquiryFields, string>> = {};
  if (!fields.name) fieldErrors.name = 'Please share your name.';
  if (!EMAIL_RE.test(fields.email)) fieldErrors.email = 'Please enter a valid email.';
  if (!fields.store) fieldErrors.store = 'Please share your store’s name.';
  if (!fields.location) fieldErrors.location = 'Please share your city and state.';

  return Object.keys(fieldErrors).length ? {fieldErrors} : {fields};
}

export async function saveRetailInquiry(
  env: Env,
  f: RetailInquiryFields,
): Promise<RetailInquiryResult> {
  const ok = await saveMetaobjectEntry(env, 'retail_partner_inquiry', [
    {key: 'store_name', value: f.store},
    {key: 'contact_name', value: f.name},
    {key: 'email', value: f.email},
    {key: 'phone', value: f.phone},
    {key: 'location', value: f.location},
    {key: 'website', value: f.website},
    {key: 'store_type', value: f.storeType},
    {key: 'message', value: f.message},
    {key: 'submitted_at', value: new Date().toISOString()},
    {key: 'status', value: 'New'},
  ]);
  return ok ? {ok: true} : {ok: false, error: 'unavailable'};
}
