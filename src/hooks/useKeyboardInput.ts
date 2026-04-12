import { useEffect, useRef, useState, useCallback } from "react";
import type { ControlAction, ControlBindings, Fingering } from "../types";
import { getActionForKeyboardEvent } from "../utils/controlBindings";

const EMPTY_FINGERING: Fingering = {
  valves: [false, false, false],
  slide: false,
};

/**
 * Hook that tracks simultaneous key presses for trumpet valve input.
 */
export function useKeyboardInput(
  active: boolean,
  onSubmit: (fingering: Fingering) => void,
  controlBindings: ControlBindings,
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

    function updateFingering(action: ControlAction, pressed: boolean) {
      const prev = inputRef.current;
      let changed = false;
      const valves: [boolean, boolean, boolean] = [...prev.valves];
      let slide = prev.slide;

      switch (action) {
        case "valve1":
          if (valves[0] !== pressed) {
            valves[0] = pressed;
            changed = true;
          }
          break;
        case "valve2":
          if (valves[1] !== pressed) {
            valves[1] = pressed;
            changed = true;
          }
          break;
        case "valve3":
          if (valves[2] !== pressed) {
            valves[2] = pressed;
            changed = true;
          }
          break;
        case "slide":
          if (slide !== pressed) {
            slide = pressed;
            changed = true;
          }
          break;
        case "submit":
          break;
      }

      if (changed) {
        const next: Fingering = { valves, slide };
        inputRef.current = next;
        setCurrentInput(next);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const action = getActionForKeyboardEvent(controlBindings, e);

      if (!action) return;

      e.preventDefault();

      if (e.repeat) return;

      if (action === "submit") {
        onSubmitRef.current({
          ...inputRef.current,
          valves: [...inputRef.current.valves],
        });
        return;
      }

      updateFingering(action, true);
    }

    function handleKeyUp(e: KeyboardEvent) {
      const action = getActionForKeyboardEvent(controlBindings, e);

      if (!action) return;

      e.preventDefault();

      if (action !== "submit") {
        updateFingering(action, false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [active, controlBindings]);

  return { currentInput, resetInput };
}
