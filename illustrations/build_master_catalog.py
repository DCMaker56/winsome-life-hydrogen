#!/usr/bin/env python3
"""
Expand the curated catalog (catalog_data.py) into the Winsome Studio taxonomy
workbook — one row per icon × style, all 69 columns, Honeybee conventions:

  Icon ID   CAT-SUB-SUBJ-SEQ   (permanent; seq = variation)
  SKU       IC-{IconID}-{WC|HS|MG}
  Internal  Subject – Variation – View – Style
  Filename  {icon id lower}-{style}-v01-master.png

Style rules (per Daniel & Sydney's brief):
  WC watercolor in color · HS black-ink only (colorable later) ·
  MG black & white single-ink vector, BUILT TO BE RECOLORED.
Content policy: nothing political, sexual, or divisive. Religious = Christian
and Jewish motifs only.
"""
import re, openpyxl
from copy import copy
import catalog_data as D

SRC = "/Users/daniel/Downloads/Winsome_Studio_Icon_Taxonomy_Database.xlsx"
OUT = "/Users/daniel/Documents/Winsome_Studio_Icon_Taxonomy_Database_MASTER_CATALOG.xlsx"

CATCODE = {"Animals": "ANI", "Florals & Botanicals": "FLR", "Sports": "SPT",
           "Hobbies & Games": "HOB", "Food & Drink": "FDD", "Travel & Places": "TRV",
           "Professions": "PRO", "Celebrations & Holidays": "CEL",
           "Objects & Motifs": "OBJ"}
STYLES = [
    ("Watercolor", "WC"), ("Heritage Sketch", "HS"), ("Modern Graphic", "MG"),
]

def slug(s):  return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def code(s, n=4):
    c = re.sub(r"[^A-Z0-9]", "", s.upper())[:n]
    return c or "X"

# ── assemble blocks: (category, subcat, subcatCode, theme, audience, occasion,
#     season, holiday, palette, kw, [(subject, variations, detail)]) ──────────
def B(cat, sub, sc, theme, aud, occ, season, holiday, palette, kw, subjects):
    return dict(cat=cat, sub=sub, sc=sc, theme=theme, aud=aud, occ=occ,
                season=season, holiday=holiday, palette=palette, kw=kw,
                subjects=subjects)

EV = "Everyday Correspondence; Hostess Gift; Birthday"
blocks = []

# Florals
blocks.append(B("Florals & Botanicals", "Flowers", "FLW", "Garden Florals",
    "Gardener; Flower Lover", EV, "Spring; Summer", "",
    "soft natural garden tones", ["flower", "floral", "botanical", "garden"],
    [(f, ["Single Stem", "Bouquet"], f"a botanically accurate {f.lower()} with true petal structure and foliage, smooth stems with NO thorns") for f in D.FLOWER_MAJORS]
    + [(f, None, f"a botanically accurate {f.lower()} with true petal structure") for f in D.FLOWER_MINORS]))
blocks.append(B("Florals & Botanicals", "Greenery & Botanicals", "GRN", "Botanical Garden",
    "Gardener; Nature Lover", EV, "Year-Round", "",
    "layered botanical greens", ["greenery", "botanical", "leaves"],
    [(x, None, f"a botanically accurate {x.lower()}") for x in D.BOTANICALS]))
blocks.append(B("Florals & Botanicals", "Wreaths & Garlands", "WRE", "Wreaths",
    "Home Decorator; Hostess", "Everyday Correspondence; Holiday Correspondence", "", "",
    "seasonal botanical tones", ["wreath", "garland", "seasonal"],
    [(n, None, f"a full circular wreath of {d}, evenly balanced with a clear open center") for n, d in D.WREATHS]))

# Sports
for sport, variations, det in D.SPORTS:
    blocks.append(B("Sports", sport, code(sport, 3), f"{sport} Club",
        f"{sport} Player; Sports Fan", "Everyday Correspondence; Coach Gift; Team Gift",
        "Year-Round", "", "classic sporting palette",
        [sport.lower(), "sports", "athletics"],
        [(v, None, det or f"classic {sport.lower()} equipment, accurately proportioned") for v in variations]))

# Animals
blocks.append(B("Animals", "Dogs", "DOG", "Dog Lovers", "Dog Owner; Pet Lover",
    "Everyday Correspondence; Pet Gift", "Year-Round", "", "true-to-breed coat colors",
    ["dog", "puppy", "pet", "breed"],
    [(b, None, f"an accurately proportioned, UNMISTAKABLE {b} — breed-true head shape, ears, coat color and texture — full body in a dignified seated pose with the tail clearly visible") for b in D.DOG_BREEDS]))
blocks.append(B("Animals", "Cats", "CAT", "Cat Lovers", "Cat Owner; Pet Lover",
    "Everyday Correspondence; Pet Gift", "Year-Round", "", "true-to-breed coat colors",
    ["cat", "kitten", "pet", "breed"],
    [(b, None, f"an accurately proportioned, UNMISTAKABLE {b} — breed-true face, ears, and coat — full body seated elegantly with the tail clearly visible") for b in D.CAT_BREEDS]))
blocks.append(B("Animals", "Small Pets", "PET", "Beloved Pets", "Pet Lover",
    "Everyday Correspondence; Pet Gift", "Year-Round", "", "soft natural tones",
    ["pet", "small pet"],
    [(p, None, f"an endearing, accurately drawn {p.lower()}") for p in D.SMALL_PETS]))
blocks.append(B("Animals", "Wildlife", "WLD", "Wildlife", "Nature Lover; Animal Lover",
    EV, "Year-Round", "", "naturalistic wildlife tones", ["animal", "wildlife", "nature"],
    [(a, None, f"a naturally posed, anatomically accurate {a.lower()}, full body with tail visible where the species has one") for a in D.WILD_ANIMALS]))
blocks.append(B("Animals", "Farm & Meadow", "FRM", "Farmhouse", "Farm Life Lover",
    EV, "Year-Round", "", "warm farmhouse naturals", ["farm", "farmhouse", "animal"],
    [(a, None, f"a charming, accurately drawn {a.lower()}") for a in D.FARM_ANIMALS]))
blocks.append(B("Animals", "Birds", "BRD", "Birdsong", "Birdwatcher; Nature Lover",
    EV, "Year-Round", "", "true-to-species plumage", ["bird", "birding", "nature"],
    [(b, None, f"a {b.lower()} with accurate species-true plumage and markings, full body standing in profile — NO branch, perch, or ground") for b in D.BIRDS]))
blocks.append(B("Animals", "Sea Life", "SEA", "Under the Sea", "Beach Lover; Ocean Lover",
    EV, "Summer", "", "coastal blues and corals", ["sea", "ocean", "coastal", "beach"],
    [(s, None, f"an accurately drawn {s.lower()} with graceful movement") for s in D.SEA_LIFE]))
blocks.append(B("Animals", "Insects & Pollinators", "INS", "Garden & Pollinators",
    "Gardener; Nature Lover", EV, "Spring; Summer", "", "warm garden naturals",
    ["insect", "pollinator", "garden"],
    [(i, None, f"an anatomically accurate {i.lower()}") for i in D.INSECTS]))

# Hobbies & Games
blocks.append(B("Hobbies & Games", "Fishing", "FSH", "Angler's Life",
    "Fisherman; Angler", "Everyday Correspondence; Father's Day", "Year-Round", "",
    "river and sea naturals", ["fishing", "angler", "fish"],
    [(f, None, f"a {f.lower()} with accurate fins, markings, and profile, mid-leap or side view" + (" — ONE single dorsal sail fin only, NO second fin near the tail" if any(b in f.lower() for b in ("marlin","sailfish","swordfish")) else "")) for f in D.FISH_SPECIES]
    + [(g, None, "classic fishing gear, accurately detailed") for g in D.FISHING_GEAR]))
blocks.append(B("Hobbies & Games", "Hunting & Field Sports", "HNT", "Field & Stream",
    "Hunter; Outdoorsman", "Everyday Correspondence; Father's Day", "Fall", "",
    "field browns and marsh greens", ["hunting", "field sports", "outdoors"],
    [(h, None, "classic sporting-field subject, accurately detailed") for h in D.HUNTING]))
for hobby, variations, det in D.HOBBIES:
    blocks.append(B("Hobbies & Games", hobby, code(hobby, 3), f"{hobby} Lovers",
        f"{hobby} Enthusiast", EV, "Year-Round", "", "refined hobby palette",
        [hobby.lower(), "hobby"],
        [(v, None, det or f"classic {hobby.lower()} equipment, accurately detailed") for v in variations]))

# Travel & Places
blocks.append(B("Travel & Places", "US States", "UST", "State Pride", "Traveler; State Native",
    "Everyday Correspondence; Housewarming", "Year-Round", "", "map-print naturals",
    ["state", "map", "hometown", "usa"],
    [(s, ["State Silhouette", "State Flag"], None) for s in D.STATES]))
blocks.append(B("Travel & Places", "Countries & Flags", "CTY", "World Traveler",
    "Traveler; Expat", EV, "Year-Round", "", "flag-accurate colors",
    ["country", "flag", "travel", "world"],
    [(c, ["Country Flag"], None) for c in D.COUNTRIES]))
blocks.append(B("Travel & Places", "Landmarks & Destinations", "LMK", "World Traveler",
    "Traveler; Adventurer", EV, "Year-Round", "", "travel-poster tones",
    ["travel", "landmark", "destination", "wanderlust"],
    [(n, None, f"the {n} rendered accurately and elegantly ({place}), the COMPLETE structure from its top all the way down to ground level — base, legs, and foundation fully included, crisp to the bottom edge") for n, place in D.WORLD_LANDMARKS]))

# Food & Drink
blocks.append(B("Food & Drink", "Sweets & Baked Goods", "SWT", "Sweet Shop",
    "Baker; Sweet Tooth", EV, "Year-Round", "", "confectionery pastels",
    ["dessert", "sweets", "baking", "treat"],
    [(s, None, f"a delicious, appetizing {s.lower()}") for s in D.SWEETS]))
blocks.append(B("Food & Drink", "Fruits & Pantry", "FRT", "Farmers Market",
    "Home Cook; Entertainer", EV, "Year-Round", "", "market-fresh naturals",
    ["food", "fruit", "kitchen", "market"],
    [(s, None, f"a fresh, appetizing {s.lower()}") for s in D.SAVORY_FRUIT]))
blocks.append(B("Food & Drink", "Cocktails & Drinks", "DRK", "Cocktail Hour",
    "Entertainer; Host", "Everyday Correspondence; Hostess Gift; Cocktail Party",
    "Year-Round", "", "bar-cart jewel tones", ["cocktail", "drink", "bar", "happy hour"],
    [(n, None, d or f"an elegant {n.lower()}") for n, d in D.DRINKS]))

# Celebrations & Holidays
for holiday_name, season, hol, items in D.HOLIDAY_BLOCKS:
    blocks.append(B("Celebrations & Holidays", holiday_name, code(holiday_name, 3),
        holiday_name, "Holiday Celebrant", "Holiday Correspondence; Holiday Gift",
        season, hol, f"classic {holiday_name} palette",
        [holiday_name.lower(), "holiday", "seasonal"],
        [(i, None, None) for i in items]))
for season, items in D.SEASON_MOTIFS:
    blocks.append(B("Celebrations & Holidays", f"{season} Season", code(season, 3) + "S",
        f"{season} Collection", "Seasonal Decorator", EV, season, "",
        f"classic {season.lower()} palette", [season.lower(), "seasonal"],
        [(i, None, None) for i in items]))
blocks.append(B("Celebrations & Holidays", "Celebrations", "CLB", "Celebrate",
    "Celebrant; Party Host", "Birthday; Graduation; Anniversary; Congratulations",
    "Year-Round", "", "festive gold and confetti tones",
    ["celebration", "party", "congratulations"],
    [(c, None, None) for c in D.CELEBRATION]))
blocks.append(B("Celebrations & Holidays", "Baby & New Arrival", "BBY", "Nursery",
    "New Parent; Gift Giver", "Baby Shower; New Baby", "Year-Round", "",
    "soft nursery pastels", ["baby", "nursery", "shower", "newborn"],
    [(b, None, f"a sweet, softly drawn {b.lower()}") for b in D.BABY]))
blocks.append(B("Celebrations & Holidays", "Faith & Religious", "FTH", "Faith",
    "Person of Faith", "Religious Occasion; Holiday Correspondence", "Year-Round", "",
    "reverent classic tones", ["faith", "religious"],
    [(n, None, d or f"a respectful, elegant {n.lower()}") for n, faith, d in D.RELIGIOUS]))
blocks.append(B("Celebrations & Holidays", "Mother & Father", "MFA", "Family",
    "Family; Gift Giver", "Mother's Day; Father's Day", "Year-Round", "",
    "warm family tones", ["family", "mother", "father"],
    [(m, None, None) for m in D.MOTHER_FATHER]))

# Professions
blocks.append(B("Professions", "Professions", "PRF", "Working Life",
    "Professional; Colleague", "Everyday Correspondence; Retirement; New Job",
    "Year-Round", "", "polished professional tones", ["profession", "career", "office"],
    [(n, None, d) for n, d in D.PROFESSIONS]))
blocks.append(B("Professions", "Military & Service", "MIL", "Service & Sacrifice",
    "Military Family; Veteran", "Everyday Correspondence; Homecoming", "Year-Round", "",
    "honor golds and service blues", ["military", "service", "veteran", "patriotic"],
    [(m, None, "a respectful, non-partisan military-appreciation motif") for m in D.MILITARY]))
blocks.append(B("Professions", "Teachers & School", "TCH", "Teacher Appreciation",
    "Teacher; Student; Parent", "Teacher Gift; Back to School", "Year-Round", "",
    "schoolhouse red and chalkboard green", ["teacher", "school", "classroom"],
    [(t, None, None) for t in D.TEACHER]))

# Objects & Motifs
blocks.append(B("Objects & Motifs", "Coastal & Nautical", "CST", "Coastal Living",
    "Beach Lover; Boater", EV, "Summer", "", "coastal navy, white and sand",
    ["coastal", "nautical", "beach", "preppy"],
    [(c, None, None) for c in D.COASTAL]))
blocks.append(B("Objects & Motifs", "Space & Celestial", "SPC", "Celestial",
    "Dreamer; Stargazer", EV, "Year-Round", "", "midnight blues and gold stars",
    ["space", "celestial", "stars", "moon"],
    [(s, None, None) for s in D.SPACE]))
blocks.append(B("Objects & Motifs", "Collegiate & Sorority", "CLG", "Campus Life",
    "College Student; Sorority Sister; Proud Parent",
    "Back to School; Bid Day; Graduation", "Year-Round", "",
    "customizable school colors", ["college", "campus", "sorority", "school spirit"],
    [(n, None, d) for n, d in D.COLLEGE]))

# ── style-specific instruction builders ──────────────────────────────
def style_fields(style_name, style_code, ai_style, palette):
    if style_code == "WC":
        color = (f"Use a soft, natural watercolor palette led by {palette}. "
                 "Muted and elegant; avoid neon or oversaturation.")
    elif style_code == "HS":
        color = ("Monochrome black ink only on white — no color, no grayscale washes. "
                 "Depth comes from line weight, cross-hatching, and stippling. "
                 "(Kept single-ink so it can be tinted to any color later.)")
    else:
        color = ("Pure black single-ink monochrome — flat black shapes on transparent. "
                 "NO color and no gray tones: this artwork is DESIGNED TO BE RECOLORED, "
                 "so every shape must read perfectly as one solid ink color.")
    return ai_style, color

NEG = ("No text, no lettering, no border, no mockup, no watermark, no photographic "
       "background, no drop shadow, no clip-art appearance, no cartoon face, no "
       "cropped or cut-off parts — the full subject fully inside the frame.")

# ── build rows ───────────────────────────────────────────────────────
wb = openpyxl.load_workbook(SRC)
styles_ws = wb["Illustration Styles"]
AI_STYLE = {}
for r in range(2, styles_ws.max_row + 1):
    sc = styles_ws.cell(r, 2).value
    if sc:
        AI_STYLE[sc] = styles_ws.cell(r, 10).value or ""

ml = wb["Master Icon Library"]
HDR = [ml.cell(1, c).value for c in range(1, ml.max_column + 1)]
COL = {h: i + 1 for i, h in enumerate(HDR) if h}

used_subj_codes, rows, families = {}, [], {}
for blk in blocks:
    cat3, sub3 = CATCODE[blk["cat"]], blk["sc"]
    for subject, variations, detail in blk["subjects"]:
        key = (cat3, sub3)
        sc_map = used_subj_codes.setdefault(key, {})
        base = code(subject, 4)
        sub_code, n = base, 1
        while sub_code in sc_map and sc_map[sub_code] != subject:
            n += 1
            sub_code = (base[:3] + str(n))
        sc_map[sub_code] = subject
        var_list = variations or ["Classic"]
        for seq, variation in enumerate(var_list, 1):
            icon_id = f"{cat3}-{sub3}-{sub_code}-{seq:03d}"
            fam = f"FAM-{cat3}-{sub3}-{sub_code}"
            disp_subject = subject if variation in ("Classic", "Single Stem") else f"{subject} {variation}" \
                if variation not in ("Bouquet", "State Silhouette", "State Flag", "Country Flag") else \
                (f"{subject} Bouquet" if variation == "Bouquet" else
                 f"{subject} Flag" if variation in ("State Flag", "Country Flag") else subject)
            det = detail
            if variation == "Bouquet":
                det = f"a gathered bouquet of {subject.lower()} blooms with greenery, hand-tied"
            elif variation == "State Silhouette":
                det = f"a clean, geographically accurate SOLID silhouette of the state of {subject} — shape only, no stars, markings, or decorations inside; painted in ONE single flat uniform color (deep red default — the color is customer-customizable), absolutely no gradient, ombre, or multi-tone wash"
            elif variation in ("State Flag", "Country Flag"):
                det = f"the flag of {subject} with accurate colors and layout, gently waving"
            if subject.lower().startswith("crossed") or variation.lower().startswith("crossed"):
                det = (det or f"an elegant, accurately drawn {disp_subject.lower()}") + \
                    " — the two crossed items are IDENTICAL copies of the same design and color, one mirrored, perfectly symmetric"
            det = det or f"an elegant, accurately drawn {disp_subject.lower()}"
            for style_name, style_code_ in STYLES:
                ai_style, ai_color = style_fields(style_name, style_code_,
                                                  AI_STYLE.get(style_code_, ""), blk["palette"])
                kw = list(dict.fromkeys(
                    [subject.lower(), disp_subject.lower()] + blk["kw"]))
                r = {
                    "Icon ID": icon_id, "Parent Asset Family ID": fam,
                    "Product SKU": f"IC-{icon_id}-{style_code_}", "Version": "V01",
                    "Status": "Prompt Ready", "Priority": "Medium",
                    "Internal Name": f"{subject} – {variation} – Three-Quarter View – {style_name}",
                    "Display Name": f"{style_name} {disp_subject}",
                    "Short Customer Description":
                        f"An elegant {style_name.lower()} {disp_subject.lower()} in our signature style.",
                    "Category": blk["cat"], "Subcategory": blk["sub"], "Subject": subject,
                    "Variation / Pose": variation, "Viewpoint": "Three-Quarter",
                    "Theme / Collection": blk["theme"], "Audience / Interest": blk["aud"],
                    "Occasion": blk["occ"], "Season": blk["season"], "Holiday": blk["holiday"],
                    "Illustration Style": style_name, "Style Code": style_code_,
                    "Orientation": "Flexible", "Complexity": "Moderate",
                    "Primary Color Family": blk["palette"] if style_code_ == "WC" else "Black single-ink (recolorable)" if style_code_ == "MG" else "Black ink on white",
                    "Secondary Colors": "", "Background": "Transparent",
                    "Border / Frame": "None", "Pattern-Ready": "Yes",
                    "Primary Keywords": "; ".join(kw[:6]),
                    "Synonyms": "; ".join(kw[1:5]),
                    "Related Search Terms": "; ".join(blk["kw"] + [blk["theme"].lower()]),
                    "Common Misspellings": "", "Search Exclusions": "political; partisan; divisive",
                    "Customer Search Visibility": "Customer Searchable",
                    "Search Priority Score": 7, "Featured": "No",
                    "AI Subject Brief": f"Depict {det}. Instantly recognizable, botanically/anatomically faithful where applicable, refined and giftable.",
                    "AI Composition Instruction":
                        "Center the subject with generous clean negative space; full silhouette visible, nothing cropped; designed to sit above a name or monogram on stationery.",
                    "AI Style Instruction": ai_style, "AI Color Instruction": ai_color,
                    "AI Negative Prompt": NEG,
                    "Reference / Art Direction Notes":
                        "Elegant silhouette first; test readability at 0.75 in wide.",
                    "Prompt Version": "P-001",
                    "Source / Rights Status": "Original AI-assisted asset; documentation pending",
                    "Commercial Rights Confirmed": "Pending",
                    "Artist / AI Tool": "Recraft (AI-assisted)" if style_code_ == "MG" else "gpt-image-1 (AI-assisted)",
                    "QA Status": "Not Reviewed", "Revision Count": 0,
                    "Master File Name": f"{icon_id.lower()}-{style_code_.lower()}-v01-master.png",
                    "Master File Location": f"TBD / Winsome Studio / {blk['cat']} / {blk['sub']} / {style_name}",
                    "Source File Format": "SVG" if style_code_ == "MG" else "PNG",
                    "Export Formats": "SVG; PNG" if style_code_ == "MG" else "PNG; transparent PNG",
                    "Transparent Background File": "TBD", "Thumbnail File": "TBD",
                    "Print-Test Complete": "No",
                    "Compatible Product Codes": D.P_ALL,
                    "Compatibility Notes": "All-purpose stationery icon.",
                    "Launch Collection": blk["theme"], "Times Ordered": 0,
                    "Revenue Generated": "", "Retirement Candidate": "No",
                    "Internal Notes": ("Modern Graphic is single-ink and customer-recolorable." if style_code_ == "MG" else
                                       "Heritage Sketch stays black-ink core; tintable later." if style_code_ == "HS" else
                                       "From the master catalog brief (Daniel & Sydney)."),
                }
                rows.append(r)

# write rows starting at row 3 (Honeybee sample stays at row 2)
start = 3
for i, r in enumerate(rows):
    for h, cidx in COL.items():
        if h in r:
            ml.cell(start + i, cidx, r[h])

# extend the Taxonomy Dictionary with the subcategories we used
td = wb["Taxonomy Dictionary"]
tr = td.max_row + 1
seen = set()
for blk in blocks:
    k = (blk["cat"], blk["sub"])
    if k in seen: continue
    seen.add(k)
    td.cell(tr, 1, "Subcategory"); td.cell(tr, 2, blk["sub"]); td.cell(tr, 3, blk["cat"])
    td.cell(tr, 4, 2); td.cell(tr, 5, blk["sc"]); td.cell(tr, 6, blk["sub"])
    td.cell(tr, 7, f"{blk['sub']} icons within {blk['cat']}."); td.cell(tr, 10, "Yes")
    tr += 1

wb.save(OUT)

# summary
from collections import Counter
c = Counter((r["Category"], r["Subcategory"]) for r in rows)
subj = len({r["Icon ID"] for r in rows})
print(f"TOTAL: {len(rows)} rows = {subj} icons x 3 styles  →  {OUT}")
for (cat, sub), n in sorted(c.items()):
    print(f"  {cat:28} {sub:28} {n:5} rows ({n//3} icons)")
