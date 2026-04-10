import type { Note, Fingering } from "../types";

// Valve shorthand helpers
const O: [boolean, boolean, boolean] = [false, false, false]; // open
const V1: [boolean, boolean, boolean] = [true, false, false];
const V2: [boolean, boolean, boolean] = [false, true, false];
const V12: [boolean, boolean, boolean] = [true, true, false];
const V13: [boolean, boolean, boolean] = [true, false, true];
const V23: [boolean, boolean, boolean] = [false, true, true];
const V123: [boolean, boolean, boolean] = [true, true, true];

/**
 * Complete fingering chart for Bb trumpet (written pitch).
 * Range: G3 – G5 (practical range).
 * Slide = 3rd valve slide, required on combos 1-3 and 1-2-3.
 */
export const fingeringMap: Record<string, Fingering> = {
  // --- Low register (G3 – B3) ---
  G3: { valves: V13, slide: true },
  "G#3": { valves: V23, slide: false },
  Ab3: { valves: V23, slide: false },
  A3: { valves: V12, slide: false },
  Bb3: { valves: V1, slide: false },
  B3: { valves: V2, slide: false },

  // --- Middle register (C4 – B4) ---
  C4: { valves: O, slide: false },
  "C#4": { valves: V123, slide: true },
  Db4: { valves: V123, slide: true },
  D4: { valves: V13, slide: true },
  Eb4: { valves: V23, slide: false },
  "D#4": { valves: V23, slide: false },
  E4: { valves: V12, slide: false },
  F4: { valves: V1, slide: false },
  "F#4": { valves: V2, slide: false },
  Gb4: { valves: V2, slide: false },
  G4: { valves: O, slide: false },
  "G#4": { valves: V23, slide: false },
  Ab4: { valves: V23, slide: false },
  A4: { valves: V12, slide: false },
  Bb4: { valves: V1, slide: false },
  B4: { valves: V2, slide: false },

  // --- Upper register (C5 – G5) ---
  C5: { valves: O, slide: false },
  "C#5": { valves: V123, slide: true },
  Db5: { valves: V123, slide: true },
  D5: { valves: V13, slide: true },
  Eb5: { valves: V23, slide: false },
  "D#5": { valves: V23, slide: false },
  E5: { valves: V12, slide: false },
  F5: { valves: V1, slide: false },
  "F#5": { valves: V2, slide: false },
  Gb5: { valves: V2, slide: false },
  G5: { valves: O, slide: false },
};

/** Helper to check if two notes are enharmonic equivalents */
function isEnharmonicOf(id: string): string | null {
  const pairs: Record<string, string> = {
    "G#3": "Ab3",
    Ab3: "G#3",
    "C#4": "Db4",
    Db4: "C#4",
    "D#4": "Eb4",
    Eb4: "D#4",
    "F#4": "Gb4",
    Gb4: "F#4",
    "G#4": "Ab4",
    Ab4: "G#4",
    "C#5": "Db5",
    Db5: "C#5",
    "D#5": "Eb5",
    Eb5: "D#5",
    "F#5": "Gb5",
    Gb5: "F#5",
  };
  return pairs[id] ?? null;
}

/**
 * Canonical note list — one entry per pitch (no enharmonic duplicates).
 * Sharps are used as canonical for sharp notes; flats for flat notes.
 * This is used to build mode-specific subsets.
 */
export const allNotes: Note[] = [
  // G3 – B3
  { id: "G3", name: "G", octave: 3, vexflowKey: "g/3" },
  { id: "Ab3", name: "Ab", octave: 3, vexflowKey: "ab/3" },
  { id: "A3", name: "A", octave: 3, vexflowKey: "a/3" },
  { id: "Bb3", name: "Bb", octave: 3, vexflowKey: "bb/3" },
  { id: "B3", name: "B", octave: 3, vexflowKey: "b/3" },

  // C4 – B4
  { id: "C4", name: "C", octave: 4, vexflowKey: "c/4" },
  { id: "C#4", name: "C#", octave: 4, vexflowKey: "c#/4" },
  { id: "D4", name: "D", octave: 4, vexflowKey: "d/4" },
  { id: "Eb4", name: "Eb", octave: 4, vexflowKey: "eb/4" },
  { id: "E4", name: "E", octave: 4, vexflowKey: "e/4" },
  { id: "F4", name: "F", octave: 4, vexflowKey: "f/4" },
  { id: "F#4", name: "F#", octave: 4, vexflowKey: "f#/4" },
  { id: "G4", name: "G", octave: 4, vexflowKey: "g/4" },
  { id: "Ab4", name: "Ab", octave: 4, vexflowKey: "ab/4" },
  { id: "A4", name: "A", octave: 4, vexflowKey: "a/4" },
  { id: "Bb4", name: "Bb", octave: 4, vexflowKey: "bb/4" },
  { id: "B4", name: "B", octave: 4, vexflowKey: "b/4" },

  // C5 – G5
  { id: "C5", name: "C", octave: 5, vexflowKey: "c/5" },
  { id: "C#5", name: "C#", octave: 5, vexflowKey: "c#/5" },
  { id: "D5", name: "D", octave: 5, vexflowKey: "d/5" },
  { id: "Eb5", name: "Eb", octave: 5, vexflowKey: "eb/5" },
  { id: "E5", name: "E", octave: 5, vexflowKey: "e/5" },
  { id: "F5", name: "F", octave: 5, vexflowKey: "f/5" },
  { id: "F#5", name: "F#", octave: 5, vexflowKey: "f#/5" },
  { id: "G5", name: "G", octave: 5, vexflowKey: "g/5" },
];

export { isEnharmonicOf };
