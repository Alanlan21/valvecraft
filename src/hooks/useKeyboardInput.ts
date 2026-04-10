import { useEffect, useRef, useState, useCallback } from "react";
import type { Fingering } from "../types";

const EMPTY_FINGERING: Fingering = {
  valves: [false, false, false],
  slide: false,
};

/**
 * Hook that tracks simultaneous key presses for trumpet valve input.
 *
 * Key mapping:
 *   Q → valve 1
 *   W → valve 2
 *   E → valve 3
 *   Shift → 3rd valve slide
 *   Space → submit answer
 *
 * Prevents default browser behavior for Space and Shift during gameplay.
 */
export function useKeyboardInput(
  active: boolean,
  onSubmit: (fingering: Fingering) => void,
) {
  const [currentInput, setCurrentInput] = useState<Fingering>(EMPTY_FINGERING);
  const inputRef = useRef<Fingering>(EMPTY_FINGERING);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const resetInput = useCallback(() => {
    const empty = {
      valves: [false, false, false] as [boolean, boolean, boolean],
      slide: false,
    };
    inputRef.current = empty;
    setCurrentInput(empty);
  }, []);

  useEffect(() => {
    if (!active) return;

    function updateFingering(key: string, pressed: boolean) {
      const prev = inputRef.current;
      let changed = false;
      const valves: [boolean, boolean, boolean] = [...prev.valves];
      let slide = prev.slide;

      switch (key.toLowerCase()) {
        case "q":
          if (valves[0] !== pressed) {
            valves[0] = pressed;
            changed = true;
          }
          break;
        case "w":
          if (valves[1] !== pressed) {
            valves[1] = pressed;
            changed = true;
          }
          break;
        case "e":
          if (valves[2] !== pressed) {
            valves[2] = pressed;
            changed = true;
          }
          break;
        case "shift":
          if (slide !== pressed) {
            slide = pressed;
            changed = true;
          }
          break;
      }

      if (changed) {
        const next: Fingering = { valves, slide };
        inputRef.current = next;
        setCurrentInput(next);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;

      // Prevent browser defaults for game keys
      if (e.key === " " || e.key === "Shift") {
        e.preventDefault();
      }

      if (e.key === " ") {
        // Submit current fingering on Space
        onSubmitRef.current({
          ...inputRef.current,
          valves: [...inputRef.current.valves],
        });
        return;
      }

      updateFingering(e.key, true);
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Shift") {
        e.preventDefault();
      }
      updateFingering(e.key, false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [active]);

  return { currentInput, resetInput };
}
