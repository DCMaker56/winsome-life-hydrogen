/*
 * <img> for the retail-partner photos that also offers the smaller copies
 * made by scripts/retail-image-sizes.py, so the browser downloads a photo
 * close to the size it shows. Browsers shrink big photos roughly (thin lines
 * turn wavy or dashed); pre-shrunk copies stay crisp.
 */
import type {ImgHTMLAttributes} from 'react';
import widths from '~/assets/retail/widths.json';

const files = import.meta.glob<string>('../assets/retail/*.webp', {
  eager: true,
  import: 'default',
});

// Photo URL → "copy@400 400w, …, original 1536w"
const SRCSETS: Record<string, string> = {};
{
  const byName: Record<string, Array<[number, string]>> = {};
  const originals: Record<string, string> = {};
  for (const [path, url] of Object.entries(files)) {
    const m = path.match(/\/([^/@]+)(?:@(\d+))?\.webp$/);
    if (!m) continue;
    if (m[2]) (byName[m[1]] ??= []).push([Number(m[2]), url]);
    else originals[m[1]] = url;
  }
  for (const [name, url] of Object.entries(originals)) {
    const full = (widths as Record<string, number>)[name];
    const list = [...(byName[name] ?? [])].sort((a, b) => a[0] - b[0]);
    if (full) list.push([full, url]);
    if (list.length > 1) SRCSETS[url] = list.map(([w, u]) => `${u} ${w}w`).join(', ');
  }
}

export function ResponsiveImg({
  src,
  sizes,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & {src: string; sizes: string}) {
  const srcSet = SRCSETS[src];
  return <img src={src} srcSet={srcSet} sizes={srcSet ? sizes : undefined} {...rest} />;
}
