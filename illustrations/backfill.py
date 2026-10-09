#!/usr/bin/env python3
"""
One-time backfill — register illustrations that already exist on disk into
library.json so nothing from earlier sessions is stranded.

Registers the watercolor hydrangea/pickleball/mahjong (already cut out) and the
approved honeybee (cuts it out first). Idempotent: re-running just updates.
"""
import os, shutil
import registry as R
import make

GEN = R.GEN

# watercolor set already on disk (style-test/{slug}-wc-cutout.png + -white.png)
WC = [
    ("Hydrangea", "Florals", make.SUBJECTS[0][2], make.SUBJECTS[0][3]),
    ("Pickleball", "Sports", make.SUBJECTS[1][2], make.SUBJECTS[1][3]),
    ("Mahjong",   "Games",   make.SUBJECTS[2][2], make.SUBJECTS[2][3]),
]
for subject, category, phrase, detail in WC:
    base = f"{R.slug(subject)}-wc"
    rec = R.record(category, subject, "watercolor",
                   file=f"style-test/{base}-cutout.png",
                   master=f"style-test/{base}-white.png",
                   prompt=make.wc_prompt(phrase, detail))
    _, action = R.upsert(rec)
    print(f"  {action:8} {rec['id']}")

# honeybee — cut the approved gpt-image-1 master, then register
bee_master_src = os.path.join(GEN, "ANI-INS-BEE/v2/honeybee-gptimage-white-high.png")
bee_master = "style-test/honeybee-wc-white.png"
bee_cut = "style-test/honeybee-wc-cutout.png"
if os.path.exists(bee_master_src):
    shutil.copyfile(bee_master_src, os.path.join(GEN, bee_master))
    with open(bee_master_src, "rb") as fh:
        make.cutout(fh.read()).save(os.path.join(GEN, bee_cut))
    rec = R.record("Animals", "Honeybee", "watercolor", file=bee_cut, master=bee_master,
                   prompt="Approved honeybee sample — see honeybee_gptimage.mjs")
    _, action = R.upsert(rec)
    print(f"  {action:8} {rec['id']}")
else:
    print("  (bee master not found; skipped)")

print(f"\nLibrary now has {len(R.load()['items'])} records.")
