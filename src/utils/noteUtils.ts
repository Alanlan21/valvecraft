import type {
  Note,
  GameMode,
  Fingering,
  AnswerQuality,
  TrumpetType,
} from "../types";
import { allNotes, fingeringMap } from "../data/fingeringMap";
import {
  getStreakTier,
  GOOD_THRESHOLD_MS,
  PERFECT_THRESHOLD_MS,
  TIME_GAIN_DECAY_EXPONENT,
  TIME_GAIN_GOOD_MS,
  TIME_GAIN_PERFECT_MS,
} from "./gameRules";

/** Range boundaries per difficulty level (by octave boundaries) */
const RANGE_BOUNDS: Record<
  GameMode["rangeLevel"],
  { min: string; max: string }
> = {
  beginner: { min: "C4", max: "G4" },
  intermediate: { min: "G3", max: "C5" },
  advanced: { min: "G3", max: "G5" },
};

/** Check if a note name (without octave) is natural */
function isNatural(name: string): boolean {
  return name.length === 1;
}

/** Check if a note name has a sharp */
function isSharp(name: string): boolean {
  return name.includes("#");
}

/** Check if a note name has a flat */
function isFlat(name: string): boolean {
  return name.includes("b") && name !== "B";
}

function getEnharmonicName(noteId: string): string | null {
  const pairs: Record<string, string> = {
    "G#3": "Ab",
    Ab3: "G#",
    "C#4": "Db",
    Db4: "C#",
    "D#4": "Eb",
    Eb4: "D#",
    "F#4": "Gb",
    Gb4: "F#",
    "G#4": "Ab",
    Ab4: "G#",
    "C#5": "Db",
    Db5: "C#",
    "D#5": "Eb",
    Eb5: "D#",
    "F#5": "Gb",
    Gb5: "F#",
  };

  return pairs[noteId] ?? null;
}

function buildNote(name: string, octave: number): Note {
  const baseName = name.replace("#", "").replace("b", "");
  const accidental = name.includes("#") ? "#" : name.includes("b") ? "b" : "";

  return {
    name,
    octave,
    vexflowKey: `${baseName.toLowerCase()}${accidental}/${octave}`,
    id: `${name}${octave}`,
  };
}

export function getEnharmonicNote(note: Note): Note | null {
  const enharmonicName = getEnharmonicName(note.id);
  return enharmonicName ? buildNote(enharmonicName, note.octave) : null;
}

export function formatQuizNoteLabel(note: Note): string {
  const enharmonic = getEnharmonicNote(note);
  return enharmonic ? `${note.name} / ${enharmonic.name}` : note.name;
}

const SEMITONES_BY_NOTE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  Bb: 10,
  B: 11,
};

export function getQuizDisplayFrequency(
  note: Note,
  trumpetType: TrumpetType,
): number {
  const concertSemitoneOffset = trumpetType === "Bb" ? -2 : 0;
  const semitone = SEMITONES_BY_NOTE[note.name];
  const midiNumber = (note.octave + 1) * 12 + semitone + concertSemitoneOffset;
  const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

  return Math.round(frequency);
}

/**
 * Get the subset of notes matching the selected game mode.
 * Filters by range (beginner/intermediate/advanced) and
 * by note type (natural/sharp/flat/chromatic).
 */
export function getNotesForMode(mode: GameMode): Note[] {
  const bounds = RANGE_BOUNDS[mode.rangeLevel];

  const minIdx = allNotes.findIndex((n) => n.id === bounds.min);
  const maxIdx = allNotes.findIndex((n) => n.id === bounds.max);
  const rangeNotes = allNotes.slice(minIdx, maxIdx + 1);

  switch (mode.noteType) {
    case "natural":
      return rangeNotes.filter((n) => isNatural(n.name));
    case "accidental":
      return rangeNotes.filter(
        (n) => isNatural(n.name) || isSharp(n.name) || isFlat(n.name),
      );
  }
}

/**
 * Pick a random note from the pool, avoiding the previous note.
 */
export function getRandomNote(notes: Note[], previousId?: string): Note {
  if (notes.length <= 1) return notes[0];

  const pool = previousId ? notes.filter((n) => n.id !== previousId) : notes;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * Reverse lookup: given a Fingering, find the note id whose valves match,
 * preferring the one closest in octave to `nearOctave`.
 * Ignores slide — same valves with/without slide still names the same pitch.
 * Returns null if no match found.
 */
export function fingeringToNoteId(
  fingering: Fingering,
  nearOctave: number,
): string | null {
  const matches = Object.entries(fingeringMap)
    .filter(
      ([, f]) =>
        f.valves[0] === fingering.valves[0] &&
        f.valves[1] === fingering.valves[1] &&
        f.valves[2] === fingering.valves[2],
    )
    .map(([id]) => ({
      id,
      octave: parseInt(id[id.length - 1]),
    }))
    // Deduplicate enharmonics (same id prefix, same octave)
    .filter((a, idx, arr) => arr.findIndex((b) => b.id === a.id) === idx);

  if (matches.length === 0) return null;

  // Pick the match closest in octave to the current note
  matches.sort(
    (a, b) => Math.abs(a.octave - nearOctave) - Math.abs(b.octave - nearOctave),
  );
  return matches[0].id;
}

/**
 * Calculate score for a single answer.
 * - Base: max(0, 3000 - timeMs) → faster = more points (cap at 3s)
 * - Streak multiplier: 1 + (streak * 0.1) → 10% bonus per consecutive hit
 * - Wrong answer: 0 points, streak resets
 */
export function calculateScore(
  timeMs: number,
  streak: number,
  correct: boolean,
): number {
  if (!correct) return 0;
  const tier = getStreakTier(streak);
  const base = Math.max(0, tier.scoreWindowMs - timeMs);
  const multiplier = (1 + streak * tier.streakBonus) * tier.tierMultiplier;
  return Math.round(base * multiplier);
}

/**
 * Classify a correct answer into a quality band based on response time.
 */
export function classifyAnswerQuality(timeMs: number): AnswerQuality {
  if (timeMs <= PERFECT_THRESHOLD_MS) return "perfect";
  if (timeMs <= GOOD_THRESHOLD_MS) return "good";
  return "ok";
}

/**
 * Calculate how many milliseconds to add to the run clock for a correct answer.
 * Uses continuous diminishing returns so the gain asymptotically approaches 0
 * as the run progresses. Formula:
 *   gain = baseGain × (1 / (1 + elapsedMs / RUN_DURATION_MS)) ^ DECAY_EXPONENT
 *
 * @param quality     Quality band of the answer
 * @param elapsedMs   How long the current run has been active (ms)
 */
export function calcTimeGain(
  quality: AnswerQuality,
  elapsedMs: number,
): number {
  const baseGain =
    quality === "perfect"
      ? TIME_GAIN_PERFECT_MS
      : quality === "good"
        ? TIME_GAIN_GOOD_MS
        : 0;

  if (baseGain === 0) return 0;

  // decay factor: starts at 1 and decreases as elapsed time grows
  const decay = Math.pow(
    1 / (1 + elapsedMs / 60_000),
    TIME_GAIN_DECAY_EXPONENT,
  );
  return Math.round(baseGain * decay);
}
