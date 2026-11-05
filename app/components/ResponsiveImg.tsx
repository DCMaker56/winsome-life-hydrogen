/*
 * <img> for photos in app/assets/ that also offers the smaller copies made
 * automatically at build time (vite/responsive-images.ts), so the browser
 * downloads a photo close to the size it shows. Browsers shrink big photos
 * roughly (thin lines turn wavy or dashed); pre-shrunk copies stay crisp.
 *
 * `sizes` says how wide the photo shows on screen, e.g. "(min-width: 1024px)
 * 400px, 100vw". Use this instead of <img> for any photo from app/assets/.
 */
import type {ImgHTMLAttributes} from 'react';
import srcSets from 'virtual:responsive-images';

export function ResponsiveImg({
  src,
  sizes,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & {src: string; sizes: string}) {
  const srcSet = srcSets[src];
  return <img src={src} srcSet={srcSet} sizes={srcSet ? sizes : undefined} {...rest} />;
}
