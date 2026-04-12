import { useCallback, useMemo } from "react";
import type { ControlBindings } from "../types";
import { useLocalStorage } from "./useLocalStorage";
import {
  CONTROL_BINDINGS_STORAGE_KEY,
  DEFAULT_CONTROL_BINDINGS,
  sanitizeControlBindings,
} from "../utils/controlBindings";

export function useControlBindings() {
  const [storedBindings, setStoredBindings] = useLocalStorage<ControlBindings>(
    CONTROL_BINDINGS_STORAGE_KEY,
    DEFAULT_CONTROL_BINDINGS,
  );

  const bindings = useMemo(
    () => sanitizeControlBindings(storedBindings),
    [storedBindings],
  );

  const setBindings = useCallback(
    (value: ControlBindings | ((prev: ControlBindings) => ControlBindings)) => {
      setStoredBindings((prev) => {
        const safePrev = sanitizeControlBindings(prev);
        const next = value instanceof Function ? value(safePrev) : value;
        return sanitizeControlBindings(next);
      });
    },
    [setStoredBindings],
  );

  const resetBindings = useCallback(() => {
    setStoredBindings(DEFAULT_CONTROL_BINDINGS);
  }, [setStoredBindings]);

  return { bindings, setBindings, resetBindings };
}
