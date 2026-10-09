// Heritage Sketch + Modern Graphic versions of hydrangea, pickleball, mahjong.
// Style cores are the VERBATIM AI Style Instructions from the master DB's
// Illustration Styles tab. gpt-image-1, opaque white (cutout happens after).
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .match(/^OPENAI_API_KEY=(.+)$/m)[1].trim();

// verbatim from spreadsheet Illustration Styles tab
const HS = `Create a sophisticated heritage pen-and-ink illustration with fine varied linework, delicate cross-hatching, subtle stippling, accurate proportions, and an heirloom-quality engraved character. Keep the subject isolated and stationery-ready. Primarily black and white on white, optional restrained single-color accent. Resembles a vintage natural-history engraving. No gray photographic shading, no thick comic outlines, no cartoon styling.`;
const MG = `Create a polished modern graphic illustration with clean shapes, crisp edges, an upscale curated color palette, balanced negative space, and excellent readability at small stationery scale. Flat or gently dimensional color, smooth clean edges, minimal or no outlines. Refined rather than playful or cartoonish. No cheap clip-art look, no excessive gradients, no heavy shadow, no childish cartoon face.`;

const ISO = `The subject is a single isolated element on a pure flat white background, with no cast shadow, no ground shadow, no background scene, no border, and no text.`;

const SUBJECTS = {
  hydrangea: 'a single hydrangea bloom with a few leaves — a full rounded mophead cluster of many small four-petaled florets with two or three leaves',
  pickleball: 'a pickleball paddle at a graceful three-quarter angle with a perforated pickleball resting beside its base',
  mahjong: 'a single upright classic mahjong tile whose face shows the one-bamboo motif (a green bamboo stalk with a small red accent)',
};

const STYLES = {hs: HS, mg: MG};

const outDir = join(new URL('.', import.meta.url).pathname, 'generated/style-test');
mkdirSync(outDir, {recursive: true});

for (const [sk, styleCore] of Object.entries(STYLES)) {
  for (const [subj, phrase] of Object.entries(SUBJECTS)) {
    const prompt = `${styleCore} Subject: ${phrase}. ${ISO}`;
    const t0 = Date.now();
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model: 'gpt-image-1', prompt, size: '1024x1024', quality: 'medium', background: 'opaque', output_format: 'png', n: 1}),
    });
    const j = await res.json();
    if (!res.ok) { console.log(`❌ ${subj}-${sk} → ${res.status} ${JSON.stringify(j.error?.message||j).slice(0,160)}`); continue; }
    writeFileSync(join(outDir, `${subj}-${sk}.png`), Buffer.from(j.data[0].b64_json, 'base64'));
    console.log(`✅ ${subj}-${sk}.png  (${((Date.now()-t0)/1000).toFixed(0)}s)`);
  }
}
console.log('\nDone.');
