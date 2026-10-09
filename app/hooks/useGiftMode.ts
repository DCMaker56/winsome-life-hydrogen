/**
 * useGiftMode — per-product "This is a gift" toggle backed by sessionStorage.
 * When on, product pages reveal GiftMessage + show a "no-price packing slip"
 * assurance line. Resets per session (not persisted across windows close).
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "winsome_gift_mode_v1";

function readAll(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, boolean>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function useGiftMode(productSlug: string) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const all = readAll();
    setOn(!!all[productSlug]);
  }, [productSlug]);

  const toggle = useCallback(() => {
    const all = readAll();
    const next = !all[productSlug];
    all[productSlug] = next;
    writeAll(all);
    setOn(next);
  }, [productSlug]);

  return { on, toggle };
}
