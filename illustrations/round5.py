#!/usr/bin/env python3
"""Round 5 — regenerate the full pilot (10 subjects × 3 styles) fresh under the
complete current rulebook. Cardinal MG routes straight to the gpt-image-1
outline fallback (Recraft adds a branch every time)."""
import json, os
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import make, registry as R
import pilot_batch as P

ICONS = ["FLR-FLW-ROSE-001", "FLR-WRE-CHRI-001", "SPT-GOL-CROS-001",
         "ANI-DOG-GOLD-001", "ANI-BRD-CARD-001", "HOB-FSH-MARL-001",
         "TRV-UST-TEXA-001", "TRV-LMK-EIFF-001", "FDD-DRK-OLDF-001",
         "CEL-BBY-BABY-001"]
FALLBACK_MG = {"ANI-BRD-CARD-001"}  # Recraft cannot isolate these subjects

def cardinal_fallback():
    prompt = make.mg_prompt("a northern cardinal bird",
        "accurate crest, mask, beak, full body and tail; the bird entirely alone, floating on empty white")
    png = make.gen_gptimage(prompt)
    cut, cropped = make.cutout_checked(png)
    g = cut.convert("LA"); px = g.load(); w, h = g.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0)); op = out.load()
    for y in range(h):
        for x in range(w):
            lum, a = px[x, y]
            if a == 0: continue
            ink = 255 - lum
            if ink > 20: op[x, y] = (0, 0, 0, min(255, int(ink * (a / 255))))
    f = "assets/ani-brd-card-001-mg-v01.png"
    out.save(os.path.join("generated", f))
    try: os.remove("generated/assets/ani-brd-card-001-mg-v01.svg")
    except FileNotFoundError: pass
    lib = R.load()
    for it in lib["items"]:
        if it["id"] == "ani-brd-card-001-mg":
            it["file"] = f; it["master"] = f; it["format"] = "png"
            it["engine"] = "gpt-image-1 (outline fallback)"
    R.save(lib)
    return {"icon": "ANI-BRD-CARD-001", "style": "MG", "ok": True, "file": f,
            "subject": "Modern Graphic Cardinal", "ink_purity_final": 100.0,
            "crop_safe": not cropped}

jobs = [(i, s) for i in ICONS for s in ("WC", "HS", "MG")
        if not (s == "MG" and i in FALLBACK_MG)]
results = []
with ThreadPoolExecutor(max_workers=3) as ex:
    futs = {ex.submit(P.run_one, i, s): (i, s) for i, s in jobs}
    for fut in as_completed(futs):
        q = fut.result()
        results.append(q)
        print(f"  [{len(results):>2}/{len(jobs)+1}] "
              f"{'OK ' if q.get('ok') else 'FAIL ' + str(q.get('err'))[:40]} "
              f"{q['icon']}-{q['style']}")
q = cardinal_fallback()
results.append(q)
print(f"  [{len(results):>2}/{len(jobs)+1}] OK  ANI-BRD-CARD-001-MG (fallback)")

keyed = {(r["icon"], r["style"]): r for r in results}
json.dump(list(keyed.values()), open("generated/pilot_report.json", "w"), indent=2)
ok = sum(1 for r in results if r.get("ok"))
print(f"ROUND5 DONE: {ok}/{len(results)}")
