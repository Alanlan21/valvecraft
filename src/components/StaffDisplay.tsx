import { useEffect, useRef, useId } from "react";
import * as VF from "vexflow";
import type { Note, TrumpetType } from "../types";
import {
  formatQuizNoteLabel,
  getQuizDisplayFrequency,
} from "../utils/noteUtils";
import { useNomenclature } from "../contexts/NomenclatureContext";

interface StaffDisplayProps {
  note: Note | null;
  trumpetType: TrumpetType;
  /** When true, hides the note name and frequency label above the staff. */
  hideLabel?: boolean;
}

function createStaveNote(key: string): VF.StaveNote {
  const vfNote = new VF.StaveNote({ keys: [key], duration: "w" });
  const accidental = key.match(/^[a-g]([#b]+)\//i)?.[1];

  if (accidental) {
    try {
      vfNote.addModifier(new VF.Accidental(accidental), 0);
    } catch {
      // Ignore API variation issues and keep the note visible.
    }
  }

  return vfNote;
}

export function StaffDisplay({
  note,
  trumpetType,
  hideLabel = false,
}: StaffDisplayProps) {
  const containerId = useId();
  const stableId = `vf-staff-${containerId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const nomenclature = useNomenclature();

  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;

    let ro: ResizeObserver | null = null;
    let windowListener: ((e?: Event) => void) | null = null;
    let rendererRef: VF.Renderer | null = null;

    const render = () => {
      if (!div) return;
      if (!note) {
        div.innerHTML = "";
        return;
      }

      // Clear previous render
      div.innerHTML = "";

      const VF_HEIGHT = 160;
      const containerWidth = Math.max(220, Math.round(div.clientWidth));

      // Create renderer and context
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(containerWidth, VF_HEIGHT);
      rendererRef = renderer;
      const context = renderer.getContext();

      // Draw a stave that spans the available width
      const margin = 10;
      const staveWidth = Math.max(200, containerWidth - margin * 2);
      const stave = new VF.Stave(margin, 20, staveWidth);
      stave.addClef("treble");
      stave.setContext(context).draw();

      const vfNote = createStaveNote(note.vexflowKey);

      // Build voice + formatter
      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables([vfNote]);
      new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
      voice.draw(context, stave);

      // Style SVG to match theme and ensure it scales
      const svg = div.querySelector("svg");
      if (svg) {
        svg.setAttribute("viewBox", `0 0 ${containerWidth} ${VF_HEIGHT}`);
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.overflow = "visible";

        const elements = svg.querySelectorAll("path, text, line, rect");
        elements.forEach((el) => {
          (el as SVGElement).style.fill = "#fffff0";
          (el as SVGElement).style.stroke = "#fffff0";
        });
        const lines = svg.querySelectorAll(".vf-stave line, .vf-stave path");
        lines.forEach((el) => {
          (el as SVGElement).style.strokeWidth = "1";
        });
      }
    };

    // Initial render
    render();

    // Re-render on container resize
    if (typeof window !== "undefined") {
      if ("ResizeObserver" in window) {
        ro = new ResizeObserver(() => render());
        ro.observe(div);
      } else {
        windowListener = () => render();
        // Use globalThis to satisfy TS types
        globalThis.addEventListener("resize", windowListener as EventListener);
      }
    }

    return () => {
      ro?.disconnect();
      if (windowListener && typeof window !== "undefined") {
        globalThis.removeEventListener(
          "resize",
          windowListener as EventListener,
        );
      }
      try {
        // destroy renderer if available
        (rendererRef as any)?.destroy?.();
      } catch {}
    };
  }, [note, stableId]);

  const noteHeading = note ? formatQuizNoteLabel(note, nomenclature) : "";
  const frequency = note ? getQuizDisplayFrequency(note, trumpetType) : null;

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-140 rounded-xl bg-[#16213e] p-4 shadow-lg shadow-black/30">
        {note && !hideLabel && (
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-1 pb-3 text-center">
            <span className="text-[clamp(1.5rem,3vw,2.35rem)] font-medium tracking-[0.02em] text-[#fffff0]">
              {noteHeading}
            </span>
            {frequency !== null && (
              <span className="pb-0.5 text-sm font-normal tracking-[0.08em] text-[#fffff0]/55 sm:text-base">
                ({frequency}Hz)
              </span>
            )}
          </div>
        )}
        <div id={stableId} ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
