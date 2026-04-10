import { useEffect, useRef, useId } from "react";
import { Vex } from "vexflow";
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
    if (!div || !note) return;

    // Clear previous render
    div.innerHTML = "";

    const { Factory } = Vex.Flow;

    const vf = new Factory({
      renderer: { elementId: stableId, width: 260, height: 180 },
    });

    const score = vf.EasyScore();
    const system = vf.System();

    // Build the note string for EasyScore
    // VexFlow EasyScore format: "C#5/w" (note/duration)
    const noteKey = note.vexflowKey.replace("/", "");
    // e.g. "c#4" → "C#4" — EasyScore is case-insensitive but let's keep it clean
    const easyScoreNote = `${noteKey}/w`;

    system
      .addStave({
        voices: [score.voice(score.notes(easyScoreNote, { stem: "up" }))],
      })
      .addClef("treble");

    vf.draw();

    // Style SVG to match theme
    const svg = div.querySelector("svg");
    if (svg) {
      svg.style.overflow = "visible";
      // Color all paths and text to ivory
      const elements = svg.querySelectorAll("path, text, line, rect");
      elements.forEach((el) => {
        (el as SVGElement).style.fill = "#fffff0";
        (el as SVGElement).style.stroke = "#fffff0";
      });
      // Make staff lines thinner
      const lines = svg.querySelectorAll(".vf-stave line, .vf-stave path");
      lines.forEach((el) => {
        (el as SVGElement).style.strokeWidth = "1";
      });
    }
  }, [note, stableId]);

  return (
    <div className="flex items-center justify-center">
      <div
        id={stableId}
        ref={containerRef}
        className="rounded-xl bg-[#16213e] p-4 shadow-lg shadow-black/30"
      />
    </div>
  );
}
