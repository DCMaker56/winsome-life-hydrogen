import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // Single-locale US store — no locale-prefixed routes exist, so we emit no
    // hreflang alternates (avoids Search Console flagging /EN-CA, /FR-CA 404s).
    locales: [],
    getLink: ({type, baseUrl, handle}) => `${baseUrl}/${type}/${handle}`,
  });

  // Partner-only collections (partner-…) stay out of the sitemap.
  const xml = (await response.text()).replace(
    /<url>(?:(?!<\/url>)[\s\S])*\/collections\/partner-(?:(?!<\/url>)[\s\S])*<\/url>/g,
    '',
  );
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);
  return new Response(xml, {status: response.status, headers});
}
