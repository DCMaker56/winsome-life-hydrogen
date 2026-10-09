/**
 * useWishlist — localStorage-backed product wishlist.
 *
 * Stores an array of product slugs in localStorage under a single key.
 * Broadcasts changes across tabs via the native `storage` event and across
 * components in the same tab via a CustomEvent.
 *
 * API:
 *   const { wishlist, has, toggle, clear } = useWishlist();
 *   const count = useWishlistCount();
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "winsome_wishlist_v1";
const UPDATE_EVENT = "winsome:wishlist-updated";

function readWishlist(): string[] {
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

function writeWishlist(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    /* storage disabled — degrade silently */
  }
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    setWishlist(readWishlist());
    const sync = () => setWishlist(readWishlist());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  const has = useCallback((slug: string) => wishlist.includes(slug), [wishlist]);

  const toggle = useCallback((slug: string) => {
    const current = readWishlist();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    writeWishlist(next);
  }, []);

  const clear = useCallback(() => writeWishlist([]), []);

  return { wishlist, has, toggle, clear };
}

export function useWishlistCount(): number {
  const { wishlist } = useWishlist();
  return wishlist.length;
}
