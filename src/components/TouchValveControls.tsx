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
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex gap-4">
        {VALVES.map((valve) => {
          const pressed = currentInput.valves[valve.index];
          return (
            <button
              key={valve.index}
              disabled={disabled}
              onClick={() => onValveChange(valve.index, !pressed)}
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
            </button>
          );
        })}
      </div>

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
