"""
The Illustration Library registry — single source of truth.

Every illustration we generate is recorded here (library.json). The gallery
reads it; the storefront will later read published=True rows. Plain JSON on
purpose: simple, diffable, no database server. Thousands of rows is fine.
"""
import json, os, re
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
# Honor LIB_DIR (a mounted persistent disk in the hosted container) so the Node
# server and the Python tools read/write the same assets + library.json.
GEN = os.environ.get("LIB_DIR") or os.path.join(HERE, "generated")
LIB = os.path.join(GEN, "library.json")

CATEGORY_CODE = {
    "Animals": "ani", "Florals": "flr", "Sports": "spt", "Games": "gam",
    "Dogs": "dog", "Cats": "cat", "Hobbies": "hob", "Maps": "map",
}
STYLE = {
    "watercolor":      {"code": "wc", "name": "Watercolor",      "format": "png", "engine": "gpt-image-1"},
    "heritage-sketch": {"code": "hs", "name": "Heritage Sketch", "format": "png", "engine": "gpt-image-1"},
    "modern-graphic":  {"code": "mg", "name": "Modern Graphic",  "format": "svg", "engine": "recraft-v3"},
}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def make_id(category, subject, style):
    cc = CATEGORY_CODE.get(category, slug(category)[:3])
    return f"{cc}-{slug(subject)}-{STYLE[style]['code']}"


def load():
    if os.path.exists(LIB):
        with open(LIB) as f:
            return json.load(f)
    return {"version": 1, "items": []}


def save(lib):
    lib["items"].sort(key=lambda r: (r["category"], r["subject"], r["style"]))
    with open(LIB, "w") as f:
        json.dump(lib, f, indent=2)


def upsert(record):
    """Insert or update by id. Preserves an existing published flag."""
    lib = load()
    for i, r in enumerate(lib["items"]):
        if r["id"] == record["id"]:
            record.setdefault("published", r.get("published", False))
            record.setdefault("createdAt", r.get("createdAt", now_iso()))
            lib["items"][i] = record
            save(lib)
            return record, "updated"
    record.setdefault("published", False)
    record.setdefault("createdAt", now_iso())
    lib["items"].append(record)
    save(lib)
    return record, "created"


def record(category, subject, style, file, master=None, prompt="",
           complexity="Moderate", qa_status="Not Reviewed", **extra):
    """Build a registry record. Paths are relative to generated/."""
    st = STYLE[style]
    _id = make_id(category, subject, style)
    rec = {
        "id": _id,
        # Unique, human-readable name — never just the bare subject.
        "name": f"{subject} · {st['name']}",
        "subject": subject,
        "category": category,
        "style": style,
        "styleName": st["name"],
        "complexity": complexity,
        "qaStatus": qa_status,
        # Searchable keywords — subject stays a keyword so "hydrangea" finds all
        # hydrangeas across styles; id included so you can search by code.
        "keywords": [subject.lower(), category.lower(), st["name"].lower(),
                     st["code"], _id],
        "format": st["format"],
        "engine": st["engine"],
        "file": file,                 # display asset (transparent png or svg)
        "master": master or file,     # white-background master (raster)
        "prompt": prompt,
        "createdAt": now_iso(),
        "published": False,
    }
    rec.update(extra)
    return rec
