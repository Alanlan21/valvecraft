import type { Fingering } from "../types";

interface ValveIndicatorProps {
  currentInput: Fingering;
  expected?: Fingering | null;
  showExpected?: boolean;
}

const VALVE_LABELS = ["1 (Q)", "2 (W)", "3 (E)"];

export function ValveIndicator({
  currentInput,
  expected,
  showExpected,
}: ValveIndicatorProps) {
  return (
    <div className="flex items-end gap-6">
      {/* Valves */}
      <div className="flex gap-3">
        {VALVE_LABELS.map((label, i) => {
          const pressed = currentInput.valves[i];
          const isExpected = showExpected && expected?.valves[i];

          return (
            <div key={label} className="flex flex-col items-center gap-2">
              {/* Valve cap */}
              <div
                className={`
                  h-8 w-8 rounded-full border-2 transition-all duration-75
                  ${
                    pressed
                      ? "translate-y-2 border-[#d4a853] bg-[#d4a853] shadow-[0_0_12px_#d4a853]"
                      : "border-[#cd7f32]/50 bg-[#2a2a4a]"
                  }
                  ${
                    isExpected && !pressed
                      ? "ring-2 ring-red-400 ring-offset-1 ring-offset-[#1a1a2e]"
                      : ""
                  }
                `}
              />
              {/* Valve body */}
              <div
                className={`
                  h-16 w-6 rounded-b-lg border border-t-0 transition-all duration-75
                  ${
                    pressed
                      ? "border-[#d4a853]/60 bg-gradient-to-b from-[#d4a853]/30 to-[#cd7f32]/20"
                      : "border-[#cd7f32]/30 bg-gradient-to-b from-[#2a2a4a] to-[#1a1a2e]"
                  }
                `}
              />
              {/* Label */}
              <span className="text-xs font-mono text-[#cd7f32]/70">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Slide indicator */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={`
            flex h-8 w-16 items-center justify-center rounded-md border-2 
            text-xs font-bold transition-all duration-75
            ${
              currentInput.slide
                ? "border-[#d4a853] bg-[#d4a853] text-[#1a1a2e] shadow-[0_0_12px_#d4a853]"
                : "border-[#cd7f32]/50 bg-[#2a2a4a] text-[#cd7f32]/50"
            }
            ${
              showExpected && expected?.slide && !currentInput.slide
                ? "ring-2 ring-red-400 ring-offset-1 ring-offset-[#1a1a2e]"
                : ""
            }
          `}
        >
          SLIDE
        </div>
        <div
          className={`
            h-16 w-12 rounded-b-lg border border-t-0 transition-all duration-75
            ${
              currentInput.slide
                ? "translate-x-1 border-[#d4a853]/60 bg-gradient-to-b from-[#d4a853]/20 to-transparent"
                : "border-[#cd7f32]/30 bg-gradient-to-b from-[#2a2a4a] to-[#1a1a2e]"
            }
          `}
        />
        <span className="text-xs font-mono text-[#cd7f32]/70">⇧ Shift</span>
      </div>
    </div>
  );
}
