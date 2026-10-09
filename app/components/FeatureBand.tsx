/*
 * FeatureBand — a full-width image band with an overlaid heading, subtitle,
 * and CTA. Mirrors the "Elegance in Bloom" / "Seaside Sentiments" /
 * "Monogram Notecards" bands on thewinsomelife.com.
 */
import {Link} from 'react-router';

export interface FeatureBandProps {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  /** Overlay text alignment within the band. */
  align?: 'center' | 'left';
}

export default function FeatureBand({
  title,
  subtitle,
  cta,
  href,
  image,
  align = 'center',
}: FeatureBandProps) {
  const alignCls =
    align === 'left'
      ? 'items-start text-left pl-8 lg:pl-20'
      : 'items-center text-center';
  return (
    <section aria-label={title}>
      <Link
        to={href}
        className="group relative block w-full overflow-hidden h-[380px] md:h-[460px] lg:h-[520px] focus-visible:outline-2 focus-visible:outline-[#C9A96E]"
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
        />
        <span
          className="absolute inset-0"
          style={{
            background:
              align === 'left'
                ? 'linear-gradient(90deg, rgba(38,34,28,0.5) 0%, rgba(38,34,28,0.25) 45%, rgba(38,34,28,0) 75%)'
                : 'linear-gradient(0deg, rgba(38,34,28,0.5) 0%, rgba(38,34,28,0.15) 40%, rgba(38,34,28,0.1) 100%)',
          }}
          aria-hidden
        />
        <span
          className={`absolute inset-0 flex flex-col justify-center gap-4 px-6 ${alignCls}`}
        >
          <span className="max-w-xl">
            <span
              className="block font-serif font-medium text-white text-3xl md:text-4xl lg:text-5xl leading-tight"
              style={{textShadow: '0 2px 18px rgba(0,0,0,0.3)'}}
            >
              {title}
            </span>
            <span className="block font-sans font-light text-white/85 text-sm md:text-base mt-3 mb-6 max-w-md mx-auto">
              {subtitle}
            </span>
            <span className="font-sans font-medium inline-block px-8 py-3 bg-white text-[#2D2D2D] text-[11px] tracking-[0.18em] uppercase group-hover:bg-[#C9A96E] group-hover:text-white transition-colors">
              {cta}
            </span>
          </span>
        </span>
      </Link>
    </section>
  );
}
