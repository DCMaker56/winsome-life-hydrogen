/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** Dev Dashboard app credentials (write_metaobjects) — save corporate inquiries. */
    SHOPIFY_ADMIN_CLIENT_ID?: string;
    SHOPIFY_ADMIN_CLIENT_SECRET?: string;
    /** Legacy alternative: a token from an existing admin-created custom app. */
    PRIVATE_ADMIN_API_TOKEN?: string;
  }
}
