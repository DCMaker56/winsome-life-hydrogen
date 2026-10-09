#!/usr/bin/env python3
"""Expand Daniel's topic list → variations × 3 styles → batch_queue.json + a table."""
import json, os
import registry as R

STYLES = ["watercolor", "heritage-sketch", "modern-graphic"]

# topic → list of variations: (subject, phrase, detail, complexity, keywords_extra)
VARIATIONS = {
    "Tennis (Sports)": ("Sports", [
        ("Tennis Racket", "a single tennis racket",
         "a classic tennis racket at a graceful three-quarter angle, strung head and wrapped grip", "Moderate", ["tennis","racket"]),
        ("Tennis Racket & Ball", "a tennis racket with a tennis ball",
         "a tennis racket at a three-quarter angle with a fuzzy tennis ball resting beside its head", "Moderate", ["tennis","racket","ball"]),
        ("Crossed Tennis Rackets", "two crossed tennis rackets",
         "two tennis rackets crossed in an X like a heraldic crest, a small tennis ball at the center", "Detailed", ["tennis","crest","rackets"]),
    ]),
    "Lacrosse (Sports)": ("Sports", [
        ("Lacrosse Stick", "a single lacrosse stick",
         "a classic lacrosse crosse with a netted head and long shaft, three-quarter angle", "Moderate", ["lacrosse","stick"]),
        ("Lacrosse Stick & Ball", "a lacrosse stick with a ball",
         "a lacrosse crosse with a lacrosse ball resting in the netted head", "Moderate", ["lacrosse","stick","ball"]),
        ("Crossed Lacrosse Sticks", "two crossed lacrosse sticks",
         "two lacrosse sticks crossed in an X like a heraldic crest with a ball at the center", "Detailed", ["lacrosse","crest","sticks"]),
    ]),
    "Roses (Florals)": ("Florals", [
        ("Single Rose", "a single rose bloom",
         "one fully open garden rose in soft blush pink with layered petals and a few sage-green leaves", "Detailed", ["rose","flower","floral"]),
        ("Rose Bud", "a single rose bud",
         "a closed rose bud in blush pink on a short stem with leaves", "Simple", ["rose","flower","floral"]),
        ("Long-Stem Rose", "a single long-stem rose",
         "one blush-pink rose on a tall elegant stem with leaves and a couple of thorns", "Moderate", ["rose","flower","floral"]),
        ("Rose Bouquet", "a gathered bouquet of roses",
         "a loose hand-tied bouquet of blush and soft-red garden roses with greenery", "Detailed", ["rose","bouquet","floral"]),
    ]),
    "Lily (Florals)": ("Florals", [
        ("Single Lily", "a single lily bloom",
         "one open oriental lily with recurved petals and prominent stamens, ivory blushed with pink", "Detailed", ["lily","flower","floral"]),
        ("Lily Bud", "a single lily bud",
         "a closed lily bud on a stem tip with a slender leaf", "Simple", ["lily","flower","floral"]),
        ("Long-Stem Lily", "a long-stem lily",
         "a lily stem bearing one open bloom and a bud, with slender leaves", "Moderate", ["lily","flower","floral"]),
        ("Lily Bouquet", "a bouquet of lilies",
         "a gathered bouquet of ivory and pink lilies with green foliage", "Detailed", ["lily","bouquet","floral"]),
    ]),
    "Map of the World (Maps)": ("Maps", [
        ("World Map", "a map of the world",
         "an elegant map of the world showing all continents, balanced and centered, refined coastlines", "Detailed", ["world","map","travel"]),
        ("Globe", "a globe of the earth",
         "a classic globe showing continents and latitude and longitude lines at a three-quarter tilt", "Moderate", ["world","globe","map","travel"]),
        ("Vintage World Map", "a vintage world map with a compass rose",
         "an antique-style world map with continents and a decorative compass rose", "Detailed", ["world","map","compass","travel"]),
    ]),
    "Map of Texas (Maps)": ("Maps", [
        ("Texas Outline", "the outline silhouette of the state of Texas",
         "a clean silhouette of the state of Texas", "Simple", ["texas","state","map"]),
        ("Texas with Star", "the state of Texas with a lone star",
         "a silhouette of Texas with a single five-point star marking its position, the Lone Star State", "Moderate", ["texas","star","state","map"]),
        ("Texas with Heart", "the state of Texas with a small heart",
         "a silhouette of Texas with a small heart marking a location", "Simple", ["texas","heart","state","map"]),
    ]),
    "Map of Florida (Maps)": ("Maps", [
        ("Florida Outline", "the outline silhouette of the state of Florida",
         "a clean silhouette of the state of Florida with panhandle and peninsula", "Simple", ["florida","state","map"]),
        ("Florida with Heart", "the state of Florida with a small heart",
         "a silhouette of Florida with a small heart marking a location", "Simple", ["florida","heart","state","map"]),
        ("Florida with Palm", "the state of Florida with a palm tree motif",
         "a silhouette of Florida with a small palm tree and sunshine motif", "Moderate", ["florida","palm","state","map"]),
    ]),
}

jobs, table = [], []
for topic, (cat, variations) in VARIATIONS.items():
    for subject, phrase, detail, cx, kw in variations:
        for style in STYLES:
            jobs.append({"subject": subject, "category": cat, "style": style,
                         "phrase": phrase, "detail": detail, "complexity": cx,
                         "keywords_extra": kw})
        table.append((topic, subject, cat, cx, R.slug(subject)))

with open(os.path.join(R.GEN, "batch_queue.json"), "w") as f:
    json.dump(jobs, f, indent=2)

# printed summary for review
print(f"TOTAL: {len(table)} variations × 3 styles = {len(jobs)} illustrations\n")
last = None
for topic, subject, cat, cx, sl in table:
    if topic != last:
        print(f"\n=== {topic} ===")
        last = topic
    ids = " / ".join(f"{R.CATEGORY_CODE[cat]}-{sl}-{c}" for c in ("wc","hs","mg"))
    print(f"  • {subject:24} [{cx:8}]  → {ids}")
print(f"\nBatch math: {len(jobs)} total → batch 1 = 50, batch 2 = {len(jobs)-50}")
