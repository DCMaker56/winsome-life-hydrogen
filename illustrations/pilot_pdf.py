#!/usr/bin/env python3
"""Email-shareable PDF of the pilot review — criteria page + each subject with
its three styles side by side (SVGs rasterized via qlmanage)."""
import json, os, re, subprocess, tempfile
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, Image as RLImage, KeepTogether)

GEN = "generated"
OUT = "/Users/daniel/Documents/Winsome_Pilot_Review.pdf"
report = {(r["icon"], r["style"]): r for r in json.load(open(f"{GEN}/pilot_report.json")) if r.get("ok")}

ORDER = [
    ("FLR-FLW-ROSE-001", "Rose — Single Stem"),
    ("FLR-WRE-CHRI-001", "Christmas Wreath"),
    ("SPT-GOL-CROS-001", "Crossed Golf Clubs"),
    ("ANI-DOG-GOLD-001", "Golden Retriever"),
    ("ANI-BRD-CARD-001", "Cardinal"),
    ("HOB-FSH-MARL-001", "Marlin"),
    ("TRV-UST-TEXA-001", "Texas — State Silhouette"),
    ("TRV-LMK-EIFF-001", "Eiffel Tower"),
    ("FDD-DRK-OLDF-001", "Old Fashioned"),
    ("CEL-BBY-BABY-001", "Baby Rattle"),
]
STYLES = [("WC", "Watercolor"), ("HS", "Heritage Sketch"), ("MG", "Modern Graphic")]

tmp = tempfile.mkdtemp()

def flat_png(rel):
    """Return a white-flattened PNG path for any asset (svg → rasterize)."""
    src = os.path.join(GEN, rel)
    if rel.endswith(".svg"):
        subprocess.run(["qlmanage", "-t", "-s", "700", "-o", tmp, src],
                       capture_output=True)
        src = os.path.join(tmp, os.path.basename(src) + ".png")
    im = Image.open(src).convert("RGBA")
    im.thumbnail((700, 700), Image.LANCZOS)
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, (0, 0), im)
    out = os.path.join(tmp, re.sub(r"[^a-z0-9]", "-", rel) + ".flat.png")
    bg.save(out, "PNG")
    return out

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Title"], fontName="Times-Bold",
                    fontSize=24, spaceAfter=4)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], fontSize=10.5,
                     textColor=colors.HexColor("#6b675c"), spaceAfter=14)
CRIT = ParagraphStyle("CRIT", parent=styles["Normal"], fontSize=9.5, leading=14)
SUBJ = ParagraphStyle("SUBJ", parent=styles["Heading2"], fontName="Times-Bold",
                      fontSize=14, spaceBefore=6, spaceAfter=6)
LBL = ParagraphStyle("LBL", parent=styles["Normal"], fontSize=8,
                     textColor=colors.HexColor("#6b675c"), alignment=1)
QA = ParagraphStyle("QA", parent=styles["Normal"], fontSize=7.5,
                    textColor=colors.HexColor("#4c7a5d"), alignment=1)

doc = SimpleDocTemplate(OUT, pagesize=letter, topMargin=0.65 * inch,
                        bottomMargin=0.6 * inch, leftMargin=0.7 * inch,
                        rightMargin=0.7 * inch,
                        title="Winsome Illustration Pilot — Review",
                        author="The Winsome Life")
story = [
    Paragraph("Winsome Illustration Pilot", H1),
    Paragraph("10 subjects × 3 signature styles · generated straight from the master catalog · round 5 — all feedback through the golf-club sample applied", SUB),
    Paragraph("<b>Pass criteria per image:</b> instantly recognizable subject · style feels right "
              "(Watercolor genuinely painted / Heritage Sketch fine-ink engraving / Modern Graphic a simple "
              "coloring-book outline of the same composition) · full subject in frame · clean isolation, no shadow or "
              "props · readable at ¾ inch · Modern Graphic 100% black so it can be recolored.", CRIT),
    Spacer(1, 6),
    Paragraph("<b>Go / no-go:</b> ≥90% of cells pass → green-light the mass run. 70–90% → tune weak categories and "
              "re-pilot those. Below 70% → regroup on style scaffolds before committing.", CRIT),
    Spacer(1, 14),
]

CELL_W = 2.28 * inch
for icon, label in ORDER:
    imgs, labels, qas = [], [], []
    for code, sname in STYLES:
        r = report.get((icon, code))
        if not r:
            continue
        p = flat_png(r["file"])
        imgs.append(RLImage(p, width=CELL_W, height=CELL_W))
        labels.append(Paragraph(sname, LBL))
        if code == "MG":
            qas.append(Paragraph(f"single-ink {r.get('ink_purity_final', 100)}% · recolorable", QA))
        else:
            qas.append(Paragraph(
                f"cutout {r.get('transparent_pct', '—')}% clear · {'in frame' if r.get('crop_safe') else 'cropped'}", QA))
    t = Table([labels, imgs, qas], colWidths=[CELL_W + 6] * len(imgs))
    t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 1), (0, 1), 0.5, colors.HexColor("#e7dfd2")),
        ("BOX", (1, 1), (1, 1), 0.5, colors.HexColor("#e7dfd2")),
        ("BOX", (2, 1), (2, 1), 0.5, colors.HexColor("#e7dfd2")),
        ("TOPPADDING", (0, 0), (-1, 0), 2), ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
        ("TOPPADDING", (0, 2), (-1, 2), 3),
    ]))
    story.append(KeepTogether([Paragraph(label, SUBJ), t, Spacer(1, 12)]))

doc.build(story)
print(f"PDF → {OUT}  ({os.path.getsize(OUT)//1024} KB)")
