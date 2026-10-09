// Head-to-head: same honeybee via OpenAI gpt-image-1.
// Testing (a) painterly watercolor quality, (b) prompt adherence for a CLEAN
// icon on white with NO shadow/splatter (the thing Recraft can't do), and
// (c) native transparent background.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .match(/^OPENAI_API_KEY=(.+)$/m)[1].trim();

const PROMPT = `A hand-painted watercolor illustration of a single honeybee, three-quarter view with wings raised. Loose, artistic botanical watercolor: soft feathered edges where pigment bleeds gently into cotton paper, translucent layered washes with tonal variation, visible delicate brushstrokes, subtle pigment granulation, luminous and organic. Warm honey-gold and amber banded abdomen, soft fuzzy chestnut-brown thorax with fine hairs, delicate translucent veined wings, fine dark legs and antennae. Botanically accurate and richly detailed, clearly painted with real watercolor — not a flat vector, not a digital gradient, not a scientific diagram. The bee is a single isolated subject on a pure flat white background, with no cast shadow, no ground shadow, no background wash, no paint splatter, no droplets, no border, and no text. A clean, elegant stationery icon.`;

const outDir = join(new URL('.', import.meta.url).pathname, 'generated/ANI-INS-BEE/v2');
mkdirSync(outDir, {recursive: true});

const RUNS = [
  {tag: 'white-med', quality: 'medium', background: 'opaque'},
  {tag: 'white-high', quality: 'high', background: 'opaque'},
  {tag: 'transparent', quality: 'high', background: 'transparent'},
];

for (const r of RUNS) {
  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: 'gpt-image-1', prompt: PROMPT, size: '1024x1024',
      quality: r.quality, background: r.background, output_format: 'png', n: 1,
    }),
  });
  const j = await res.json();
  if (!res.ok) {
    console.log(`❌ ${r.tag.padEnd(12)} → ${res.status} ${JSON.stringify(j.error?.message || j).slice(0, 220)}`);
    continue;
  }
  const b64 = j.data[0].b64_json;
  const file = join(outDir, `honeybee-gptimage-${r.tag}.png`);
  writeFileSync(file, Buffer.from(b64, 'base64'));
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`✅ ${r.tag.padEnd(12)} → honeybee-gptimage-${r.tag}.png  (${secs}s)`);
}
console.log('\nDone.');
