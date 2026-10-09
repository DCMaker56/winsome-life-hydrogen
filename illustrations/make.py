#!/usr/bin/env python3
"""
Production generator for the Illustration Library.

For each (subject, style): compose the locked style prompt with the subject's
detail, generate, cut out (raster styles), and REGISTER into library.json.
This is the auto-save step — nothing we make is ever stranded again.

  Watercolor / Heritage Sketch -> gpt-image-1 (raster PNG) -> rembg cutout
  Modern Graphic               -> Recraft vector_illustration (true SVG)

Usage: python3 make.py            # runs the JOBS below
"""
import json, os, base64, urllib.request, urllib.error, io, time, random
import registry as R
from PIL import Image
from rembg import remove, new_session

HERE = R.HERE
GEN = R.GEN
STYLE_DIR = os.path.join(GEN, "style-test")
os.makedirs(STYLE_DIR, exist_ok=True)


def env(key):
    # Prefer the process env (containers/hosts inject keys this way); fall back
    # to the repo .env for local dev.
    if os.environ.get(key):
        return os.environ[key].strip()
    path = os.path.join(HERE, "..", ".env")
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                if line.startswith(key + "="):
                    return line.split("=", 1)[1].strip()
    raise RuntimeError(f"{key} not set (env or .env)")


# ── style prompt scaffolds (locked) ──────────────────────────────────
# Every prompt ends with this so the subject is never generated cropped —
# gpt-image-1 otherwise sometimes zooms in and clips edges (e.g. a lacrosse
# stick's head). Belt-and-suspenders with the crop-detection in cutout().
FRAME = (" CRITICAL FRAMING: show the ENTIRE subject — every extremity (hands, "
         "fingertips, feet, toes, petals, stems, tips, tails, ears) fully inside "
         "the image. Render it SMALL and centered with a WIDE empty margin on all "
         "four sides, as if zoomed out. Do NOT zoom in, do NOT fill the frame, and "
         "never let any part crop, run off, or touch an edge.")


def wc_prompt(phrase, detail):
    return (f"A hand-painted watercolor illustration of {phrase}. Loose, artistic watercolor: "
            f"soft feathered edges where pigment bleeds gently into cotton paper, translucent layered "
            f"washes with tonal variation, visible delicate brushstrokes, subtle pigment granulation, "
            f"luminous and organic. {detail}. Richly detailed yet clearly painted with real watercolor "
            f"— not a flat vector, not a digital gradient, not a scientific diagram. Muted, elegant palette "
            f"suitable for luxury personalized stationery. ONLY the subject itself — no added props, "
            f"perches, branches, ground, or scenery. The subject is a single isolated element on a "
            f"pure flat white background, with no cast shadow, no ground shadow, no background wash, no "
            f"smudging or pooled pigment at the base, no paint splatter, no droplets, no border, and no "
            f"text. Paint the ENTIRE subject crisply down to its lowest point — never fade, dissolve, "
            f"or cut off the bottom. A clean, elegant stationery icon." + FRAME)


def hs_prompt(phrase, detail):
    return (f"A highly detailed black-and-white pen-and-ink illustration of {phrase} — the same subject and composition as our painted version, rendered as a fine ink sketch. Fine crosshatching, "
            f"stippling, and engraved line work with intricate texture and depth, in the manner of a vintage "
            f"natural-history engraving or 19th-century scientific field-guide plate. Monochrome black ink "
            f"only, absolutely no color. {detail}. ONLY the subject itself — no added props, perches, "
            f"branches, ground, or scenery. A single isolated subject on a pure flat white background, "
            f"with no cast shadow, no ground shadow, no background wash, no border, and no text. A clean, "
            f"refined, heirloom-quality stationery icon." + FRAME)


def mg_prompt(phrase, detail):
    # Per Sydney (2026-08-18, FINAL spec): Modern Graphic = a SIMPLE OUTLINE,
    # like a coloring-book page for a four-year-old. Thick clean black
    # outlines, large open shapes, interiors left WHITE and empty, minimal
    # detail — because the customer recolors these. Same faithful composition
    # as the other styles, radically simplified. Recraft caps prompts at 1000
    # chars, so stay compact and clip the detail.
    detail = (detail or "")[:220]
    return (f"A very simple outline illustration of {phrase}, like a coloring book page for a "
            f"young child: thick, smooth, uniform black outlines on white, large clean closed "
            f"shapes, interiors left white and empty, only a few essential interior lines. "
            f"{detail}. Keep it extremely simple — no fills, no solid black areas, no shading, "
            f"no grays, no color: pure black line work only. Instantly recognizable, accurate "
            f"simple silhouette, nothing invented; only the subject itself — no props, perches, "
            f"branches, or scenery. Single subject fully in frame with even margins, nothing "
            f"cropped; no shadow, no border, no text.")


def cutout_whitekey(png_bytes, out=1024):
    """Cutout for THIN-LINE subjects (crossed clubs, rods, oars, arrows):
    u2net's mask erodes thin structures, ghosting them out. Key alpha off
    distance from the ACTUAL background color (sampled from the corners —
    gpt-image paper is often warm cream, not pure white), so thin strokes
    survive and the paper tone drops out. Returns (rgba, was_cropped)."""
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    px = im.load(); w, h = im.size
    cs = [px[x, y] for x, y in ((4,4),(w-5,4),(4,h-5),(w-5,h-5),(w//2,4),(w//2,h-5))]
    br = sorted(c[0] for c in cs)[len(cs)//2]
    bg = sorted(c[1] for c in cs)[len(cs)//2]
    bb = sorted(c[2] for c in cs)[len(cs)//2]
    out_im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); op = out_im.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            d = max(abs(r - br), abs(g - bg), abs(b - bb))
            if d < 18: continue
            op[x, y] = (r, g, b, min(255, int(d * 2.2)))
    cropped = edge_touch(out_im)
    return _normalize(out_im), cropped


def cutout_smart(png_bytes):
    """cutout_checked, but fall back to white-key when the u2net mask erodes a
    thin-line subject (mask covers <70% of the ink the white-key finds)."""
    cut, cropped = cutout_checked(png_bytes)
    wk, wk_crop = cutout_whitekey(png_bytes)
    n_mask = sum(1 for a in cut.split()[-1].getdata() if a > 16)
    n_wk = sum(1 for a in wk.split()[-1].getdata() if a > 16)
    if n_wk > 0 and n_mask / n_wk < 0.7:
        return wk, wk_crop
    return cut, cropped


SCAFFOLD = {"watercolor": wc_prompt, "heritage-sketch": hs_prompt, "modern-graphic": mg_prompt}


# ── generation engines ───────────────────────────────────────────────
def _urlopen_retry(req, tries=7, base=5):
    """Open a request, retrying transient rate-limit/server errors with backoff.
    Honors Retry-After when the API sends it (OpenAI/Recraft image endpoints
    have per-minute limits that a concurrent batch trips)."""
    for i in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=180)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 529) and i < tries - 1:
                ra = e.headers.get("Retry-After")
                wait = float(ra) if ra else base * (2 ** i)
                time.sleep(min(wait, 60) + random.uniform(0, 1.5))  # jitter
                continue
            raise


def gen_gptimage(prompt):
    body = json.dumps({"model": "gpt-image-1", "prompt": prompt, "size": "1024x1024",
                       "quality": "medium", "background": "opaque", "output_format": "png", "n": 1}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=body,
                                 headers={"Authorization": f"Bearer {env('OPENAI_API_KEY')}",
                                          "Content-Type": "application/json"})
    with _urlopen_retry(req) as r:
        j = json.load(r)
    return base64.b64decode(j["data"][0]["b64_json"])


def gen_gptimage_edit(image_bytes, prompt, refs=None, size="1024x1024", quality="medium"):
    """gpt-image-1 EDIT: feed an existing illustration + an instruction, get a
    modified version back (keeps composition faithful, unlike regenerating).
    `refs` = optional list of PNG bytes — reference images whose style the edit
    should match. When refs are present the base + refs go in as image[]."""
    refs = refs or []
    boundary = "----winsome" + os.urandom(8).hex()

    def field(name, value):
        return (f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"'
                f'\r\n\r\n{value}\r\n').encode()

    def img(name, fname, data):
        return ((f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; '
                 f'filename="{fname}"\r\nContent-Type: image/png\r\n\r\n').encode()
                + data + b"\r\n")

    parts = [field("model", "gpt-image-1"), field("prompt", prompt),
             field("size", size), field("quality", quality), field("n", "1")]
    if refs:
        parts.append(img("image[]", "base.png", image_bytes))
        for i, rb in enumerate(refs):
            parts.append(img("image[]", f"ref{i}.png", rb))
    else:
        parts.append(img("image", "src.png", image_bytes))
    body = b"".join(parts) + f"--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/images/edits", data=body,
        headers={"Authorization": f"Bearer {env('OPENAI_API_KEY')}",
                 "Content-Type": f"multipart/form-data; boundary={boundary}"})
    with _urlopen_retry(req) as r:
        j = json.load(r)
    return base64.b64decode(j["data"][0]["b64_json"])


import re as _re
def strip_svg_bg(svg_bytes):
    """Recraft vectors include a full-canvas background rect (drawn as the first
    path spanning the whole viewBox). Neutralize its fill to none so the SVG is
    transparent — object only, matching the raster cutouts."""
    svg = svg_bytes.decode("utf-8", "ignore")
    # first path whose d traces the full canvas: M 0 0 L W 0 L W H L 0 H L 0 0 z
    svg = _re.sub(
        r'(<path d="M 0 0 L \d+(?:\.\d+)? 0 L \d+(?:\.\d+)? \d+(?:\.\d+)? L 0 \d+(?:\.\d+)? L 0 0 z" fill=")[^"]*(")',
        r"\1none\2", svg, count=1)
    return svg.encode("utf-8")


def gen_recraft_svg(prompt, substyle="line_art"):
    # substyle line_art = Recraft's native coloring-book outline mode (the MG
    # spec). Falls back to plain vector_illustration if the API rejects it.
    payload = {"prompt": prompt, "model": "recraftv3",
               "style": "vector_illustration", "size": "1024x1024", "n": 1}
    if substyle:
        payload["substyle"] = substyle
    body = json.dumps(payload).encode()
    req = urllib.request.Request("https://external.api.recraft.ai/v1/images/generations", data=body,
                                 headers={"Authorization": f"Bearer {env('RECRAFT_API_KEY')}",
                                          "Content-Type": "application/json"})
    try:
        with _urlopen_retry(req) as r:
            url = json.load(r)["data"][0]["url"]
    except urllib.error.HTTPError as e:
        if substyle and e.code == 400:
            return gen_recraft_svg(prompt, substyle=None)
        raise
    # Recraft CDN needs a browser UA or it 403s
    g = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with _urlopen_retry(g) as r:
        return strip_svg_bg(r.read())


_session = None
def cutout(png_bytes):
    """rembg saliency matte -> transparent PNG (object only, no shadow).

    Mask-based (NOT alpha-matting): isolates the subject regardless of the
    background color, so it works even when a style paints a gray/tinted
    vignette instead of pure white. post_process_mask cleans stray specks.
    """
    global _session
    if _session is None:
        _session = new_session("u2net")
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    cut = remove(img, session=_session, post_process_mask=True)
    return _normalize(cut)


def _rembg_raw(png_bytes):
    """The rembg matte only, WITHOUT recenter/pad — so edge-touching can be
    detected on the true object bounds."""
    global _session
    if _session is None:
        _session = new_session("u2net")
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    return remove(img, session=_session, post_process_mask=True)


def edge_touch(cut, tol=4):
    """True if the object's alpha bounds hit the image border — i.e. the subject
    was generated cropped (running off the frame). No placement fixes this; the
    asset must be regenerated."""
    bbox = cut.split()[-1].getbbox()
    if not bbox:
        return False
    W, H = cut.size
    l, t, r, b = bbox
    return l <= tol or t <= tol or r >= W - tol or b >= H - tol


def _normalize(cut, margin=0.09, out=1024):
    """SAFEGUARD: recenter the object on a square canvas with a uniform margin
    (object ~82% of the canvas). Guarantees every asset is centered and never
    touches its own edge, so placement in the studio preview is predictable and
    never clipped. (Does NOT un-crop an already-cropped subject — see edge_touch.)"""
    bbox = cut.split()[-1].getbbox()
    if not bbox:
        return cut.resize((out, out), Image.LANCZOS)
    obj = cut.crop(bbox)
    ow, oh = obj.size
    side = int(round(max(ow, oh) / (1 - 2 * margin)))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(obj, ((side - ow) // 2, (side - oh) // 2), obj)
    return canvas.resize((out, out), Image.LANCZOS)


def cutout_checked(png_bytes):
    """Cutout + crop flag: returns (normalized transparent PNG, was_cropped)."""
    raw = _rembg_raw(png_bytes)
    return _normalize(raw), edge_touch(raw)


def cutout_thin(png_bytes):
    """Cutout for THIN-STRUCTURE subjects (crossed clubs, oars, stems): rembg's
    saliency mask erodes slender overlapping shapes (the X-crossing washed out
    on crossed golf clubs). Union the rembg alpha with a white-key alpha — any
    non-white pigment on the clean white master survives — then normalize.
    Returns (normalized cut, was_cropped)."""
    raw = _rembg_raw(png_bytes)
    src = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    if src.size != raw.size:
        src = src.resize(raw.size, Image.LANCZOS)
    rp, sp = raw.load(), src.load()
    w, h = raw.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = sp[x, y]
            d = 255 - min(r, g, b)          # distance from pure white
            aw = 0 if d < 14 else min(255, d * 4)
            if aw > rp[x, y][3]:
                rp[x, y] = (r, g, b, aw)
    return _normalize(raw), edge_touch(raw)


def pad_canvas(image_bytes, margin=0.24):
    """Center the image on a larger WHITE canvas so the subject already has wide
    empty margin. Feeding this to an edit stops gpt-image-1 from zooming in and
    clipping extremities — it works within the roomy frame it's given."""
    im = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    w, h = im.size
    side = int(round(max(w, h) * (1 + 2 * margin)))
    canvas = Image.new("RGBA", (side, side), (255, 255, 255, 255))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    out = io.BytesIO()
    canvas.convert("RGB").save(out, "PNG")
    return out.getvalue()


def edit_with_retry(base_bytes, prompt, refs=None, tries=3):
    """Edit an illustration, guaranteeing (best-effort) nothing is cut off:
    pad the source for margin, then regenerate up to `tries` times if the result
    still touches an edge. Returns (raw_png, normalized_png, cropped)."""
    src = pad_canvas(base_bytes)
    result = None
    for _ in range(tries):
        raw = gen_gptimage_edit(src, prompt + FRAME, refs=refs)
        norm, cropped = cutout_checked(raw)
        result = (raw, norm, cropped)
        if not cropped:
            break
    return result


# ── one icon end-to-end ──────────────────────────────────────────────
def make(subject, category, style, phrase, detail, complexity="Moderate"):
    prompt = SCAFFOLD[style](phrase, detail)
    code = R.STYLE[style]["code"]
    base = f"{R.slug(subject)}-{code}"
    if style == "modern-graphic":
        svg = gen_recraft_svg(prompt)
        f_svg = f"style-test/{base}.svg"
        with open(os.path.join(GEN, f_svg), "wb") as fh:
            fh.write(svg)
        rec = R.record(category, subject, style, file=f_svg, master=f_svg, prompt=prompt,
                       complexity=complexity)
    else:
        png = gen_gptimage(prompt)
        f_master = f"style-test/{base}-white.png"
        f_cut = f"style-test/{base}-cutout.png"
        with open(os.path.join(GEN, f_master), "wb") as fh:
            fh.write(png)
        cutout(png).save(os.path.join(GEN, f_cut))
        rec = R.record(category, subject, style, file=f_cut, master=f_master, prompt=prompt,
                       complexity=complexity)
    _, action = R.upsert(rec)
    print(f"  {action:8} {rec['id']:26} ({R.STYLE[style]['name']})")


# ── jobs: the 3 sample subjects × the two NOT-yet-made styles ─────────
SUBJECTS = [
    ("Hydrangea", "Florals",
     "a single hydrangea bloom with a few leaves",
     "A full, rounded mophead cluster of many small four-petaled florets in soft periwinkle blue and lavender, with two or three sage-green leaves",
     "Detailed"),
    ("Pickleball", "Sports",
     "a pickleball paddle with a pickleball",
     "A single pickleball paddle at a graceful three-quarter angle with a perforated pickleball resting beside its base; warm-wood paddle with a soft navy edge, honey-yellow ball",
     "Moderate"),
    ("Mahjong", "Games",
     "a single classic mahjong tile",
     "One upright ivory-cream mahjong tile with a green bamboo motif and small red accents on its face, gentle dimensional shading on the tile edges",
     "Moderate"),
]

if __name__ == "__main__":
    for subject, category, phrase, detail, complexity in SUBJECTS:
        for style in ("heritage-sketch", "modern-graphic"):
            try:
                make(subject, category, style, phrase, detail, complexity)
            except urllib.error.HTTPError as e:
                print(f"  FAIL     {subject}/{style}: {e.code} {e.read()[:160]}")
            except Exception as e:
                print(f"  FAIL     {subject}/{style}: {e}")
    print("Done.")
