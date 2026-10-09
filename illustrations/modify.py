#!/usr/bin/env python3
"""
Modify an existing illustration with an AI prompt (and an optional reference
image whose style to match). Creates a NEW variation — the original is kept.

Usage: python3 modify.py <illustration_id> <prompt> [reference_image_path]
Prints a single JSON line: {"ok":true,"id":...,"name":...,"file":...} or an error.
"""
import sys, os, io, json
import registry as R
import make
from PIL import Image


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "need id and prompt"})); return
    item_id, prompt = sys.argv[1], sys.argv[2]
    ref_path = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None

    lib = R.load()
    item = next((i for i in lib["items"] if i["id"] == item_id), None)
    if not item:
        print(json.dumps({"ok": False, "error": "illustration not found"})); return
    style = item["style"]
    if style == "modern-graphic":
        print(json.dumps({"ok": False, "error": "Modify supports Watercolor & Heritage Sketch (raster). Modern Graphic is vector — regenerate it instead."})); return

    style_name = R.STYLE[style]["name"]
    base_path = os.path.join(R.GEN, item.get("master") or item["file"])
    if not os.path.exists(base_path):
        print(json.dumps({"ok": False, "error": "base image missing"})); return
    with open(base_path, "rb") as f:
        base = f.read()

    # optional reference image → normalize to PNG bytes
    refs = None
    used_ref = False
    if ref_path and os.path.exists(ref_path):
        buf = io.BytesIO()
        Image.open(ref_path).convert("RGBA").save(buf, "PNG")
        refs = [buf.getvalue()]
        used_ref = True

    if used_ref:
        full = (f"Restyle the FIRST image (a {style_name} illustration of {item['subject']}) "
                f"to match the visual style, palette, and treatment of the SECOND (reference) image, "
                f"while keeping the same subject. {prompt}. "
                f"Keep the subject fully within the frame, centered with generous margin, on a plain "
                f"white background, no shadow, no text.")
    else:
        full = (f"Modify this {style_name} illustration of {item['subject']} as follows: {prompt}. "
                f"Keep the same {style_name} art style, the subject fully within the frame, centered "
                f"with generous margin, on a plain white background, no shadow, no text.")

    try:
        png, norm, cropped = make.edit_with_retry(base, full, refs=refs)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"generation failed: {str(e)[:160]}"})); return

    n = 1
    while any(i["id"] == f"{item_id}-v{n}" for i in lib["items"]):
        n += 1
    new_id = f"{item_id}-v{n}"
    fm, fc = f"assets/{new_id}-master.png", f"assets/{new_id}.png"
    os.makedirs(os.path.join(R.GEN, "assets"), exist_ok=True)
    with open(os.path.join(R.GEN, fm), "wb") as f:
        f.write(png)
    norm.save(os.path.join(R.GEN, fc))

    rec = R.record(item["category"], item["subject"], style, file=fc, master=fm,
                   prompt=full, complexity=item.get("complexity", "Moderate"))
    rec["id"] = new_id
    rec["name"] = f"{item['subject']} · {style_name} — Variation {n}"
    rec["parentId"] = item_id
    rec["modifyPrompt"] = prompt + (" (+ reference image)" if used_ref else "")
    R.upsert(rec)
    print(json.dumps({"ok": True, "id": new_id, "name": rec["name"], "file": fc, "cropped": cropped}))


if __name__ == "__main__":
    main()
