#!/usr/bin/env python3
"""
Populate the Winsome Studio master taxonomy DB with fully-detailed records
for every item in the Florals batch idea list — Honeybee-sample standard.

Reads:  Florals Batch 11 (idea list)  +  master taxonomy DB (schema + style rules)
Writes: a copy of the master DB with the Master Icon Library populated.
One row per floral item, Watercolor style (matches the Honeybee sample).
"""
import openpyxl, re

BATCH = "/Users/daniel/Documents/7.11.26_Winsome_Asset_Library_Florals_Batch_11_Updated.xlsx"
MASTER = "/Users/danieljcline/Documents/Winsome_Studio_Icon_Taxonomy_Database.xlsx"
OUT = "/Users/daniel/Documents/Winsome_Studio_Icon_Taxonomy_Database_FLORALS_POPULATED.xlsx"

# ── per-flower knowledge: palette, secondary, season, popularity ──────
# (major flowers tailored; everything else falls back to sensible defaults)
FLOWER = {
    "rose": ("Garden Blush / Rose Pink", "sage green; soft cream; deep rose", "Spring; Summer", 10),
    "peony": ("Blush Pink", "soft coral; sage green; cream", "Spring; Summer", 10),
    "hydrangea": ("Soft Blue / Lavender", "periwinkle; sage green; antique white", "Spring; Summer", 10),
    "tulip": ("Soft Rose / Buttercream", "leaf green; blush; warm yellow", "Spring", 8),
    "daffodil": ("Buttercream Yellow", "warm gold; leaf green; ivory", "Spring", 7),
    "magnolia": ("Ivory / Blush", "warm brown branch; sage; soft pink", "Spring", 9),
    "lily": ("Ivory / Soft Pink", "gold stamen; leaf green; blush", "Summer", 8),
    "iris": ("Deep Violet / Blue", "gold falls; sage green; lavender", "Spring", 7),
    "camellia": ("Rose Pink / Ivory", "glossy deep green; blush; cream", "Winter; Spring", 8),
    "gardenia": ("Ivory White", "glossy deep green; cream shadow", "Spring; Summer", 8),
    "cherry blossom": ("Pale Pink", "warm brown branch; soft white; sage", "Spring", 9),
    "lavender": ("Soft Purple", "silver-green foliage; dusty violet", "Summer", 8),
    "sunflower": ("Golden Yellow", "warm brown center; leaf green; amber", "Summer; Fall", 8),
    "ranunculus": ("Blush / Coral", "layered peach; sage green; cream", "Spring", 8),
    "dahlia": ("Warm Coral / Burgundy", "deep green; blush; plum", "Summer; Fall", 8),
    "zinnia": ("Warm Coral / Pink", "leaf green; gold center; magenta", "Summer; Fall", 6),
    "cosmos": ("Soft Pink / White", "feathery green foliage; gold center", "Summer; Fall", 6),
    "anemone": ("White / Soft Blush", "deep navy center; sage green", "Spring", 7),
    "sweet pea": ("Pastel Pink / Lilac", "soft green tendrils; cream; lavender", "Spring; Summer", 6),
    "poppy": ("Coral Red / Blush", "black center; sage green; soft orange", "Summer", 6),
    "delphinium": ("Cornflower Blue", "leaf green; white center; violet", "Summer", 6),
    "foxglove": ("Soft Pink / Lavender", "speckled throat; leaf green; cream", "Summer", 6),
    "hollyhock": ("Rose Pink / Cream", "leaf green; deep pink; blush", "Summer", 6),
    "snapdragon": ("Warm Coral / Butter", "leaf green; blush; soft yellow", "Summer", 6),
    "orchid": ("Orchid Pink / Cream", "magenta throat; deep green; ivory", "Year-round", 7),
    "lisianthus": ("Lavender / Cream", "sage green; soft purple; blush", "Summer", 6),
    "hellebore": ("Dusty Rose / Green", "muted plum; sage; cream", "Winter; Spring", 6),
    "dogwood": ("Soft White / Blush", "warm branch; sage green; pink tip", "Spring", 6),
    "wisteria": ("Soft Lavender", "leaf green; violet; pale lilac", "Spring", 7),
    "hibiscus": ("Coral / Blush Pink", "deep green; gold center; magenta", "Summer", 5),
    "bluebell": ("Cornflower Blue / Violet", "leaf green; soft blue", "Spring", 5),
    "lilac": ("Soft Lilac", "leaf green; pale violet; cream", "Spring", 7),
    "hyacinth": ("Soft Blue / Pink", "leaf green; lavender; cream", "Spring", 6),
    "freesia": ("Cream / Soft Yellow", "leaf green; blush; buttercream", "Spring", 5),
    "aster": ("Soft Violet / Pink", "gold center; sage green; lilac", "Fall", 5),
    "chrysanthemum": ("Warm Amber / Rust", "leaf green; gold; burgundy", "Fall", 6),
    "marigold": ("Golden Amber", "warm brown; leaf green; orange", "Summer; Fall", 5),
    "coneflower": ("Rose Pink / Amber", "copper cone; sage green; blush", "Summer", 6),
    "carnation": ("Soft Pink / Cream", "sage green; blush; deep rose", "Year-round", 6),
    "violet": ("Deep Violet", "gold center; leaf green; lavender", "Spring", 6),
    "gladiolus": ("Coral / Cream", "leaf green; blush; soft peach", "Summer", 5),
    "narcissus": ("Cream / Soft Yellow", "warm gold cup; leaf green", "Spring", 6),
    "sweet william": ("Rose / Magenta", "leaf green; blush; deep pink", "Summer", 5),
    "yarrow": ("Soft Cream / Butter", "feathery sage foliage; pale gold", "Summer", 5),
    "salvia": ("Deep Blue-Violet", "silver-green foliage; indigo", "Summer", 5),
    "gladioli": ("Coral / Cream", "leaf green; blush", "Summer", 5),
    "lupine": ("Soft Blue / Lavender", "leaf green; violet; cream", "Spring; Summer", 5),
}
FOLIAGE_PALETTE = ("Soft Botanical Green", "sage; eucalyptus; warm cream", "Year-round", 6)
CONTAINER_PALETTE = ("Antique Cream / Terracotta", "soft blue-white; warm clay; sage", "Year-round", 5)


def clean_theme(t):
    return re.sub(r"\s*(Signature Collection|Collection|Assets)\s*$", "", t).strip()


def slugcode(s, n=5):
    return re.sub(r"[^A-Z0-9]", "", s.upper())[:n] or "X"


def title_flower(theme, name):
    ct = clean_theme(theme)
    # If the theme is a specific flower, prefer it; else use the item name
    return ct if ct and ct.lower() not in (
        "floral basics", "garden arrangements", "foliage & fillers",
        "garden containers", "botanical details", "seasonal garden collections",
        "botanical motifs", "flower containers & vessels", "pollinators & garden life",
        "luxury floral motifs", "english garden scenes", "floral frames & borders",
        "birth month flowers", "luxury floral patterns", "wedding florals",
        "luxury stationery suites", "blue & white garden collection",
        "wildflower collection", "herb garden collection",
        "citrus & orchard botanicals", "holiday botanicals",
        "english rose garden collection", "southern garden collection",
    ) else name


def flower_info(theme, name):
    key = clean_theme(theme).lower()
    if key in FLOWER:
        return FLOWER[key]
    for k in FLOWER:
        if k in key or k in name.lower():
            return FLOWER[k]
    low = (theme + " " + name).lower()
    if any(w in low for w in ("foliage", "leaf", "fern", "greenery", "filler", "eucalyptus", "grass", "herb", "botanical detail")):
        return FOLIAGE_PALETTE
    if any(w in low for w in ("vase", "container", "vessel", "pot", "urn", "basket", "pitcher", "jug")):
        return CONTAINER_PALETTE
    return ("Soft Garden Naturals", "sage green; blush; warm cream", "Spring; Summer", 5)


def variation_from(name):
    n = name.lower()
    for kw, pose in [
        ("wreath", "Circular wreath arrangement"), ("border", "Repeating border"),
        ("frame", "Framing arrangement"), ("bouquet", "Gathered bouquet"),
        ("cluster", "Clustered blooms"), ("single", "Single stem, isolated"),
        ("bud", "Closed bud"), ("stem", "Single stem"), ("spray", "Loose spray"),
        ("arrangement", "Composed arrangement"), ("pattern", "Seamless repeat"),
        ("corner", "Corner accent"), ("vine", "Trailing vine"),
    ]:
        if kw in n:
            return pose
    return "Single subject, isolated"


def complexity_from(name):
    n = name.lower()
    if any(w in n for w in ("arrangement", "bouquet", "wreath", "scene", "suite", "pattern", "cluster", "collection")):
        return "Detailed"
    if any(w in n for w in ("bud", "leaf", "stem", "single", "tag", "sprig")):
        return "Simple"
    return "Moderate"


# ── load style rules from the master DB ───────────────────────────────
mwb = openpyxl.load_workbook(MASTER)
styles = mwb["Illustration Styles"]
shdr = [c.value for c in styles[1]]
wc = {}
for r in range(2, styles.max_row + 1):
    if styles.cell(r, 2).value == "WC":
        wc = {shdr[c-1]: styles.cell(r, c).value for c in range(1, len(shdr)+1)}
        break
WC_STYLE_INSTR = wc.get("AI Style Instruction") or (
    "Create an elegant hand-painted watercolor illustration with refined realism, "
    "translucent layered washes, soft feathered edges, subtle paper texture, and "
    "selective crisp detail. Classic, elevated, and suitable for luxury personalized stationery.")
WC_NEG = wc.get("Default Negative Prompt") or (
    "No text, no lettering, no border, no mockup, no watermark, no photographic "
    "background, no harsh black outlines, no clip-art appearance, no duplicated parts.")

ml = mwb["Master Icon Library"]
HDR = [c.value for c in ml[1]]

# ── load the floral idea list ─────────────────────────────────────────
fwb = openpyxl.load_workbook(BATCH, data_only=True)
fl = fwb["Florals"]
items = []
for r in range(2, fl.max_row + 1):
    cat, theme, name = fl.cell(r, 1).value, fl.cell(r, 2).value, fl.cell(r, 3).value
    if name:
        items.append((cat, theme, name))

# theme → stable unique code + family id
theme_code, used = {}, set()
for _, theme, _ in items:
    ct = clean_theme(theme)
    if ct not in theme_code:
        base = slugcode(re.sub(r"[^A-Za-z0-9 ]", "", ct).replace(" ", ""), 5)
        code, i = base, 1
        while code in used:
            i += 1; code = (base[:4] + str(i))
        used.add(code); theme_code[ct] = code

theme_seq = {}

def build_row(cat, theme, name):
    ct = clean_theme(theme)
    tcode = theme_code[ct]
    theme_seq[tcode] = theme_seq.get(tcode, 0) + 1
    seq = theme_seq[tcode]
    subject = title_flower(theme, name)
    icon_id = f"FLR-{tcode}-{seq:03d}"
    fname_base = icon_id.lower()
    prim, sec, season, pop = flower_info(theme, name)
    variation = variation_from(name)
    complexity = complexity_from(name)
    low = (theme + " " + name).lower()
    is_border = any(w in low for w in ("border", "frame", "corner"))
    is_pattern = "pattern" in low or "seamless" in low or "motif" in low
    is_wedding = "wedding" in low
    is_luxury = "luxury" in low or "signature" in low or "suite" in low
    is_holiday = "holiday" in low or "christmas" in low

    # search metadata
    subj_l = subject.lower()
    primary_kw = "; ".join(dict.fromkeys([subj_l, "flower", "floral", "botanical"]))
    related = "; ".join(dict.fromkeys([ct.lower(), "garden", "watercolor", "nature",
                                       "wedding" if is_wedding else "correspondence", "spring"]))
    audience = "Gardener; Nature Lover; " + ("Bride; Wedding Planner" if is_wedding else "Floral Enthusiast")
    occasion = ("Wedding; Bridal Shower; Everyday Correspondence" if is_wedding
                else "Everyday Correspondence; Hostess Gift; Birthday")
    priority = "High" if (is_luxury or is_wedding or pop >= 8) else ("Medium" if pop >= 6 else "Standard")
    featured = "Yes" if (is_luxury or pop >= 8) else "No"

    subj_brief = (f"A botanically recognizable {subj_l} rendered with accurate petal and leaf "
                  f"structure, natural proportions, graceful stems, and refined detail.")
    if is_pattern:
        subj_brief = (f"A refined seamless repeat built from {subj_l} elements with balanced spacing, "
                      f"botanically accurate forms, and elegant negative space.")
    elif is_border:
        subj_brief = (f"An elegant {name.lower()} composed of {subj_l} blooms and foliage arranged to "
                      f"frame content, with balanced density and clean interior space for text.")

    comp = ("Center the subject with generous clean negative space, arranged for placement above a "
            "name or monogram. Keep the full silhouette and any stems or foliage fully visible.")
    if is_border:
        comp = ("Arrange the florals to frame the composition with an open, uncluttered center reserved "
                "for personalization. Keep spacing even and airy.")
    if is_pattern:
        comp = ("Build a balanced seamless tile with even distribution and no cropped focal elements; "
                "ensure it repeats cleanly on all edges.")

    color_instr = (f"Use a soft, natural watercolor palette led by {prim.lower()}, supported by "
                   f"{sec}. Keep tones muted and elegant; avoid neon, oversaturation, or harsh contrast.")

    neg = f"{WC_NEG} No vase or container unless specified. No cropped petals or leaves. No wilted or damaged blooms."

    # clean base name — avoid doubling the flower word (e.g. "Rose Classic Red Rose")
    sl, nl = subject.lower(), name.lower()
    if sl == nl or sl in nl:
        base = name
    elif nl in sl:
        base = subject
    else:
        base = f"{subject} {name}"
    display = f"Watercolor {base}"
    internal = f"{base} – Watercolor"

    vals = {
        "Icon ID": icon_id,
        "Parent Asset Family ID": f"FAM-FLR-{tcode}-001",
        "Product SKU": f"IC-{icon_id}-WC",
        "Version": "V01",
        "Status": "Prompt Ready",
        "Priority": priority,
        "Internal Name": internal,
        "Display Name": display.strip(),
        "Short Customer Description": f"An elegant hand-painted {subj_l} in soft {prim.lower()} tones, "
            f"rendered in our signature watercolor style.",
        "Category": "Florals",
        "Subcategory": ct,
        "Subject": subject,
        "Variation / Pose": variation,
        "Viewpoint": "Front" if not is_border else "Flat / Decorative",
        "Theme / Collection": theme,
        "Audience / Interest": audience,
        "Occasion": occasion,
        "Season": season,
        "Holiday": "Christmas" if is_holiday else "",
        "Illustration Style": "Watercolor",
        "Style Code": "WC",
        "Orientation": "Horizontal" if is_border and "border" in low else "Flexible",
        "Complexity": complexity,
        "Primary Color Family": prim,
        "Secondary Colors": sec,
        "Background": "Transparent",
        "Border / Frame": "Frame" if is_border else "None",
        "Pattern-Ready": "Yes" if (is_pattern or complexity != "Detailed") else "No",
        "Primary Keywords": primary_kw,
        "Synonyms": "; ".join(dict.fromkeys([subj_l, subj_l + "s", "bloom", "blossom"])),
        "Related Search Terms": related,
        "Common Misspellings": "",
        "Search Exclusions": "artificial; plastic; fake",
        "Customer Search Visibility": "Customer Searchable",
        "Search Priority Score": pop,
        "Featured": featured,
        "AI Subject Brief": subj_brief,
        "AI Composition Instruction": comp,
        "AI Style Instruction": WC_STYLE_INSTR,
        "AI Color Instruction": color_instr,
        "AI Negative Prompt": neg,
        "Reference / Art Direction Notes": "Prioritize an elegant silhouette, botanical accuracy, and "
            "delicate watercolor translucency. Test readability at approximately 0.75 inch wide.",
        "Prompt Version": "P-001",
        "Source / Rights Status": "Original AI-assisted asset; documentation pending",
        "Commercial Rights Confirmed": "Pending",
        "Artist / AI Tool": "Recraft (AI-assisted)",
        "Date Requested": "",
        "Date Created": "",
        "Date Approved": "",
        "QA Status": "Not Reviewed",
        "QA Notes": "Confirm botanical accuracy, petal and leaf count, clean isolation, color balance, "
            "small-size readability, and absence of artifacts.",
        "Revision Count": 0,
        "Master File Name": f"{fname_base}-wc-v01-master.png",
        "Master File Location": f"TBD / Winsome Studio / Florals / {ct} / Watercolor",
        "Source File Format": "PNG",
        "Export Formats": "PNG; transparent PNG",
        "Transparent Background File": "TBD",
        "Thumbnail File": "TBD",
        "Print-Test Complete": "No",
        "Compatible Product Codes": "NC-FLAT; NC-FOLD; NP; GT; STK; AT; WT; MUG; TOTE",
        "Compatibility Notes": "Strong all-purpose botanical. For very small products, use a simplified "
            "export with fewer fine details.",
        "Launch Collection": theme,
        "Launch Date": "",
        "Times Ordered": 0,
        "Revenue Generated": "",
        "Last Ordered": "",
        "Retirement Candidate": "No",
        "Internal Notes": "Generated from Florals Batch 11 idea list. Watercolor master; Heritage Sketch "
            "and Modern Graphic variants to follow from the same record.",
    }
    return vals


# ── write records (append after Honeybee at row 2) ────────────────────
start = 3
for i, (cat, theme, name) in enumerate(items):
    row = build_row(cat, theme, name)
    for c, h in enumerate(HDR, 1):
        if h in row:
            ml.cell(start + i, c, row[h])

mwb.save(OUT)
print(f"Wrote {len(items)} floral records → {OUT}")
print(f"Master Icon Library now has {1 + len(items)} icon rows (Honeybee + florals).")
print("\nSample — first floral record:")
first = build_row(*items[0])
for k in ["Icon ID", "Internal Name", "Subject", "Theme / Collection", "Primary Color Family",
          "AI Color Instruction", "Master File Name"]:
    print(f"  {k}: {first[k]}")
