import type { Note } from "./index";

/**
 * Time signature of a piece (e.g., 4/4, 3/4, 6/8)
 */
export interface TimeSignature {
  /** Number of beats per measure (numerator) */
  beats: number;
  /** Note value that gets one beat (denominator): 4 = quarter, 8 = eighth */
  beatValue: number;
}

/**
 * Duration of a note in beats
 * - 4 = whole note (semibreve)
 * - 2 = half note (mínima)
 * - 1 = quarter note (semínima)
 * - 0.5 = eighth note (colcheia)
 * - 0.25 = sixteenth note (semicolcheia)
 */
export type NoteDuration = 4 | 2 | 1 | 0.5 | 0.25;

/**
 * A single note in a sheet, with its position and duration
 */
export interface SheetNote {
  /** The pitch to play (references fingeringMap) */
  pitch: Note;
  /** When this note starts, in beats from the beginning (0-indexed) */
  startBeat: number;
  /** Duration in beats */
  duration: NoteDuration;
  /** Which measure this note belongs to (1-indexed for display) */
  measure: number;
}

/**
 * A rest (silence) in the sheet
 */
export interface SheetRest {
  /** When this rest starts, in beats from the beginning */
  startBeat: number;
  /** Duration in beats */
  duration: NoteDuration;
  /** Which measure this rest belongs to */
  measure: number;
}

/**
 * A complete sheet music piece or exercise
 */
export interface Sheet {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Composer or source (optional) */
  composer?: string;
  /** Beats per minute */
  bpm: number;
  /** Time signature */
  timeSignature: TimeSignature;
  /** All notes in chronological order */
  notes: SheetNote[];
  /** All rests (optional - can be inferred) */
  rests?: SheetRest[];
  /** Total number of measures */
  totalMeasures: number;
  /** Difficulty level */
  difficulty: "easy" | "medium" | "hard";
  /** Category for organization */
  category: "scale" | "exercise" | "melody" | "song";
}

/**
 * Result of a single note hit attempt
 */
export type HitJudgment = "perfect" | "miss" | "wrong_fingering";

/**
 * Result of attempting to hit a note
 */
export interface NoteHitResult {
  /** The note that was being targeted */
  note: SheetNote;
  /** Index of the note in the sheet */
  noteIndex: number;
  /** How well the player hit it */
  judgment: HitJudgment;
  /** Timing offset in beats (negative = early, positive = late) */
  timingOffset: number;
  /** Points earned for this hit */
  points: number;
}

/**
 * State of the rhythm mode game session
 */
export interface RhythmGameState {
  /** Currently playing sheet */
  sheet: Sheet;
  /** Is the playback running? */
  isPlaying: boolean;
  /** Current position in beats */
  currentBeat: number;
  /** Results for each note (indexed by note index) */
  noteResults: Map<number, NoteHitResult>;
  /** Total score */
  score: number;
  /** Current combo (consecutive good+ hits) */
  combo: number;
  /** Best combo achieved */
  bestCombo: number;
}

/**
 * Final results after completing a sheet
 */
export interface RhythmSessionResult {
  /** The sheet that was played */
  sheet: Sheet;
  /** Final score */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Count of each judgment type */
  judgments: {
    perfect: number;
    miss: number;
    wrongFingering: number;
  };
  /** Best combo achieved */
  bestCombo: number;
  /** Total time in ms */
  totalTimeMs: number;
}

/**
 * Timing windows for hit detection (in beats)
 * At 120 BPM, 0.1 beats ≈ 50ms
 */
export const TIMING_WINDOWS = {
  /** Perfect hit: within ±0.1 beats of the note */
  perfect: 0.1,
  /** Good hit: within ±0.2 beats of the note */
  good: 0.2,
  /** Miss window: beyond ±0.3 beats, note is considered missed */
  miss: 0.3,
} as const;

/**
 * Points awarded for each judgment type
 */
export const JUDGMENT_POINTS = {
  perfect: 100,
  miss: 0,
  wrong_fingering: 0,
} as const;
