/*
 * Customer link — /shop/<handle> (Sydney, Nov 2026). The page a partner
 * forwards to their customers: the partner's collection at full price (no
 * discount), no "Edit my selection", and no link to the partner's Store
 * link. The cart is marked "Partner referral: <name>" so the order shows up
 * on the partner's earnings page. Same page as /partners/<handle>.
 */
import type {Route} from './+types/shop.$handle';
import {partnerPageLoader} from '~/lib/partner-page.server';

export {meta, default} from './partners.$handle';

export async function loader(args: Route.LoaderArgs) {
  return partnerPageLoader(args, true);
}
