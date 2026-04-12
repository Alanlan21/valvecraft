import type { ControlAction, ControlBindings, Fingering } from "../types";

interface ValveIndicatorProps {
  controlBindings: ControlBindings;
  currentInput: Fingering;
  expected?: Fingering | null;
  showExpected?: boolean;
}

const VALVES: { action: ControlAction; index: 0 | 1 | 2; label: string }[] = [
  { action: "valve1", index: 0, label: "1" },
  { action: "valve2", index: 1, label: "2" },
  { action: "valve3", index: 2, label: "3" },
];

export function ValveIndicator({
  controlBindings,
  currentInput,
  expected,
  showExpected,
}: ValveIndicatorProps) {
  return (
    <div className="flex items-end gap-6">
      {/* Valves */}
      <div className="flex gap-3">
        {VALVES.map((valve) => {
          const pressed = currentInput.valves[valve.index];
          const isExpected = showExpected && expected?.valves[valve.index];

          return (
            <div key={valve.action} className="flex flex-col items-center gap-2">
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
                {valve.label} ({controlBindings[valve.action].label})
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
        <span className="text-xs font-mono text-[#cd7f32]/70">
          {controlBindings.slide.label}
        </span>
      </div>
    </div>
  );
}
