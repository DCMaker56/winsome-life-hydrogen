#!/usr/bin/env python3
"""
Batch generator for "create mode" — process a queue of illustration jobs through
the full pipeline (generate → cutout → register), concurrently and resumably.

Queue: generated/batch_queue.json = a list of job dicts:
  {
    "subject": "Blue Hydrangea Bouquet",   # display subject/family variation
    "category": "Florals",
    "style": "watercolor",                 # watercolor | heritage-sketch | modern-graphic
    "phrase": "a hand-tied bouquet of blue hydrangeas",  # the [SUBJECT] in the scaffold
    "detail": "full mophead blooms in periwinkle and lavender with sage foliage",
    "complexity": "Detailed",
    "keywords_extra": ["hydrangea", "bouquet", "wedding"]   # optional family links
  }

Run a batch of 50:   python3 batch.py --limit 50
Already-made jobs (id already in library.json) are skipped, so re-running just
continues where you left off. Nothing here syncs/deploys — it fills the local
library; sync + deploy is a separate, deliberate step.
"""
import json, os, argparse, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import make, registry as R

GEN = R.GEN
ASSETS = "assets"                       # generated/assets/<id>.{png,svg}
os.makedirs(os.path.join(GEN, ASSETS), exist_ok=True)

save_lock = threading.Lock()            # library.json is rewritten whole → serialize
cut_lock = threading.Lock()             # rembg onnx session isn't thread-safe


def job_id(job):
    return R.make_id(job["category"], job["subject"], job["style"])


def run_one(job):
    style = job["style"]
    phrase = job.get("phrase") or ("a " + job["subject"].lower())
    prompt = make.SCAFFOLD[style](phrase, job.get("detail", ""))
    _id = job_id(job)
    complexity = job.get("complexity", "Moderate")

    if style == "modern-graphic":
        svg = make.gen_recraft_svg(prompt)
        f = f"{ASSETS}/{_id}.svg"
        with open(os.path.join(GEN, f), "wb") as fh:
            fh.write(svg)
        rec = R.record(job["category"], job["subject"], style, file=f, master=f,
                       prompt=prompt, complexity=complexity)
    else:
        fm, fc = f"{ASSETS}/{_id}-master.png", f"{ASSETS}/{_id}.png"
        png = make.gen_gptimage(prompt)
        with cut_lock:
            norm, cropped = make.cutout_checked(png)
        tries = 0
        while cropped and tries < 2:  # regenerate if the subject came out clipped
            tries += 1
            png = make.gen_gptimage(prompt)
            with cut_lock:
                norm, cropped = make.cutout_checked(png)
        with open(os.path.join(GEN, fm), "wb") as fh:
            fh.write(png)
        norm.save(os.path.join(GEN, fc))
        rec = R.record(job["category"], job["subject"], style, file=fc, master=fm,
                       prompt=prompt, complexity=complexity)

    for k in job.get("keywords_extra", []):
        if k.lower() not in rec["keywords"]:
            rec["keywords"].append(k.lower())
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--queue", default=os.path.join(GEN, "batch_queue.json"))
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()

    jobs = json.load(open(a.queue))
    have = {i["id"] for i in R.load()["items"]}
    todo = [j for j in jobs if job_id(j) not in have][:a.limit]
    print(f"Queue: {len(jobs)} jobs · already made: {len(have)} · this batch: {len(todo)}\n")
    if not todo:
        print("Nothing to do — queue fully generated."); return

    # pre-warm the rembg session once so threads don't race to create it
    make._session = make.new_session("u2net")

    done = fail = 0
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = {ex.submit(run_one, j): j for j in todo}
        for fut in as_completed(futs):
            j = futs[fut]
            try:
                rec = fut.result()
                with save_lock:
                    R.upsert(rec)
                done += 1
                print(f"  [{done+fail:>2}/{len(todo)}] ✓ {rec['id']:32} {rec['name']}")
            except Exception as e:
                fail += 1
                print(f"  [{done+fail:>2}/{len(todo)}] ✗ {job_id(j):32} {str(e)[:90]}")

    print(f"\nBatch complete: {done} created, {fail} failed. "
          f"Library now holds {len(R.load()['items'])} illustrations.")
    if fail:
        print("Re-run to retry the failures (skips everything already made).")


if __name__ == "__main__":
    main()
