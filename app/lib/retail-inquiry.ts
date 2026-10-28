/* Shared (client + server) options and types for the retail partner form. */

export const STORE_TYPES = [
  'Gift boutique',
  'Stationery or paper shop',
  'Home décor or interiors',
  'Bridal or wedding',
  'Baby or children’s boutique',
  'Clothing or accessories boutique',
  'Pharmacy or general store',
  'Something else',
] as const;

export type RetailInquiryFields = {
  name: string;
  email: string;
  store: string;
  location: string;
  phone: string;
  website: string;
  storeType: string;
  message: string;
};

export type RetailInquiryResult =
  | {ok: true}
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<keyof RetailInquiryFields, string>>;
    };
