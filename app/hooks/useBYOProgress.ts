/**
 * useBYOProgress — persists Build-Your-Own builder state to localStorage
 * so mid-flow bounces don't lose work. The shape is opaque to this hook;
 * consumers pass their own state object.
 *
 * Usage:
 *   const { saved, save, clear } = useBYOProgress<MyBuilderState>();
 *   useEffect(() => { if (saved) setState(saved); }, []);
 *   useEffect(() => { save(state); }, [state]);
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "winsome_byo_progress_v1";
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface StoredProgress<T> {
  state: T;
  savedAt: number;
}

export function useBYOProgress<T>() {
  const [saved, setSaved] = useState<T | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: StoredProgress<T> = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setSaved(parsed.state);
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback((state: T) => {
    try {
      const payload: StoredProgress<T> = { state, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSaved(null);
    } catch {
      /* ignore */
    }
  }, []);

  return { saved, save, clear };
}
