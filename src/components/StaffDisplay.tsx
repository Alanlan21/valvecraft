import { useEffect, useRef, useId } from "react";
import * as VF from "vexflow";
import type { Note } from "../types";

interface StaffDisplayProps {
  note: Note | null;
}

export function StaffDisplay({ note }: StaffDisplayProps) {
  const containerId = useId();
  const stableId = `vf-staff-${containerId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Create the visible note
      const key = note.vexflowKey; // already in 'c/4' or 'c#/4' form
      const vfNote = new VF.StaveNote({ keys: [key], duration: "w" });
      // Add accidental if present in key (format: "noteLetter[accidental]/octave", e.g. "bb/3")
      // Capture only the accidental chars AFTER the first letter to avoid double-counting note names.
      const acc = key.match(/^[a-g]([#b]+)\//i)?.[1];
      if (acc) {
        try {
          // VexFlow v4 uses addModifier to attach accidentals
          vfNote.addModifier(new VF.Accidental(acc), 0);
        } catch (e) {
          // ignore if API differs
        }
      }

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

  return (
    <div className="flex items-center justify-center">
      <div className="rounded-xl bg-[#16213e] p-4 shadow-lg shadow-black/30 w-full max-w-[560px]">
        <div id={stableId} ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
