#!/usr/bin/env python3
"""
Production cutout step — object only, TRUE transparent background, NO shadow.
Generate-on-white → matte → transparent PNG. Deterministic; kills any shadow
gpt-image-1 paints. Also renders a proof composite on a colored background so
any residual shadow/halo is visible.
"""
from rembg import remove, new_session
from PIL import Image
import sys, os

session = new_session("u2net")

def cut(src, out_transparent, out_proof):
    img = Image.open(src).convert("RGBA")
    # alpha matting → crisp edges, no gray shadow halo bleeding in
    cutout = remove(
        img, session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=250,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=2,
    )
    cutout.save(out_transparent)
    # proof: place on a mid brand-pink swatch so shadows/halos would show
    proof = Image.new("RGBA", cutout.size, (231, 155, 170, 255))  # dusty rose
    proof.paste(cutout, (0, 0), cutout)
    proof.convert("RGB").save(out_proof)
    # report how much is transparent (sanity)
    alpha = cutout.split()[-1]
    px = list(alpha.getdata())
    clear = sum(1 for a in px if a < 8)
    print(f"  {os.path.basename(src)} → {os.path.basename(out_transparent)} "
          f"({100*clear/len(px):.0f}% transparent bg)")

jobs = [
    ("generated/style-test/hydrangea-wc.png",  "generated/style-test/hydrangea-wc-cutout.png",  "generated/style-test/hydrangea-wc-PROOF.png"),
    ("generated/style-test/pickleball-wc.png", "generated/style-test/pickleball-wc-cutout.png", "generated/style-test/pickleball-wc-PROOF.png"),
    ("generated/style-test/mahjong-wc.png",    "generated/style-test/mahjong-wc-cutout.png",    "generated/style-test/mahjong-wc-PROOF.png"),
]
for src, t, p in jobs:
    cut(src, t, p)
print("Done — transparent cutouts + colored proofs written.")
