import type {Route} from './+types/$';
import {storefrontRedirect} from '@shopify/hydrogen';

/**
 * Catch-all for any path no route matched. Before 404-ing, we consult Shopify's
 * URL Redirects (Admin → Navigation → URL Redirects, plus the redirects Shopify
 * auto-creates when a product/collection handle changes). This preserves SEO on
 * launch: any URL Google has indexed that has since moved 301s to its new home
 * instead of returning a dead 404.
 */
export async function loader({request, context}: Route.LoaderArgs) {
  const redirectResponse = await storefrontRedirect({
    request,
    storefront: context.storefront,
    // Returned as-is when no matching redirect exists.
    response: new Response(null, {status: 404}),
  });

  // A match yields a 3xx redirect Response — hand it back so the browser follows
  // it. Otherwise throw a 404 so the branded error boundary renders.
  if (redirectResponse.status >= 300 && redirectResponse.status < 400) {
    return redirectResponse;
  }

  throw new Response(`${new URL(request.url).pathname} not found`, {
    status: 404,
  });
}

export default function CatchAllPage() {
  return null;
}
