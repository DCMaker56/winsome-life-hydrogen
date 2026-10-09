#!/usr/bin/env node
/*
 * The Winsome Life — illustration generation runner.
 *
 * Reads taxonomy.json, expands every (niche → subject) × (style), calls the
 * Recraft API with the locked style prompt + universal suffix, and saves the
 * result to generated/{niche}/{subject-slug}-{style}.{png|svg}. Writes a
 * manifest.json for the curation page.
 *
 * Usage:
 *   node illustrations/generate.mjs                 # all pilot niches
 *   node illustrations/generate.mjs --niche=sports  # one niche
 *   node illustrations/generate.mjs --all           # every niche
 *   node illustrations/generate.mjs --niche=sports --limit=1   # 1 subject (smoke test)
 *
 * Resumes automatically — already-saved files are skipped.
 * Key comes from RECRAFT_API_KEY in the repo .env (gitignored).
 */
import {readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(__dirname, 'generated');
const RECRAFT_URL = 'https://external.api.recraft.ai/v1/images/generations';
const CONCURRENCY = 4;

// ── key ──────────────────────────────────────────────────────────────
function loadKey() {
  if (process.env.RECRAFT_API_KEY) return process.env.RECRAFT_API_KEY;
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^RECRAFT_API_KEY=(.+)$/m);
  if (!m) throw new Error('RECRAFT_API_KEY not found in .env');
  return m[1].trim();
}

// ── style → Recraft params ───────────────────────────────────────────
// Watercolor & Heritage Sketch need raster texture (PNG). Modern Graphic is
// vector-native → true SVG straight into the studio + print pipeline.
const RECRAFT_PARAMS = {
  watercolor: {model: 'recraftv3', style: 'digital_illustration', ext: 'png'},
  'heritage-sketch': {model: 'recraftv3', style: 'digital_illustration', ext: 'png'},
  'modern-graphic': {model: 'recraftv3', style: 'vector_illustration', ext: 'svg'},
};

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

async function generateOne(key, niche, subject, style, universal) {
  const p = RECRAFT_PARAMS[style.key];
  const outDir = join(OUT, niche.key);
  const file = join(outDir, `${slug(subject)}-${style.key}.${p.ext}`);
  const rel = `generated/${niche.key}/${slug(subject)}-${style.key}.${p.ext}`;

  if (existsSync(file)) {
    return {niche: niche.key, subject, style: style.key, file: rel, status: 'skipped'};
  }

  const prompt = `${style.prompt.replace('[SUBJECT]', subject)} ${universal}`;
  mkdirSync(outDir, {recursive: true});

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(RECRAFT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: p.model,
          style: p.style,
          size: '1024x1024',
          n: 1,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 160)}`);
      }
      const json = await res.json();
      const url = json.data?.[0]?.url;
      if (!url) throw new Error('no image url in response');
      const img = await fetch(url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(file, buf);
      return {
        niche: niche.key,
        subject,
        style: style.key,
        file: rel,
        status: 'generated',
        approved: null,
      };
    } catch (err) {
      if (attempt === 3) {
        return {
          niche: niche.key,
          subject,
          style: style.key,
          file: rel,
          status: 'error',
          error: String(err.message ?? err),
        };
      }
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function main() {
  const key = loadKey();
  const tax = JSON.parse(readFileSync(join(__dirname, 'taxonomy.json'), 'utf8'));
  const universal = tax.universalSuffix;

  let niches = tax.niches;
  if (args.niche) niches = niches.filter((n) => n.key === args.niche);
  else if (!args.all) niches = niches.filter((n) => n.pilot);
  if (!niches.length) {
    console.error('No matching niches. Use --niche=<key> or --all.');
    process.exit(1);
  }

  // Build the job list
  const jobs = [];
  for (const niche of niches) {
    const subjects = args.limit
      ? niche.subjects.slice(0, Number(args.limit))
      : niche.subjects;
    for (const subject of subjects) {
      for (const style of tax.styles) {
        jobs.push({niche, subject, style});
      }
    }
  }

  console.log(
    `Generating ${jobs.length} illustrations across ${niches.length} niche(s): ${niches
      .map((n) => n.key)
      .join(', ')}`,
  );

  const results = [];
  let done = 0;
  // Simple concurrency pool
  const queue = [...jobs];
  async function worker() {
    while (queue.length) {
      const {niche, subject, style} = queue.shift();
      const r = await generateOne(key, niche, subject, style, universal);
      results.push(r);
      done++;
      const tag =
        r.status === 'generated' ? '✓' : r.status === 'skipped' ? '·' : '✗';
      console.log(
        `[${String(done).padStart(3)}/${jobs.length}] ${tag} ${r.niche}/${slug(
          subject,
        )}-${style.key}${r.error ? '  ' + r.error : ''}`,
      );
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, worker));

  // Merge into a persistent manifest (so re-runs accumulate)
  const manifestPath = join(OUT, 'manifest.json');
  let manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {items: []};
  const byKey = new Map(manifest.items.map((i) => [i.file, i]));
  for (const r of results) {
    if (r.status === 'error') continue;
    const existing = byKey.get(r.file);
    byKey.set(r.file, {...existing, ...r, approved: existing?.approved ?? r.approved ?? null});
  }
  manifest = {generatedAt: tax.version, items: [...byKey.values()]};
  mkdirSync(OUT, {recursive: true});
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const gen = results.filter((r) => r.status === 'generated').length;
  const skip = results.filter((r) => r.status === 'skipped').length;
  const err = results.filter((r) => r.status === 'error').length;
  console.log(`\nDone. generated ${gen} · skipped ${skip} · errors ${err}`);
  if (err) console.log('Re-run to retry errored items (successful ones are cached).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
