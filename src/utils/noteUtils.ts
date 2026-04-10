import type { Note, GameMode } from "../types";
import { allNotes } from "../data/fingeringMap";

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
    case "sharp":
      return rangeNotes.filter((n) => isNatural(n.name) || isSharp(n.name));
    case "flat":
      return rangeNotes.filter((n) => isNatural(n.name) || isFlat(n.name));
    case "chromatic":
      return rangeNotes;
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
  const base = Math.max(0, 3000 - timeMs);
  const multiplier = 1 + streak * 0.1;
  return Math.round(base * multiplier);
}
