"""
Makes smaller copies of the retail-partner photos (name@400.webp, @600, @800,
@1200) so phones and browsers never have to shrink a big photo themselves:
browsers (Safari especially) shrink large photos roughly, which makes thin
lines look wavy or dashed. The page picks the right size automatically
(see ~/components/ResponsiveImg).

Run after adding or replacing a photo in app/assets/retail/:
    python3 scripts/retail-image-sizes.py
Edit photos from the full-quality masters in design/originals/, not from
these files.
"""
import glob, json, os
from PIL import Image

DIR = 'app/assets/retail'
WIDTHS = [400, 600, 800, 1200]
sizes = {}
for old in glob.glob(f'{DIR}/*@*.webp'):
    os.remove(old)
for path in sorted(glob.glob(f'{DIR}/*.webp')):
    name = os.path.basename(path)[:-5]
    im = Image.open(path)
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    sizes[name] = im.width
    for w in WIDTHS:
        if w >= im.width * 0.9:
            continue
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS, reducing_gap=3.0).save(
            f'{DIR}/{name}@{w}.webp', 'WEBP', quality=90, method=6
        )
with open(f'{DIR}/widths.json', 'w') as f:
    json.dump(sizes, f, indent=2, sort_keys=True)
    f.write('\n')
print(json.dumps(sizes))
