#!/usr/bin/env python3
"""Re-cut every raster illustration in the library with the robust matte."""
import os
import registry as R
import make

GEN = R.GEN
lib = R.load()
n = 0
for item in lib["items"]:
    if item["format"] != "png":
        continue
    master = os.path.join(GEN, item["master"])
    if not os.path.exists(master):
        print(f"  missing master: {item['id']}"); continue
    with open(master, "rb") as fh:
        make.cutout(fh.read()).save(os.path.join(GEN, item["file"]))
    n += 1
    print(f"  recut {item['id']}")
print(f"\nRe-cut {n} raster illustrations.")
