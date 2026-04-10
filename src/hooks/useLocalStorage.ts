import { useState, useCallback } from "react";

/**
 * Generic hook for persisting state in localStorage.
 * Falls back to defaultValue if localStorage is unavailable or data is corrupted.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // localStorage full or unavailable — state still updates in memory
        }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue];
}
