/**
 * PageHead — tiny wrapper around react-helmet-async for per-page meta.
 * Handles title, description, canonical, and Open Graph basics.
 */
import { Helmet } from "react-helmet-async";

interface PageHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
}

const DEFAULT_DESCRIPTION =
  "Luxury personalized stationery designed to be treasured. Watercolor notecards, monogram gifts, and custom stationery sets crafted with care.";

export function PageHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image,
  noindex = false,
}: PageHeadProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
