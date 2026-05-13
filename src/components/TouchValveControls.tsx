import { useCallback, useRef } from "react";
import type { Fingering } from "../types";

interface TouchValveControlsProps {
  currentInput: Fingering;
  onValveChange: (index: 0 | 1 | 2, pressed: boolean) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const VALVES: { index: 0 | 1 | 2; label: string }[] = [
  { index: 0, label: "1" },
  { index: 1, label: "2" },
  { index: 2, label: "3" },
];

export function TouchValveControls({
  currentInput,
  onValveChange,
  onSubmit,
  disabled = false,
}: TouchValveControlsProps) {
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  // Maps touch identifier -> set of valve indices already acted on in this gesture.
  // Prevents a sliding finger from toggling the same valve twice.
  const tracking = useRef<Map<number, Set<0 | 1 | 2>>>(new Map());

  /** Returns which valve button contains the given client point, or null. */
  const valveAtPoint = useCallback(
    (x: number, y: number): (0 | 1 | 2) | null => {
      for (let i = 0; i < buttonRefs.current.length; i++) {
        const el = buttonRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
          return i as 0 | 1 | 2;
      }
      return null;
    },
    [],
  );

  /**
   * touchstart — each finger that lands on a valve toggles it.
   * Multiple simultaneous touches fire independently -> natural multi-touch.
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault(); // prevent scroll + 300 ms synthetic click
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const valve = valveAtPoint(t.clientX, t.clientY);
        if (valve !== null) {
          tracking.current.set(t.identifier, new Set([valve]));
          onValveChange(valve, !currentInput.valves[valve]); // toggle
        } else {
          tracking.current.set(t.identifier, new Set());
        }
      }
    },
    [disabled, valveAtPoint, onValveChange, currentInput.valves],
  );

  /**
   * touchmove — sliding over a new valve activates it.
   * Never deactivates during a slide so the gesture feels additive.
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const valve = valveAtPoint(t.clientX, t.clientY);
        if (valve === null) continue;
        const seen = tracking.current.get(t.identifier);
        if (!seen || seen.has(valve)) continue; // already handled in this gesture
        seen.add(valve);
        onValveChange(valve, true); // slide always activates
      }
    },
    [disabled, valveAtPoint, onValveChange],
  );

  /** touchend / touchcancel — clean up tracking for released fingers. */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++)
      tracking.current.delete(e.changedTouches[i].identifier);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* touch-none stops browser scroll so our handlers take full control */}
      <div
        className="flex gap-4 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {VALVES.map((valve) => {
          const pressed = currentInput.valves[valve.index];
          return (
            <div
              key={valve.index}
              ref={(el) => {
                buttonRefs.current[valve.index] = el;
              }}
              className={`
                flex h-20 w-20 items-center justify-center rounded-full border-2
                text-2xl font-bold transition-all duration-75
                ${
                  pressed
                    ? "translate-y-1 border-[#d4a853] bg-[#d4a853] text-[#1a1a2e] shadow-[0_0_20px_#d4a853]"
                    : "border-[#cd7f32]/50 bg-[#2a2a4a] text-[#cd7f32]"
                }
                ${disabled ? "opacity-40" : ""}
              `}
            >
              {valve.label}
            </div>
          );
        })}
      </div>

      {/* Fora do div com touch handlers para o click funcionar normalmente */}
      <button
        disabled={disabled}
        onClick={onSubmit}
        className={`
          rounded-xl border-2 px-10 py-3 text-base font-semibold
          transition-all duration-75
          ${
            disabled
              ? "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#cd7f32]/30 opacity-40"
              : "border-[#d4a853]/70 bg-[#d4a853]/10 text-[#d4a853] active:bg-[#d4a853]/25"
          }
        `}
      >
        Confirmar
      </button>
    </div>
  );
}
