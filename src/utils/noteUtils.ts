import type { Note, GameMode, Fingering } from "../types";
import { allNotes, fingeringMap } from "../data/fingeringMap";
import { getStreakTier } from "./gameRules";

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
