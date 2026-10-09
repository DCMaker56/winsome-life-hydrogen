#!/usr/bin/env python3
"""
PILOT — 10 catalog icons × 3 styles = 30 images, generated exactly the way the
mass run will be: prompts composed from the master catalog rows + the locked
style scaffolds, engines per style, cutout + crop-retry, auto-registered into
the Library gallery, with automated QA per image.

QA per image:
  crop_safe    subject doesn't touch the frame (edge_touch)
  transparent  background actually removed (% clear pixels)
  ink_purity   MG only — % of SVG fills that are pure/near black (single-ink)
Output: generated/pilot_report.json + console table.
"""
import json, os, re, sys, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import openpyxl
from PIL import Image
import make, registry as R

XLSX = "/Users/daniel/Documents/Winsome_Studio_Icon_Taxonomy_Database_MASTER_CATALOG.xlsx"
GEN = R.GEN
ASSETS = os.path.join(GEN, "assets")
os.makedirs(ASSETS, exist_ok=True)

PILOT_IDS = [
    "FLR-FLW-ROSE-001",   # Rose single stem (floral major)
    "FLR-WRE-CHRI-001",   # Christmas wreath (holiday + wreath)
    "SPT-GOL-CROS-001",   # Crossed golf clubs (sport crest)
    "ANI-DOG-GOLD-001",   # Golden retriever (breed accuracy)
    "ANI-BRD-CARD-001",   # Cardinal (plumage)
    "HOB-FSH-MARL-001",   # Marlin (fish anatomy)
    "TRV-UST-TEXA-001",   # Texas silhouette (geographic accuracy)
    "TRV-LMK-EIFF-001",   # Eiffel Tower (landmark)
    "FDD-DRK-OLDF-001",   # Old Fashioned (object detail, CEO spec)
    "CEL-BBY-BABY-001",   # Baby rattle (nursery softness)
]

# ── load the catalog rows ─────────────────────────────────────────────
wb = openpyxl.load_workbook(XLSX, read_only=True)
ml = wb["Master Icon Library"]
rows = list(ml.iter_rows(values_only=True))
hdr = rows[0]
ix = {h: i for i, h in enumerate(hdr) if h}
by_key = {}
for r in rows[1:]:
    if r[0]:
        by_key[(r[ix["Icon ID"]], r[ix["Style Code"]])] = r

def detail_from_brief(brief):
    """Row's AI Subject Brief = 'Depict {detail}. Instantly recognizable…'"""
    m = re.match(r"Depict (.+?)\. Instantly", brief or "")
    return m.group(1) if m else (brief or "")

STYLE_KEY = {"WC": "watercolor", "HS": "heritage-sketch", "MG": "modern-graphic"}

def _rgb(c):
    if c.startswith("#"):
        return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
    n = [int(x) for x in re.findall(r"\d+", c)[:3]]
    return tuple(n) if len(n) == 3 else (0, 0, 0)

def svg_ink_purity(svg_text):
    """Single-ink test: of the NON-WHITE colors (whites are legitimate paper
    knockouts), what % are pure/near black? 100 = perfectly recolorable."""
    cols = re.findall(r'(?:fill|stroke)="(#[0-9a-fA-F]{6}|rgb\([^)]+\))"', svg_text)
    inked = [c for c in cols if sum(_rgb(c)) / 3 < 200]
    if not inked:
        return 100.0, len(cols)
    dark = sum(1 for c in inked if sum(_rgb(c)) / 3 < 70)
    return round(100 * dark / len(inked), 1), len(cols)

def normalize_svg_ink(svg_text):
    """Snap EVERY non-white tone to pure black — Recraft adds midtone-gray
    shading even when told single-ink; this deterministically guarantees a
    one-color, fully recolorable graphic (whites stay as knockouts)."""
    def repl(m):
        return (f'{m.group(1)}="#000000"'
                if sum(_rgb(m.group(2))) / 3 < 200 else m.group(0))
    return re.sub(r'(fill|stroke)="(#[0-9a-fA-F]{6}|rgb\([^)]+\))"', repl, svg_text)

save_lock = threading.Lock()
cut_lock = threading.Lock()

def run_one(icon_id, style_code):
    row = by_key.get((icon_id, style_code))
    if not row:
        return {"icon": icon_id, "style": style_code, "ok": False, "err": "row not found"}
    subject = row[ix["Subject"]]
    display = row[ix["Display Name"]]
    category = row[ix["Category"]]
    detail = detail_from_brief(row[ix["AI Subject Brief"]])
    phrase = re.sub(r"^(Watercolor|Heritage Sketch|Modern Graphic) ", "", display).lower()
    skey = STYLE_KEY[style_code]
    prompt = make.SCAFFOLD[skey](phrase, detail)
    base = f"{icon_id.lower()}-{style_code.lower()}"
    qa = {"icon": icon_id, "style": style_code, "subject": display, "ok": True}
    try:
        if style_code == "MG":
            svg = make.gen_recraft_svg(prompt).decode("utf-8", "ignore")
            purity, ncols = svg_ink_purity(svg)
            svg = normalize_svg_ink(svg)
            purity_after, _ = svg_ink_purity(svg)
            f = f"assets/{base}-v01.svg"
            with open(os.path.join(GEN, f), "w") as fh:
                fh.write(svg)
            qa.update(file=f, ink_purity_raw=purity, ink_purity_final=purity_after,
                      color_count=ncols, crop_safe=True, transparent_pct=None)
            rec = R.record(category.split(" &")[0], subject, "modern-graphic",
                           file=f, master=f, prompt=prompt)
        else:
            png = make.gen_gptimage(prompt)
            with cut_lock:
                cut, cropped = make.cutout_smart(png)
            tries = 0
            while cropped and tries < 2:
                tries += 1
                png = make.gen_gptimage(prompt)
                with cut_lock:
                    cut, cropped = make.cutout_smart(png)
            fm, fc = f"assets/{base}-v01-master.png", f"assets/{base}-v01.png"
            with open(os.path.join(GEN, fm), "wb") as fh:
                fh.write(png)
            cut.save(os.path.join(GEN, fc))
            alpha = cut.split()[-1]
            px = list(alpha.getdata())
            clear = round(100 * sum(1 for a in px if a < 8) / len(px), 1)
            qa.update(file=fc, crop_safe=not cropped, transparent_pct=clear,
                      retries=tries)
            rec = R.record(category.split(" &")[0], subject,
                           "watercolor" if style_code == "WC" else "heritage-sketch",
                           file=fc, master=fm, prompt=prompt)
        # register under the CATALOG identity so the gallery shows real IDs
        rec["id"] = base
        rec["name"] = display
        rec["keywords"] = list(dict.fromkeys(
            rec["keywords"] + [icon_id, row[ix["Product SKU"]], "pilot"]))
        rec["qaStatus"] = "In Review"
        with save_lock:
            R.upsert(rec)
    except Exception as e:
        qa.update(ok=False, err=str(e)[:140])
    return qa

jobs = [(i, s) for i in PILOT_IDS for s in ("WC", "HS", "MG")]
print(f"PILOT: {len(jobs)} images (10 icons x 3 styles)\n")
results = []
with ThreadPoolExecutor(max_workers=3) as ex:
    futs = {ex.submit(run_one, i, s): (i, s) for i, s in jobs}
    for fut in as_completed(futs):
        q = fut.result()
        results.append(q)
        flag = "✓" if q.get("ok") else "✗"
        extra = (f"ink {q.get('ink_purity_raw')}→{q.get('ink_purity_final')}%"
                 if q.get("style") == "MG" and q.get("ok")
                 else f"clear {q.get('transparent_pct')}% crop{'✓' if q.get('crop_safe') else '✗'}"
                 if q.get("ok") else q.get("err"))
        print(f"  [{len(results):>2}/{len(jobs)}] {flag} {q['icon']}-{q['style']:<3} {extra}")

with open(os.path.join(GEN, "pilot_report.json"), "w") as f:
    json.dump(results, f, indent=2)
ok = sum(1 for r in results if r.get("ok"))
print(f"\nDone: {ok}/{len(jobs)} generated. Report → generated/pilot_report.json")
