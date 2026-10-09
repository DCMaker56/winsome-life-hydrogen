// Clean ICON: just the bee, pure white background, NO shadow, NO wash.
// Keep the winning painterly watercolor style; kill the ground shadow at
// generation; do NOT run removeBackground (white bg is the deliverable).
import {readFileSync, mkdirSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {join} from 'node:path';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .match(/^RECRAFT_API_KEY=(.+)$/m)[1].trim();

const PROMPT = `A hand-painted watercolor illustration of a single honeybee, three-quarter view with wings raised as if in flight. Loose, artistic botanical watercolor: soft feathered edges where pigment bleeds gently into cotton paper, translucent layered washes with tonal variation, visible delicate brushstrokes, subtle pigment granulation, luminous and organic. Warm honey-gold and amber banded abdomen, soft fuzzy chestnut-brown thorax with fine hairs, delicate translucent veined wings, fine dark legs and antennae. Botanically accurate and richly detailed, clearly painted with real watercolor — NOT a flat vector, NOT a digital gradient, NOT a scientific diagram. The bee is a single isolated subject floating on a completely plain solid white background. Absolutely no cast shadow, no drop shadow, no ground shadow, no surface or ground plane beneath it, no colored background wash, no paint splatter, no splashes, no droplets, no border, no frame, no text. Clean isolated icon on pure white.`;

const outDir = join(new URL('.', import.meta.url).pathname, 'generated/ANI-INS-BEE/v2');
mkdirSync(outDir, {recursive: true});

for (const i of [1, 2]) {
  const res = await fetch('https://external.api.recraft.ai/v1/images/generations', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({prompt: PROMPT, model: 'recraftv3', style: 'digital_illustration', size: '1024x1024', n: 1}),
  });
  const j = await res.json();
  if (!res.ok) { console.log(`❌ ${res.status} ${JSON.stringify(j).slice(0,180)}`); continue; }
  const f = join(outDir, `honeybee-v2-icon-${i}.png`);
  execSync(`curl -s -A "Mozilla/5.0" "${j.data[0].url}" -o "${f}"`);
  console.log(`✅ icon ${i} → generated/ANI-INS-BEE/v2/honeybee-v2-icon-${i}.png`);
}
