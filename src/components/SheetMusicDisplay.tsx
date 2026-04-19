/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useLayoutEffect, useRef, useId, useMemo } from "react";
import * as VF from "vexflow";
import type {
  Sheet,
  SheetNote,
  NoteHitResult,
  HitJudgment,
} from "../types/sheet";

interface SheetMusicDisplayProps {
  /** The sheet to render */
  sheet: Sheet;
  /** Current beat position (for playhead) */
  currentBeat: number;
  /** Results for each note (to show hit/miss feedback) */
  noteResults?: Map<number, NoteHitResult>;
  /** Whether to show the playhead */
  showPlayhead?: boolean;
  /** Height of the display */
  height?: number;
}

// VexFlow duration mapping
const DURATION_MAP: Record<number, string> = {
  4: "w", // whole note
  2: "h", // half note
  1: "q", // quarter note
  0.5: "8", // eighth note
  0.25: "16", // sixteenth note
};

// Colors for note feedback
const JUDGMENT_COLORS: Record<HitJudgment | "pending" | "upcoming", string> = {
  perfect: "#22c55e", // green-500
  miss: "#ef4444", // red-500
  wrong_fingering: "#f97316", // orange-500
  pending: "#fffff0", // cream (default)
  upcoming: "#94a3b8", // slate-400
};

/**
 * Convert a SheetNote to VexFlow format
 */
function noteToVexflow(note: SheetNote): { key: string; duration: string } {
  const key = note.pitch.vexflowKey;
  const duration = DURATION_MAP[note.duration] || "q";
  return { key, duration };
}

/**
 * Get accidental from a VexFlow key
 */
function getAccidental(key: string): string | null {
  const match = key.match(/^[a-g]([#b]+)\//i);
  return match?.[1] ?? null;
}

/**
 * Group notes by measure for rendering
 */
function groupNotesByMeasure(notes: SheetNote[]): Map<number, SheetNote[]> {
  const groups = new Map<number, SheetNote[]>();

  for (const note of notes) {
    const existing = groups.get(note.measure) || [];
    existing.push(note);
    groups.set(note.measure, existing);
  }

  return groups;
}

// Minimum pixels per beat when expanding the stave for longer songs.
// Increase this to make notes more spread out.
const MIN_PX_PER_BEAT = 60;

// Fraction of the outer container width where the timing spine is fixed.
// 0.35 = 35% from the left edge of the outer div.
const SPINE_FRACTION = 0.35;

export function SheetMusicDisplay({
  sheet,
  currentBeat,
  noteResults = new Map(),
  showPlayhead = true,
  height = 200,
}: SheetMusicDisplayProps) {
  const containerId = useId();
  const stableId = `vf-sheet-${containerId.replace(/:/g, "")}`;
  const outerRef = useRef<HTMLDivElement>(null); // outer clip container
  const containerRef = useRef<HTMLDivElement>(null); // scrolling inner container
  const playheadRef = useRef<HTMLDivElement>(null);

  // Store notehead X spans for precise playhead alignment.
  const notePositionsRef = useRef<
    Map<number, { startX: number; endX: number }>
  >(new Map());
  // Store refs to SVG note groups for efficient coloring
  const noteGroupsRef = useRef<Element[]>([]);
  // Natural width of the SVG (set during render, read during scroll)
  const svgNaturalWidthRef = useRef<number>(0);

  // Memoize grouped notes
  const notesByMeasure = useMemo(
    () => groupNotesByMeasure(sheet.notes),
    [sheet.notes],
  );

  // ── VexFlow full render ────────────────────────────────────────────────────
  // Only runs when sheet/height change, NOT on every beat tick.
  useEffect(() => {
    const div = containerRef.current;
    const outer = outerRef.current;
    if (!div || !outer) return;

    let ro: ResizeObserver | null = null;

    const render = () => {
      if (!div || !outer) return;

      div.innerHTML = "";
      notePositionsRef.current.clear();
      noteGroupsRef.current = [];

      const outerWidth = Math.max(400, Math.round(outer.clientWidth));
      const VF_HEIGHT = height;

      // Compute natural SVG width: at least outerWidth, but expands so each
      // beat has at least MIN_PX_PER_BEAT pixels.
      const totalBeats = sheet.notes.reduce(
        (max, n) => Math.max(max, n.startBeat + n.duration),
        0,
      );
      // Extra left space so the first note starts at ~SPINE_FRACTION of outer
      const leadInPx = Math.round(outerWidth * SPINE_FRACTION);
      const musicWidth = Math.max(
        outerWidth - leadInPx,
        Math.ceil(totalBeats * MIN_PX_PER_BEAT),
      );
      const naturalWidth = leadInPx + musicWidth + 40; // trailing margin

      svgNaturalWidthRef.current = naturalWidth;

      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(naturalWidth, VF_HEIGHT);
      const context = renderer.getContext();

      const staveLeft = leadInPx;
      const staveWidth = musicWidth;

      const stave = new VF.Stave(staveLeft, 30, staveWidth);
      stave.addClef("treble");
      stave.addTimeSignature(
        `${sheet.timeSignature.beats}/${sheet.timeSignature.beatValue}`,
      );
      stave.setContext(context).draw();

      const allVfNotes: VF.StaveNote[] = [];
      // Parallel array: which SheetNote corresponds to each VF.StaveNote
      const allSheetNotesFlat: SheetNote[] = [];

      for (const [, measureNotes] of notesByMeasure) {
        for (const note of measureNotes) {
          const { key, duration } = noteToVexflow(note);
          try {
            const vfNote = new VF.StaveNote({
              keys: [key],
              duration,
              auto_stem: true,
            });
            const acc = getAccidental(key);
            if (acc) vfNote.addModifier(new VF.Accidental(acc), 0);
            allVfNotes.push(vfNote);
            allSheetNotesFlat.push(note);
          } catch (e) {
            console.warn("Failed to create note:", note, e);
          }
        }
      }

      if (allVfNotes.length === 0) return;

      const voice = new VF.Voice({
        num_beats: Math.ceil(totalBeats),
        beat_value: sheet.timeSignature.beatValue,
      });
      voice.setStrict(false);
      voice.addTickables(allVfNotes);

      new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 80);

      // ── Proportional spacing ───────────────────────────────────────────────
      // VexFlow's default formatter places all notes at equal horizontal
      // intervals regardless of duration. We fix this by shifting each note
      // to a position proportional to its startBeat so the playhead moves
      // at constant visual speed regardless of note value.
      if (allVfNotes.length >= 2) {
        const firstNoteX = allVfNotes[0].getAbsoluteX();
        const firstBeat = allSheetNotesFlat[0].startBeat;
        // Available space from first notehead to the right margin of the stave
        const staveRightX = staveLeft + staveWidth - 40;
        const availablePx = staveRightX - firstNoteX;
        const availableBeats = totalBeats - firstBeat;

        if (availableBeats > 0) {
          const pxPerBeat = availablePx / availableBeats;
          allVfNotes.forEach((vfNote, i) => {
            const targetX =
              firstNoteX +
              (allSheetNotesFlat[i].startBeat - firstBeat) * pxPerBeat;
            const currentX = vfNote.getAbsoluteX();
            vfNote.setXShift(targetX - currentX);
          });
        }
      }

      voice.draw(context, stave);

      // Store notehead spans for playhead alignment.
      allVfNotes.forEach((vfNote, i) => {
        const noteWithHeadMetrics = vfNote as VF.StaveNote & {
          getNoteHeadBeginX?: () => number;
          getNoteHeadEndX?: () => number;
        };

        const startX = noteWithHeadMetrics.getNoteHeadBeginX?.();
        const endX = noteWithHeadMetrics.getNoteHeadEndX?.();

        if (startX !== undefined && endX !== undefined) {
          notePositionsRef.current.set(i, { startX, endX });
          return;
        }

        const box = vfNote.getBoundingBox();
        if (box) {
          notePositionsRef.current.set(i, {
            startX: box.x,
            endX: box.x + box.w,
          });
        }
      });

      // Apply default styling
      const svg = div.querySelector("svg");
      if (svg) {
        svg.setAttribute("viewBox", `0 0 ${naturalWidth} ${VF_HEIGHT}`);
        svg.style.width = `${naturalWidth}px`;
        svg.style.height = `${VF_HEIGHT}px`;
        svg.style.overflow = "visible";
        svg.style.display = "block";

        svg.querySelectorAll(".vf-stave path, .vf-stave line").forEach((el) => {
          (el as SVGElement).style.fill = "none";
          (el as SVGElement).style.stroke = "#fffff0";
          (el as SVGElement).style.strokeWidth = "1";
        });
        svg.querySelectorAll("text").forEach((el) => {
          el.style.fill = "#fffff0";
        });

        // Store note group elements and apply default color
        const groups = svg.querySelectorAll(".vf-stavenote");
        noteGroupsRef.current = Array.from(groups);
        groups.forEach((group) => {
          group.querySelectorAll("path").forEach((path) => {
            (path as SVGPathElement).style.fill = JUDGMENT_COLORS.pending;
            (path as SVGPathElement).style.stroke = JUDGMENT_COLORS.pending;
          });
        });
      }
    };

    render();

    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => render());
      ro.observe(outer);
    }

    return () => {
      ro?.disconnect();
    };
  }, [sheet, notesByMeasure, height]);

  // ── Note coloring ──────────────────────────────────────────────────────────
  // Only runs when noteResults changes, not on every beat tick.
  useEffect(() => {
    const groups = noteGroupsRef.current;
    if (groups.length === 0) return;

    groups.forEach((group, i) => {
      const result = noteResults.get(i);
      const color = result
        ? JUDGMENT_COLORS[result.judgment]
        : JUDGMENT_COLORS.pending;
      group.querySelectorAll("path").forEach((path) => {
        (path as SVGPathElement).style.fill = color;
        (path as SVGPathElement).style.stroke = color;
      });
    });
  }, [noteResults]);

  // ── Auto-scroll + zone ────────────────────────────────────────────────────
  // Runs every beat tick but only mutates transform/style — no React re-render.
  // Strategy (Option A): the SVG is wider than the screen. Instead of moving
  // the playhead, we slide the SVG container left so the current note always
  // aligns with the fixed SPINE_FRACTION position on screen.
  useLayoutEffect(() => {
    const inner = containerRef.current;
    const outer = outerRef.current;
    const zone = playheadRef.current;
    if (!inner || !outer || !showPlayhead) return;

    const positions = notePositionsRef.current;
    const notes = sheet.notes;

    if (positions.size === 0 || notes.length === 0) {
      if (zone) zone.style.display = "none";
      return;
    }

    // Build anchors: beat → center X of the notehead in SVG coordinates.
    const anchors: Array<{ beat: number; cx: number }> = [];
    for (let i = 0; i < notes.length; i++) {
      const pos = positions.get(i);
      if (pos)
        anchors.push({
          beat: notes[i].startBeat,
          cx: (pos.startX + pos.endX) / 2,
        });
    }

    if (anchors.length === 0) {
      if (zone) zone.style.display = "none";
      return;
    }

    // pxPerBeat — average spacing between consecutive note anchors.
    let pxPerBeat = MIN_PX_PER_BEAT;
    if (anchors.length >= 2) {
      let totalPx = 0;
      let totalBeats = 0;
      for (let i = 1; i < anchors.length; i++) {
        const dp = anchors[i].cx - anchors[i - 1].cx;
        const db = anchors[i].beat - anchors[i - 1].beat;
        if (db > 0 && dp > 0) {
          totalPx += dp;
          totalBeats += db;
        }
      }
      if (totalBeats > 0) pxPerBeat = totalPx / totalBeats;
    }

    // Compute current X in SVG space (same logic as before: lerp + extrapolate).
    let noteX: number;
    const first = anchors[0];
    const last = anchors[anchors.length - 1];

    if (currentBeat < first.beat) {
      noteX =
        anchors.length >= 2
          ? first.cx + pxPerBeat * (currentBeat - first.beat)
          : first.cx;
    } else if (currentBeat > last.beat) {
      const lastNote = notes[notes.length - 1];
      const endBeat = lastNote.startBeat + lastNote.duration;
      noteX =
        last.cx +
        pxPerBeat * Math.min(currentBeat - last.beat, endBeat - last.beat);
    } else {
      let i = 1;
      while (i < anchors.length && anchors[i].beat <= currentBeat) i++;
      const a = anchors[i - 1];
      const b = anchors[i];
      const t = (currentBeat - a.beat) / (b.beat - a.beat);
      noteX = a.cx + t * (b.cx - a.cx);
    }

    // Translate the inner container so that `noteX` in SVG space maps to
    // SPINE_FRACTION * outerWidth on screen.
    const outerWidth = outer.clientWidth;
    const spineScreenX = outerWidth * SPINE_FRACTION;
    const translateX = spineScreenX - noteX;
    inner.style.transform = `translateX(${translateX}px)`;

    // ── Zone overlay (fixed in outer-relative space) ───────────────────────
    if (zone) {
      const HALF_BEATS = 0.22;
      const DETECT_BEATS = 0.08;

      const halfPx = HALF_BEATS * pxPerBeat;
      const totalWidth = halfPx * 2;

      const pGreenStart = (
        ((HALF_BEATS - DETECT_BEATS) / (HALF_BEATS * 2)) *
        100
      ).toFixed(1);
      const pGreenEnd = (100 - parseFloat(pGreenStart)).toFixed(1);

      zone.style.display = "block";
      // Center zone on the spine screen position
      zone.style.left = `${spineScreenX - halfPx}px`;
      zone.style.width = `${totalWidth}px`;
      zone.style.background = [
        "linear-gradient(to right",
        "transparent",
        `rgba(234,179,8,0.50) 5%`,
        `rgba(234,179,8,0.50) ${pGreenStart}%`,
        `rgba(34,197,94,0.80) ${pGreenStart}%`,
        `rgba(34,197,94,0.80) ${pGreenEnd}%`,
        `rgba(234,179,8,0.50) ${pGreenEnd}%`,
        `rgba(234,179,8,0.50) 95%`,
        "transparent)",
      ].join(", ");
    }
  }, [currentBeat, showPlayhead, sheet.notes]);

  return (
    <div className="relative">
      {/* Outer clipping container — overflow hidden so the SVG scrolls behind */}
      <div
        ref={outerRef}
        className="rounded-xl bg-[#16213e] shadow-lg shadow-black/30 w-full overflow-hidden"
        style={{ height: `${height}px`, position: "relative" }}
      >
        {/* Inner scrolling container — translated by useLayoutEffect */}
        <div
          id={stableId}
          ref={containerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            willChange: "transform",
          }}
        />

        {/* Timing zone — fixed in outer-relative space, centered on SPINE_FRACTION */}
        {showPlayhead && (
          <div
            ref={playheadRef}
            className="absolute top-0 pointer-events-none z-10"
            style={{ height: `${height}px`, display: "none" }}
          >
            {/* Spine line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500"
              style={{ left: "50%", transform: "translateX(-50%)" }}
            />
          </div>
        )}
      </div>

      {/* Progress info */}
      <div className="flex justify-between mt-2 text-sm text-slate-400 px-2">
        <span>
          Compasso{" "}
          {Math.max(1, Math.ceil(currentBeat / sheet.timeSignature.beats))} /{" "}
          {sheet.totalMeasures}
        </span>
        <span>Beat {Math.max(0, Math.floor(currentBeat) + 1)}</span>
      </div>
    </div>
  );
}
