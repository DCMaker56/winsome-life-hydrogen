/**
 * JsonLd — renders one or more Schema.org JSON-LD blocks as
 * <script type="application/ld+json"> with the CSP nonce so they aren't
 * blocked by our Content-Security-Policy. Pass a single object or an array.
 */
import {useNonce} from '@shopify/hydrogen';

export function JsonLd({data}: {data: object | object[]}) {
  const nonce = useNonce();
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          nonce={nonce}
          // React omits the nonce value from the SSR'd HTML (anti-leak), so the
          // server/client nonce attribute differs on hydration — harmless for a
          // non-executed data block, so suppress that specific warning.
          suppressHydrationWarning
          // JSON.stringify output is safe here (no user HTML); escape `<` to be safe.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}

export default JsonLd;
