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

export function SheetMusicDisplay({
  sheet,
  currentBeat,
  noteResults = new Map(),
  showPlayhead = true,
  height = 200,
}: SheetMusicDisplayProps) {
  const containerId = useId();
  const stableId = `vf-sheet-${containerId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  // Store notehead X spans for precise playhead alignment.
  const notePositionsRef = useRef<
    Map<number, { startX: number; endX: number }>
  >(new Map());
  // Store refs to SVG note groups for efficient coloring
  const noteGroupsRef = useRef<Element[]>([]);

  // Memoize grouped notes
  const notesByMeasure = useMemo(
    () => groupNotesByMeasure(sheet.notes),
    [sheet.notes],
  );

  // ── VexFlow full render ────────────────────────────────────────────────────
  // Only runs when sheet/height change, NOT on every beat tick.
  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;

    let ro: ResizeObserver | null = null;

    const render = () => {
      if (!div) return;

      div.innerHTML = "";
      notePositionsRef.current.clear();
      noteGroupsRef.current = [];

      const containerWidth = Math.max(400, Math.round(div.clientWidth));
      const VF_HEIGHT = height;

      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(containerWidth, VF_HEIGHT);
      const context = renderer.getContext();

      const margin = 20;
      const staveWidth = containerWidth - margin * 2;

      const stave = new VF.Stave(margin, 30, staveWidth);
      stave.addClef("treble");
      stave.addTimeSignature(
        `${sheet.timeSignature.beats}/${sheet.timeSignature.beatValue}`,
      );
      stave.setContext(context).draw();

      const allVfNotes: VF.StaveNote[] = [];

      let noteIndex = 0;
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
            noteIndex++;
          } catch (e) {
            console.warn("Failed to create note:", note, e);
          }
        }
      }

      if (allVfNotes.length === 0) return;

      const totalBeats = sheet.notes.reduce(
        (max, n) => Math.max(max, n.startBeat + n.duration),
        0,
      );

      const voice = new VF.Voice({
        num_beats: Math.ceil(totalBeats),
        beat_value: sheet.timeSignature.beatValue,
      });
      voice.setStrict(false);
      voice.addTickables(allVfNotes);

      new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 80);
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
        svg.setAttribute("viewBox", `0 0 ${containerWidth} ${VF_HEIGHT}`);
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.overflow = "visible";

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
      ro.observe(div);
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

  // ── Playhead position ──────────────────────────────────────────────────────
  // Runs every beat tick but only mutates a single DOM property — no React
  // re-render triggered. Uses anchor-based linear interpolation between note
  // center X positions so the line moves at perfectly constant speed.
  useLayoutEffect(() => {
    const el = playheadRef.current;
    if (!el || !showPlayhead) return;

    if (currentBeat < 0) {
      el.style.display = "none";
      return;
    }

    const positions = notePositionsRef.current;
    const notes = sheet.notes;

    if (positions.size === 0 || notes.length === 0) {
      el.style.display = "none";
      return;
    }

    // Build anchors: beat → center X of the notehead, not the full glyph box.
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
      el.style.display = "none";
      return;
    }

    let targetX: number;

    if (currentBeat <= anchors[0].beat) {
      targetX = anchors[0].cx;
    } else if (currentBeat >= anchors[anchors.length - 1].beat) {
      // Past last note: extrapolate using last inter-note pixel-per-beat rate
      const last = anchors[anchors.length - 1];
      const lastNote = notes[notes.length - 1];
      if (anchors.length >= 2) {
        const prev = anchors[anchors.length - 2];
        const pxPerBeat = (last.cx - prev.cx) / (last.beat - prev.beat);
        const endBeat = lastNote.startBeat + lastNote.duration;
        targetX =
          last.cx +
          pxPerBeat * Math.min(currentBeat - last.beat, endBeat - last.beat);
      } else {
        targetX = last.cx;
      }
    } else {
      // Find the two bracketing anchors and lerp linearly in time
      let i = 1;
      while (i < anchors.length && anchors[i].beat <= currentBeat) i++;
      const a = anchors[i - 1];
      const b = anchors[i];
      const t = (currentBeat - a.beat) / (b.beat - a.beat);
      targetX = a.cx + t * (b.cx - a.cx);
    }

    // Compute pxPerBeat from consecutive note anchors
    let pxPerBeat = 80; // fallback
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

    // ── Zone geometry ──────────────────────────────────────────────────────
    // Symmetric zone centered on the note beat (offset = 0 = spine).
    //
    // Duas constantes para ajustar manualmente:
    //   HALF_BEATS   — metade da largura total da zona em beats (cada lado).
    //                  Maior = zona mais larga visualmente.
    //   DETECT_BEATS — metade da janela de detecção (deve bater com
    //                  TIMING_WINDOWS_VALUES.perfect em useHitDetection.ts).
    //                  Controla a largura do verde.
    //
    // Layout resultante:
    //   [transparente] [AMARELO] [VERDE] [SPINE] [VERDE] [AMARELO] [transparente]
    //   0%          5%        33%      50%      67%      95%      100%
    //
    // ── Correção de offset CSS ─────────────────────────────────────────────
    // O playheadRef é posicionado relativamente ao div.relative externo, mas
    // as coordenadas do VexFlow são relativas ao containerRef (que fica dentro
    // do p-4 com 16px de padding). containerRef.offsetLeft mede esse desvio.
    const xOrigin = containerRef.current?.offsetLeft ?? 0;

    // HALF_BEATS: metade da largura total da zona em beats (cada lado).
    // Deve ser igual a TIMING_WINDOWS_VALUES.perfect em useHitDetection.ts
    // para que a zona verde cubra exatamente a janela de detecção.
    const HALF_BEATS = 0.3; // ← ajuste aqui (deve bater com perfect em useHitDetection.ts)

    const halfPx = HALF_BEATS * pxPerBeat;
    const totalWidth = halfPx * 2;

    el.style.display = "block";
    el.style.left = `${xOrigin + targetX - halfPx}px`;
    el.style.width = `${totalWidth}px`;
    // Zona toda verde = janela de detecção inteira visível
    el.style.background = [
      "linear-gradient(to right",
      "transparent",
      `rgba(34,197,94,0.55) 5%`,
      `rgba(34,197,94,0.75) 30%`,
      `rgba(34,197,94,0.75) 70%`,
      `rgba(34,197,94,0.55) 95%`,
      "transparent)",
    ].join(", ");
  }, [currentBeat, showPlayhead, sheet.notes]);

  return (
    <div className="relative">
      <div className="rounded-xl bg-[#16213e] p-4 shadow-lg shadow-black/30 w-full">
        <div id={stableId} ref={containerRef} className="w-full relative" />

        {/* Timing zone — width/position/gradient controlled via useLayoutEffect */}
        {showPlayhead && (
          <div
            ref={playheadRef}
            className="absolute top-0 pointer-events-none z-10"
            style={{
              height: `${height}px`,
              marginTop: "16px",
              display: "none",
            }}
          >
            {/* Spine = offset 0 = centro exato da zona (50%) */}
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
