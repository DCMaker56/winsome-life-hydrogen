/**
 * GET /api/matching-sets — every matching set (design name → pieces), for
 * the cart's "Complete the set" suggestion. Read from Shopify's "Matching
 * set" product field; see ~/lib/matching-sets.
 */
import type {Route} from './+types/api.matching-sets';
import {loadMatchingSets} from '~/lib/matching-sets';

export async function loader({context}: Route.LoaderArgs) {
  const sets = await loadMatchingSets(context.storefront as never);
  return Response.json(
    {sets},
    {headers: {'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'}},
  );
}
