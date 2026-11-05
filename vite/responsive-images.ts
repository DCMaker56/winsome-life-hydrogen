/*
 * Smaller copies of every photo in app/assets/, made automatically whenever
 * the site is built or `npm run dev` starts — nobody has to remember a step.
 *
 * Browsers (Safari especially) shrink big photos roughly, which turns thin
 * lines wavy or dashed. So each photo gets crisp Lanczos-resized copies at
 * 400/600/800/1200 px wide (never wider than the photo itself), and
 * <ResponsiveImg> (~/components/ResponsiveImg) offers them to the browser,
 * which downloads the one closest to the size it shows.
 *
 * Copies are cached in node_modules/.cache/responsive-images (keyed by the
 * photo's contents), so unchanged photos aren't redone.
 */
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type {Plugin} from 'vite';

const WIDTHS = [400, 600, 800, 1200];
const PHOTO = /\.(webp|jpe?g|png)$/i;
const VIRTUAL = 'virtual:responsive-images';

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : PHOTO.test(e.name) ? [p] : [];
  });
}

export function responsiveImages(): Plugin {
  let root = process.cwd();
  let code = 'export default {};';
  let pending: Promise<void> | null = null;

  async function generate() {
    const cache = path.join(root, 'node_modules/.cache/responsive-images');
    mkdirSync(cache, {recursive: true});
    const imports: string[] = [];
    const entries: string[] = [];
    const photos = walk(path.join(root, 'app/assets')).sort();
    for (const [i, file] of photos.entries()) {
      const buf = readFileSync(file);
      const hash = createHash('sha1').update(buf).digest('hex').slice(0, 10);
      const {width} = await sharp(buf).metadata();
      if (!width) continue;
      const name = path.basename(file).replace(PHOTO, '');
      const copies: Array<[number, string]> = [];
      for (const w of WIDTHS) {
        if (w >= width * 0.9) continue;
        const out = path.join(cache, `${name}.${hash}@${w}.webp`);
        if (!existsSync(out)) {
          await sharp(buf)
            .resize({width: w, kernel: 'lanczos3'})
            .webp({quality: 90, effort: 6})
            .toFile(out);
        }
        copies.push([w, out]);
      }
      if (!copies.length) continue;
      imports.push(`import o${i} from ${JSON.stringify(file)};`);
      const parts = copies.map(([w, out], j) => {
        imports.push(`import c${i}_${j} from ${JSON.stringify(out)};`);
        return `c${i}_${j} + " ${w}w"`;
      });
      parts.push(`o${i} + " ${width}w"`);
      entries.push(`[o${i}]: [${parts.join(', ')}].join(", "),`);
    }
    code = `${imports.join('\n')}\nexport default {\n${entries.join('\n')}\n};\n`;
  }

  return {
    name: 'responsive-images',
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      pending ??= generate();
      return pending;
    },
    resolveId(id) {
      if (id === VIRTUAL) return '\0' + VIRTUAL;
    },
    async load(id) {
      if (id !== '\0' + VIRTUAL) return;
      pending ??= generate();
      await pending;
      return code;
    },
  };
}
