/*
 * InfiniteProductGrid — branded product grid with auto-load-on-scroll.
 *
 * Wraps Hydrogen's <Pagination> (which accumulates nodes across pages) and
 * adds an IntersectionObserver sentinel that navigates to the next page as it
 * nears the viewport, so the grid grows automatically as the customer scrolls.
 * A real "Load more" link remains as the keyboard / no-JS / reduced-motion
 * fallback.
 *
 * The route's loader must use `getPaginationVariables` and return a products
 * connection whose nodes carry the fields graphqlToAppProduct reads.
 */
import {useEffect, useRef} from 'react';
import {Link, useNavigate} from 'react-router';
import {Pagination} from '@shopify/hydrogen';
import {graphqlToAppProduct, type GraphqlProduct} from '~/lib/shopify-transform';
import {buildSrcSet} from '~/lib/seo';

interface ProductsConnection {
  nodes: GraphqlProduct[];
  pageInfo: {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
}

export function InfiniteProductGrid({
  connection,
}: {
  connection: ProductsConnection;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, NextLink, hasNextPage, nextPageUrl, state, isLoading}) => {
        const products = nodes.map((n) =>
          graphqlToAppProduct(n as GraphqlProduct),
        );
        return (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((p, i) => (
                <li key={p.id}>
                  <Link
                    to={`/products/${p.slug}`}
                    prefetch="intent"
                    className="group block bg-white overflow-hidden"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-[#FAF8F5]">
                      {p.images[0] ? (
                        <img
                          src={p.images[0]}
                          srcSet={buildSrcSet(p.images[0], [300, 400, 600, 800])}
                          sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 100vw"
                          alt={`${p.title} — personalized ${p.type}`}
                          loading={i < 8 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#C9A96E]/5" />
                      )}
                    </div>
                    <div className="p-4">
                      {p.badge && (
                        <span className="inline-block font-sans font-medium text-[9px] tracking-[0.2em] uppercase text-[#C9A96E] mb-1.5">
                          {p.badge}
                        </span>
                      )}
                      <h3 className="font-serif font-medium text-base text-[#2D2D2D] leading-tight mb-1 group-hover:text-[#C9A96E] transition-colors line-clamp-2 min-h-[2.6rem]">
                        {p.title}
                      </h3>
                      <p className="font-sans text-sm text-[#2D2D2D]/65">
                        From ${p.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auto-load sentinel — fires before the customer hits the end */}
            <AutoLoad
              hasNextPage={hasNextPage}
              nextPageUrl={nextPageUrl}
              state={state}
              isLoading={isLoading}
            />

            {/* Visible status + fallback link */}
            <div className="mt-12 flex flex-col items-center gap-3" aria-live="polite">
              {hasNextPage ? (
                <NextLink className="font-sans font-medium inline-flex items-center justify-center px-10 py-3.5 border border-[#C9A96E] text-[#C9A96E] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A96E] hover:text-white transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#C9A96E] focus-visible:outline-offset-2">
                  {isLoading ? 'Loading…' : 'Load more'}
                </NextLink>
              ) : (
                products.length > 0 && (
                  <p className="font-sans font-light text-xs tracking-[0.15em] uppercase text-[#2D2D2D]/35">
                    You&rsquo;ve reached the end
                  </p>
                )
              )}
            </div>
          </>
        );
      }}
    </Pagination>
  );
}

function AutoLoad({
  hasNextPage,
  nextPageUrl,
  state,
  isLoading,
}: {
  hasNextPage: boolean;
  nextPageUrl: string;
  state: unknown;
  isLoading: boolean;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  // Re-arm the trigger each time a new page URL is available.
  const lock = useRef(false);
  useEffect(() => {
    lock.current = false;
  }, [nextPageUrl]);

  useEffect(() => {
    if (!hasNextPage) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && !lock.current) {
          lock.current = true;
          navigate(nextPageUrl, {
            replace: true,
            preventScrollReset: true,
            state,
          });
        }
      },
      {rootMargin: '800px 0px'},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, nextPageUrl, isLoading, state, navigate]);

  return <div ref={ref} aria-hidden="true" style={{height: 1}} />;
}
