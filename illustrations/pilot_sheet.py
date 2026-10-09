#!/usr/bin/env python3
"""Build the pilot review contact sheet (self-contained HTML, images embedded).
Groups the 30 pilot results by subject with the 3 styles side by side, shows
the automated QA chips, and includes the scorecard + go/no-go criteria."""
import base64, glob, json, os, re

GEN = "generated"
report = json.load(open(os.path.join(GEN, "pilot_report.json")))
ok = [r for r in report if r.get("ok")]

def b64(path):
    if path.endswith(".svg"):
        with open(path, "rb") as f:
            return "data:image/svg+xml;base64," + base64.b64encode(f.read()).decode()
    # downscale rasters for the review sheet (full-res masters stay on disk)
    from PIL import Image
    import io
    im = Image.open(path).convert("RGBA")
    im.thumbnail((512, 512), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

# order: pilot list order
ORDER = ["FLR-FLW-ROSE", "FLR-WRE-CHRI", "SPT-GOL-CROS", "ANI-DOG-GOLD",
         "ANI-BRD-CARD", "HOB-FSH-MARL", "TRV-UST-TEXA", "TRV-LMK-EIFF",
         "FDD-DRK-OLDF", "CEL-BBY-BABY"]
groups = {}
for r in ok:
    key = r["icon"].rsplit("-", 1)[0]
    groups.setdefault(key, {})[r["style"]] = r

cards = []
for key in ORDER:
    g = groups.get(key)
    if not g:
        continue
    name = re.sub(r"^(Watercolor|Heritage Sketch|Modern Graphic) ", "",
                  next(iter(g.values()))["subject"])
    cells = []
    for style, label in (("WC", "Watercolor"), ("HS", "Heritage Sketch"), ("MG", "Modern Graphic")):
        r = g.get(style)
        if not r:
            cells.append(f'<div class="cell missing"><div class="lbl">{label}</div><div class="miss">not generated</div></div>')
            continue
        img = b64(os.path.join(GEN, r["file"]))
        if style == "MG":
            qa = f'ink {r.get("ink_purity_final", "—")}% single-ink'
            good = r.get("ink_purity_final", 0) >= 99
        else:
            qa = f'cutout {r.get("transparent_pct", "—")}% clear · {"in frame" if r.get("crop_safe") else "CROPPED"}'
            good = r.get("crop_safe") and (r.get("transparent_pct") or 0) > 30
        chip = "pass" if good else "check"
        cells.append(
            f'<div class="cell"><div class="lbl">{label}</div>'
            f'<div class="imgw"><img src="{img}" alt="{name} {label}"/></div>'
            f'<div class="qa {chip}">{qa}</div></div>')
    cards.append(f'<section class="card"><h2>{name}</h2><div class="row">{"".join(cells)}</div>'
                 f'<div class="score">Sydney / Daniel score: '
                 f'<label><input type="checkbox"/> WC ✓</label>'
                 f'<label><input type="checkbox"/> HS ✓</label>'
                 f'<label><input type="checkbox"/> MG ✓</label>'
                 f'<input class="note" placeholder="notes — what would you change?"/></div></section>')

html = f"""<title>Winsome Pilot 30</title>
<style>
:root{{--gold:#C9A96E;--char:#2D2D2D;--cream:#FAF8F5;--green:#4c7a5d;--warn:#b06a3b}}
body{{margin:0;background:var(--cream);color:var(--char);font-family:-apple-system,'Helvetica Neue',sans-serif;padding:0 0 80px}}
header{{background:#fff;border-bottom:1px solid #e7dfd2;padding:26px 34px;position:sticky;top:0;z-index:5}}
h1{{font-family:Georgia,serif;font-weight:600;font-size:24px;margin:0}}
.sub{{font-size:13px;color:#79746b;margin-top:4px}}
main{{max-width:1080px;margin:0 auto;padding:26px 24px}}
.criteria{{background:#fff;border:1px solid #e7dfd2;padding:18px 22px;margin-bottom:26px;font-size:14px;line-height:1.65}}
.criteria b{{color:var(--char)}}
.card{{background:#fff;border:1px solid #e7dfd2;margin-bottom:22px;padding:18px 20px}}
.card h2{{font-family:Georgia,serif;font-size:19px;font-weight:600;margin:0 0 12px}}
.row{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.cell .lbl{{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#79746b;margin-bottom:6px}}
.imgw{{aspect-ratio:1;background:conic-gradient(#eee 25%,#fff 0 50%,#eee 0 75%,#fff 0) 0 0/18px 18px;border:1px solid #eee;display:flex;align-items:center;justify-content:center;padding:8px}}
.imgw img{{max-width:100%;max-height:100%;object-fit:contain}}
.qa{{font-size:11px;margin-top:6px;font-family:ui-monospace,monospace}}
.qa.pass{{color:var(--green)}} .qa.check{{color:var(--warn)}}
.score{{display:flex;gap:16px;align-items:center;margin-top:12px;font-size:13px;flex-wrap:wrap}}
.score .note{{flex:1;min-width:200px;padding:7px 10px;border:1px solid #e0d8c8;font-size:13px}}
.missing .miss{{padding:40px 10px;text-align:center;color:#b06a3b;font-size:12px;border:1px dashed #ddd}}
@media(max-width:700px){{.row{{grid-template-columns:1fr}}}}
</style>
<header><h1>Pilot — 10 icons × 3 styles</h1>
<div class="sub">Generated straight from the master catalog rows, exactly as the full run would be. Score each style ✓, note anything to change.</div></header>
<main>
<div class="criteria"><b>Pass criteria (per image):</b> instantly recognizable subject · style feels right
(WC = genuinely painted / HS = fine-ink engraving / MG = simple coloring-book outline) · full subject in frame ·
clean isolation, no shadow · readable at ¾-inch (squint test) · MG must be pure black so it can be recolored.<br/>
<b>Go / no-go:</b> ≥ 90% of cells checked → green-light the mass run (fixes applied to stragglers only).
70–90% → tune prompts for the weak categories, re-pilot those. &lt; 70% → we regroup on style scaffolds before committing.</div>
{''.join(cards)}
</main>"""
out = os.path.join(GEN, "pilot_sheet.html")
open(out, "w").write(html)
print(f"sheet → {out}  ({len(cards)} subjects, {len(ok)} images, {os.path.getsize(out)//1024//1024} MB)")
