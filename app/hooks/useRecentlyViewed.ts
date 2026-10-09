/**
 * useRecentlyViewed — localStorage-backed product-history queue.
 *
 * Most-recent-first, max 12 entries, deduped by slug.
 * Used on product pages to track and on the homepage footer or PDP to surface.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "winsome_recently_viewed_v1";
const UPDATE_EVENT = "winsome:recently-viewed-updated";
const MAX_ENTRIES = 12;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    /* storage disabled — degrade silently */
  }
}

export function useRecentlyViewed() {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    setList(read());
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  const track = useCallback((slug: string) => {
    const current = read();
    const filtered = current.filter((s) => s !== slug);
    const next = [slug, ...filtered].slice(0, MAX_ENTRIES);
    write(next);
  }, []);

  return { list, track };
}

/** Fire-and-forget helper for pages that just want to track a view. */
export function trackRecentlyViewed(slug: string) {
  const current = read();
  const filtered = current.filter((s) => s !== slug);
  write([slug, ...filtered].slice(0, MAX_ENTRIES));
}
