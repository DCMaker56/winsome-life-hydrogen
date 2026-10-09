// Winning watercolor formula = default digital_illustration + painterly prompt.
// Produce an ISOLATED product version (no bg wash / no ground shadow) + a
// transparent cutout, alongside the artistic-wash version already generated.
import {readFileSync, mkdirSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {join} from 'node:path';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .match(/^RECRAFT_API_KEY=(.+)$/m)[1].trim();

const PROMPT = `A hand-painted watercolor illustration of a single honeybee, three-quarter profile view. Loose, artistic botanical watercolor: soft feathered edges where pigment bleeds gently into cotton paper, translucent layered washes with tonal variation, visible delicate brushstrokes, subtle pigment granulation, luminous and organic. Warm honey-gold and amber banded abdomen, soft fuzzy chestnut-brown thorax with fine hairs, delicate translucent veined wings, fine dark legs and antennae. Botanically accurate and richly detailed, yet clearly painted with real watercolor — NOT a flat vector, NOT a clean digital gradient, NOT a crisp scientific diagram. Muted elegant palette, soft diffused edges, painterly imperfection. The bee is isolated on a pure white background with NO background color wash, NO splatter, NO paint splashes, NO ground shadow. No text, no lettering, no border.`;

const outDir = join(new URL('.', import.meta.url).pathname, 'generated/ANI-INS-BEE/v2');
mkdirSync(outDir, {recursive: true});

const res = await fetch('https://external.api.recraft.ai/v1/images/generations', {
  method: 'POST',
  headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
  body: JSON.stringify({prompt: PROMPT, model: 'recraftv3', style: 'digital_illustration', size: '1024x1024', n: 1}),
});
const j = await res.json();
if (!res.ok) {
  console.log(`❌ ${res.status} ${JSON.stringify(j).slice(0, 200)}`);
  process.exit(1);
}
const master = join(outDir, 'honeybee-v2-isolated-master.png');
execSync(`curl -s -A "Mozilla/5.0" "${j.data[0].url}" -o "${master}"`);
console.log('✅ isolated master → generated/ANI-INS-BEE/v2/honeybee-v2-isolated-master.png');

// transparent cutout via Recraft removeBackground
const fd = new FormData();
fd.append('file', new Blob([readFileSync(master)], {type: 'image/png'}), 'bee.png');
const rb = await fetch('https://external.api.recraft.ai/v1/images/removeBackground', {
  method: 'POST', headers: {Authorization: `Bearer ${key}`}, body: fd,
});
const rj = await rb.json();
if (rb.ok && rj.image?.url) {
  const t = join(outDir, 'honeybee-v2-isolated-transparent.png');
  execSync(`curl -s -A "Mozilla/5.0" "${rj.image.url}" -o "${t}"`);
  console.log('✅ transparent    → generated/ANI-INS-BEE/v2/honeybee-v2-isolated-transparent.png');
} else {
  console.log(`⚠️  removeBackground: ${rb.status} ${JSON.stringify(rj).slice(0, 160)}`);
}
