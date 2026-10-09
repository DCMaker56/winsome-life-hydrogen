// Regenerate the Honeybee sample — softer, visibly hand-painted watercolor.
// Sydney's note: current bee reads like a vector/scientific diagram. Push real
// watercolor: soft bleeding edges, translucent washes, granulation, brushwork.
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {join} from 'node:path';

const key = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .match(/^RECRAFT_API_KEY=(.+)$/m)[1].trim();

const PROMPT = `A hand-painted watercolor illustration of a single honeybee, flying at a graceful three-quarter angle with wings spread. Loose, artistic botanical watercolor: soft feathered edges where pigment bleeds gently into cotton paper, translucent layered washes with tonal variation, visible delicate brushstrokes, subtle pigment granulation and soft wet-on-wet blooms, luminous and organic. Warm honey-gold and amber banded abdomen, soft fuzzy chestnut-brown thorax, delicate translucent veined wings, fine dark legs and antennae. Botanically accurate and richly detailed, yet clearly painted with real watercolor — NOT a flat vector, NOT a clean digital gradient, NOT a crisp scientific diagram. Muted elegant palette, soft diffused edges, painterly imperfection, gentle luminosity. Plain white background. No text, no lettering, no border, no drop shadow.`;

// Try several substyles — whichever the API accepts and looks most painterly.
const CONFIGS = [
  {tag: 'hand_drawn', style: 'digital_illustration', substyle: 'hand_drawn'},
  {tag: 'grain', style: 'digital_illustration', substyle: 'grain'},
  {tag: 'watercolor', style: 'digital_illustration', substyle: 'watercolor'},
  {tag: 'plain', style: 'digital_illustration'}, // improved prompt, no substyle
];

const outDir = join(new URL('.', import.meta.url).pathname, 'generated/ANI-INS-BEE/v2');
mkdirSync(outDir, {recursive: true});

for (const c of CONFIGS) {
  const body = {prompt: PROMPT, model: 'recraftv3', style: c.style, size: '1024x1024', n: 1};
  if (c.substyle) body.substyle = c.substyle;
  try {
    const res = await fetch('https://external.api.recraft.ai/v1/images/generations', {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) {
      console.log(`❌ ${c.tag.padEnd(12)} → ${res.status} ${JSON.stringify(j).slice(0, 160)}`);
      continue;
    }
    const url = j.data[0].url;
    const file = join(outDir, `honeybee-v2-${c.tag}.png`);
    execSync(`curl -s -A "Mozilla/5.0" "${url}" -o "${file}"`);
    console.log(`✅ ${c.tag.padEnd(12)} → generated/ANI-INS-BEE/v2/honeybee-v2-${c.tag}.png`);
  } catch (e) {
    console.log(`❌ ${c.tag.padEnd(12)} → ${e.message}`);
  }
}
console.log('\nDone.');
