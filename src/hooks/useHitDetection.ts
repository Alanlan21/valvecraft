import { useCallback, useRef } from "react";
import type { Fingering } from "../types";
import type {
  Sheet,
  SheetNote,
  NoteHitResult,
  HitJudgment,
} from "../types/sheet";
import { fingeringMap } from "../data/fingeringMap";

export const TIMING_WINDOWS_VALUES = {
  // Janela de detecção: ±0.1 beats. A zona visual no SheetMusicDisplay
  // é maior (±0.3) para avisar antecipadamente — só o centro verde detecta.
  perfect: 0.08,
  good: 0.2,
  miss: 0.1,
} as const;

export const JUDGMENT_POINTS_VALUES = {
  perfect: 100,
  miss: 0,
  wrong_fingering: 0,
} as const;

interface UseHitDetectionOptions {
  sheet: Sheet;
  currentBeat: number;
  isPlaying: boolean;
  currentFingering: Fingering | null;
  onNoteResult?: (result: NoteHitResult) => void;
}

interface HitDetectionActions {
  checkNotes: () => NoteHitResult[];
  reset: () => void;
  getAllResults: () => Map<number, NoteHitResult>;
}

function getExpectedFingering(note: SheetNote): Fingering | null {
  return fingeringMap[note.pitch.id] ?? null;
}

function fingeringsMatch(a: Fingering, b: Fingering): boolean {
  return (
    a.valves[0] === b.valves[0] &&
    a.valves[1] === b.valves[1] &&
    a.valves[2] === b.valves[2] &&
    a.slide === b.slide
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getJudgment(_timingOffset: number): HitJudgment {
  return "perfect"; // all hits inside the window are perfect
}

/**
 * Hold-to-Play hit detection.
 *
 * checkNotes() is called every frame (on beat tick AND on fingering change).
 * For each pending note:
 *   - playhead inside [startBeat - good, startBeat + miss] AND correct fingering => HIT
 *   - playhead past miss window => MISS
 */
export function useHitDetection({
  sheet,
  currentBeat,
  isPlaying,
  currentFingering,
  onNoteResult,
}: UseHitDetectionOptions): HitDetectionActions {
  const processedRef = useRef<Set<number>>(new Set());
  const resultsRef = useRef<Map<number, NoteHitResult>>(new Map());

  const checkNotes = useCallback((): NoteHitResult[] => {
    if (!isPlaying) return [];

    const fired: NoteHitResult[] = [];

    for (let i = 0; i < sheet.notes.length; i++) {
      if (processedRef.current.has(i)) continue;

      const note = sheet.notes[i];
      const expected = getExpectedFingering(note);
      if (!expected) continue;

      const offset = currentBeat - note.startBeat;

      // Hit window: exactly ±perfect around the note beat.
      // Yellow warning zone is visual-only; detection never fires there.
      if (
        offset >= -TIMING_WINDOWS_VALUES.perfect &&
        offset <= TIMING_WINDOWS_VALUES.perfect
      ) {
        if (currentFingering && fingeringsMatch(currentFingering, expected)) {
          const judgment = getJudgment(offset);
          const result: NoteHitResult = {
            note,
            noteIndex: i,
            judgment,
            timingOffset: offset,
            points: JUDGMENT_POINTS_VALUES[judgment],
          };
          processedRef.current.add(i);
          resultsRef.current.set(i, result);
          fired.push(result);
          onNoteResult?.(result);
        }
        continue;
      }

      // Past the perfect window = miss
      if (offset > TIMING_WINDOWS_VALUES.perfect) {
        const result: NoteHitResult = {
          note,
          noteIndex: i,
          judgment: "miss",
          timingOffset: offset,
          points: 0,
        };
        processedRef.current.add(i);
        resultsRef.current.set(i, result);
        fired.push(result);
        onNoteResult?.(result);
      }
    }

    return fired;
  }, [isPlaying, sheet.notes, currentBeat, currentFingering, onNoteResult]);

  const reset = useCallback(() => {
    processedRef.current = new Set();
    resultsRef.current = new Map();
  }, []);

  const getAllResults = useCallback(() => new Map(resultsRef.current), []);

  return { checkNotes, reset, getAllResults };
}

export function calculateSessionResults(
  sheet: Sheet,
  results: Map<number, NoteHitResult>,
  totalTimeMs: number,
) {
  let perfect = 0;
  let miss = 0;
  let wrongFingering = 0;
  let score = 0;

  results.forEach((result) => {
    score += result.points;
    switch (result.judgment) {
      case "perfect":
        perfect++;
        break;
      case "miss":
        miss++;
        break;
      case "wrong_fingering":
        wrongFingering++;
        break;
    }
  });

  const maxScore = sheet.notes.length * JUDGMENT_POINTS_VALUES.perfect;
  const accuracy = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    sheet,
    score,
    maxScore,
    accuracy,
    judgments: { perfect, miss, wrongFingering },
    bestCombo: 0,
    totalTimeMs,
  };
}
