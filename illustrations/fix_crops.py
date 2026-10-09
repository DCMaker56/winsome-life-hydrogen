#!/usr/bin/env python3
"""
Safeguard sweep against cut-off illustrations.

--audit  : list raster assets whose subject touches the frame edge (cropped).
--fix    : regenerate the cropped ones (new FRAME-aware prompt + crop-retry),
           and re-normalize (recenter + margin) every other raster asset so
           nothing sits against its own edge.
"""
import os, sys, json
import registry as R
import make
from PIL import Image

GEN = R.GEN
FIX = "--fix" in sys.argv

jobs = {}
qpath = os.path.join(GEN, "batch_queue.json")
if os.path.exists(qpath):
    for j in json.load(open(qpath)):
        jobs[(j["category"], j["subject"], j["style"])] = j
# also the original sample subjects (not in the batch queue)
for subj, cat, phrase, detail, cx in make.SUBJECTS:
    for style in ("watercolor", "heritage-sketch", "modern-graphic"):
        jobs.setdefault((cat, subj, style),
                        {"subject": subj, "category": cat, "style": style,
                         "phrase": phrase, "detail": detail, "complexity": cx})

lib = R.load()
raster = [i for i in lib["items"] if i["format"] == "png"]
cropped = []
for it in raster:
    p = os.path.join(GEN, it["file"])
    if not os.path.exists(p):
        continue
    if make.edge_touch(Image.open(p).convert("RGBA"), tol=3):
        cropped.append(it)

print(f"{len(cropped)} of {len(raster)} raster assets are cropped (touch the frame):")
for it in cropped:
    has = "job✓" if (it["category"], it["subject"], it["style"]) in jobs else "NO JOB"
    print(f"  {it['id']:32} {it['name']:34} [{has}]")

if not FIX:
    print("\n(audit only — run with --fix to regenerate + normalize)")
    sys.exit(0)

# ── FIX ───────────────────────────────────────────────────────────────
regen = renorm = fail = 0
for it in cropped:
    key = (it["category"], it["subject"], it["style"])
    job = jobs.get(key)
    if not job:
        print(f"  ⚠ no job for {it['id']} — leaving as-is"); continue
    prompt = make.SCAFFOLD[it["style"]](job.get("phrase") or it["subject"], job.get("detail", ""))
    ok = False
    for attempt in range(4):
        try:
            if it["style"] == "modern-graphic":
                break  # svg handled separately
            png = make.gen_gptimage(prompt)
            norm, still_cropped = make.cutout_checked(png)
            if not still_cropped or attempt == 3:
                with open(os.path.join(GEN, it["master"]), "wb") as fh:
                    fh.write(png)
                norm.save(os.path.join(GEN, it["file"]))
                ok = True
                print(f"  ↻ regenerated {it['id']}" + (" (still tight)" if still_cropped else ""))
                break
        except Exception as e:
            print(f"  ✗ {it['id']}: {str(e)[:80]}")
    regen += 1 if ok else 0
    fail += 0 if ok else 1

# re-normalize the NON-cropped raster assets so margins are uniform + safe
for it in raster:
    if it in cropped:
        continue
    mp = os.path.join(GEN, it["master"])
    if not os.path.exists(mp):
        continue
    try:
        with open(mp, "rb") as fh:
            norm = make._normalize(make._rembg_raw(fh.read()))
        norm.save(os.path.join(GEN, it["file"]))
        renorm += 1
    except Exception as e:
        print(f"  ✗ renorm {it['id']}: {str(e)[:60]}")

print(f"\nDone: {regen} regenerated, {fail} failed, {renorm} re-normalized.")
