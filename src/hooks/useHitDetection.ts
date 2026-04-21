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
  // Janela de acerto mais generosa para priorizar treino educativo.
  perfect: 0.1,
  good: 0.22,
  miss: 0.34,
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

function getJudgment(timingOffset: number): HitJudgment {
  return Math.abs(timingOffset) <= TIMING_WINDOWS_VALUES.good
    ? "perfect"
    : "miss";
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
  const wrongAttemptedRef = useRef<Set<number>>(new Set());

  const checkNotes = useCallback((): NoteHitResult[] => {
    if (!isPlaying) return [];

    const fired: NoteHitResult[] = [];

    for (let i = 0; i < sheet.notes.length; i++) {
      if (processedRef.current.has(i)) continue;

      const note = sheet.notes[i];
      const expected = getExpectedFingering(note);
      if (!expected) continue;

      const offset = currentBeat - note.startBeat;

      // Allow a forgiving educational window around the beat.
      if (
        offset >= -TIMING_WINDOWS_VALUES.good &&
        offset <= TIMING_WINDOWS_VALUES.good
      ) {
        if (currentFingering && fingeringsMatch(currentFingering, expected)) {
          const judgment = getJudgment(offset);
          if (judgment !== "miss") {
            const result: NoteHitResult = {
              note,
              noteIndex: i,
              judgment,
              timingOffset: offset,
              points: JUDGMENT_POINTS_VALUES[judgment],
            };
            processedRef.current.add(i);
            wrongAttemptedRef.current.delete(i);
            resultsRef.current.set(i, result);
            fired.push(result);
            onNoteResult?.(result);
          }
        } else if (currentFingering) {
          wrongAttemptedRef.current.add(i);
        }
        continue;
      }

      // After the full late window, finalize the note.
      if (offset > TIMING_WINDOWS_VALUES.miss) {
        const judgment = wrongAttemptedRef.current.has(i)
          ? "wrong_fingering"
          : "miss";
        const result: NoteHitResult = {
          note,
          noteIndex: i,
          judgment,
          timingOffset: offset,
          points: JUDGMENT_POINTS_VALUES[judgment],
        };
        processedRef.current.add(i);
        wrongAttemptedRef.current.delete(i);
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
    wrongAttemptedRef.current = new Set();
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
