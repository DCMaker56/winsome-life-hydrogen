/* Shared (client + server) options and types for the corporate inquiry form. */

export const INTEREST_OPTIONS = [
  'Personalized stationery for employees',
  'Corporate or client gifting',
  'A curated company collection',
  'A combination of the above',
] as const;

export const QUANTITY_OPTIONS = [
  '1–10',
  '11–50',
  '51–100',
  '100+',
  'Not sure yet',
] as const;

export type InquiryFields = {
  name: string;
  email: string;
  company: string;
  interests: string[];
  quantity: string;
  project: string;
};

export type InquiryResult =
  | {ok: true}
  | {ok: false; error: string; fieldErrors?: Partial<Record<keyof InquiryFields, string>>};
