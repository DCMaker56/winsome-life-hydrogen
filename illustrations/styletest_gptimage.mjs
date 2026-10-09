// gpt-image-1 cross-subject style consistency test: hydrangea, pickleball, mahjong.
// Same watercolor scaffold + per-subject detail. medium quality, opaque white.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .match(/^OPENAI_API_KEY=(.+)$/m)[1].trim();

const scaffold = (phrase, detail) =>
  `A hand-painted watercolor illustration of ${phrase}. Loose, artistic watercolor: soft feathered edges where pigment bleeds gently into cotton paper, translucent layered washes with tonal variation, visible delicate brushstrokes, subtle pigment granulation, luminous and organic. ${detail}. Richly detailed yet clearly painted with real watercolor — not a flat vector, not a digital gradient, not a scientific diagram. Muted, elegant palette suitable for luxury personalized stationery. The subject is a single isolated element on a pure flat white background, with no cast shadow, no ground shadow, no background wash, no paint splatter, no droplets, no border, and no text. A clean, elegant stationery icon.`;

const SUBJECTS = [
  {slug: 'hydrangea', prompt: scaffold(
    'a single hydrangea bloom with a few leaves',
    'A full, rounded mophead cluster of many small four-petaled florets in soft periwinkle blue and lavender, with two or three soft sage-green leaves; gentle tonal variation and subtle color shifts across the petals')},
  {slug: 'pickleball', prompt: scaffold(
    'a pickleball paddle with a pickleball',
    'A single pickleball paddle at a graceful three-quarter angle with a perforated pickleball resting beside its base; warm natural-wood paddle face with a soft navy edge, muted honey-yellow ball; understated and elegant')},
  {slug: 'mahjong', prompt: scaffold(
    'a single classic mahjong tile',
    'One upright ivory-cream mahjong tile, its face softly hand-painted with a green bamboo motif and small red accents, gentle shading along the tile edges to give it dimension; refined and collectible')},
];

const outDir = join(new URL('.', import.meta.url).pathname, 'generated/style-test');
mkdirSync(outDir, {recursive: true});

for (const s of SUBJECTS) {
  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'gpt-image-1', prompt: s.prompt, size: '1024x1024',
      quality: 'medium', background: 'opaque', output_format: 'png', n: 1,
    }),
  });
  const j = await res.json();
  if (!res.ok) {
    console.log(`❌ ${s.slug.padEnd(11)} → ${res.status} ${JSON.stringify(j.error?.message || j).slice(0, 200)}`);
    continue;
  }
  writeFileSync(join(outDir, `${s.slug}-wc.png`), Buffer.from(j.data[0].b64_json, 'base64'));
  console.log(`✅ ${s.slug.padEnd(11)} → style-test/${s.slug}-wc.png  (${((Date.now()-t0)/1000).toFixed(0)}s)`);
}
console.log('\nDone.');
