import type { Sheet, SheetNote } from "../../types/sheet";
import type { Note } from "../../types";

/**
 * Helper to create a Note object from pitch string
 */
function createNote(name: string, octave: number): Note {
  const baseName = name.replace("#", "").replace("b", "");
  const accidental = name.includes("#") ? "#" : name.includes("b") ? "b" : "";
  const vexflowAccidental =
    accidental === "#" ? "#" : accidental === "b" ? "b" : "";

  return {
    name,
    octave,
    vexflowKey: `${baseName.toLowerCase()}${vexflowAccidental}/${octave}`,
    id: `${name}${octave}`,
  };
}

/**
 * Helper to create sheet notes from a simple pitch array
 * Each note is a quarter note (1 beat), played sequentially
 */
function createQuarterNoteSequence(
  pitches: Array<{ name: string; octave: number }>,
  beatsPerMeasure: number,
): SheetNote[] {
  return pitches.map((pitch, index) => ({
    pitch: createNote(pitch.name, pitch.octave),
    startBeat: index,
    duration: 1 as const,
    measure: Math.floor(index / beatsPerMeasure) + 1,
  }));
}

/**
 * C Major Scale (Dó Maior) - Beginner
 * Range: C4 to C5 (one octave, ascending and descending)
 */
export const cMajorScale: Sheet = {
  id: "c-major-scale",
  title: "Escala de Dó Maior",
  bpm: 80,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "scale",
  totalMeasures: 4,
  notes: createQuarterNoteSequence(
    [
      // Ascending
      { name: "C", octave: 4 },
      { name: "D", octave: 4 },
      { name: "E", octave: 4 },
      { name: "F", octave: 4 },
      { name: "G", octave: 4 },
      { name: "A", octave: 4 },
      { name: "B", octave: 4 },
      { name: "C", octave: 5 },
      // Descending
      { name: "B", octave: 4 },
      { name: "A", octave: 4 },
      { name: "G", octave: 4 },
      { name: "F", octave: 4 },
      { name: "E", octave: 4 },
      { name: "D", octave: 4 },
      { name: "C", octave: 4 },
      // Final whole note (represented as quarter for MVP)
      { name: "C", octave: 4 },
    ],
    4,
  ),
};

/**
 * G Major Scale (Sol Maior) - Beginner
 * Range: G4 to G5 (one octave)
 */
export const gMajorScale: Sheet = {
  id: "g-major-scale",
  title: "Escala de Sol Maior",
  bpm: 80,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "scale",
  totalMeasures: 4,
  notes: createQuarterNoteSequence(
    [
      // Ascending
      { name: "G", octave: 4 },
      { name: "A", octave: 4 },
      { name: "B", octave: 4 },
      { name: "C", octave: 5 },
      { name: "D", octave: 5 },
      { name: "E", octave: 5 },
      { name: "F#", octave: 5 },
      { name: "G", octave: 5 },
      // Descending
      { name: "F#", octave: 5 },
      { name: "E", octave: 5 },
      { name: "D", octave: 5 },
      { name: "C", octave: 5 },
      { name: "B", octave: 4 },
      { name: "A", octave: 4 },
      { name: "G", octave: 4 },
      { name: "G", octave: 4 },
    ],
    4,
  ),
};

/**
 * F Major Scale (Fá Maior) - Beginner
 * Range: F4 to F5 (one octave)
 */
export const fMajorScale: Sheet = {
  id: "f-major-scale",
  title: "Escala de Fá Maior",
  bpm: 80,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "scale",
  totalMeasures: 4,
  notes: createQuarterNoteSequence(
    [
      // Ascending
      { name: "F", octave: 4 },
      { name: "G", octave: 4 },
      { name: "A", octave: 4 },
      { name: "Bb", octave: 4 },
      { name: "C", octave: 5 },
      { name: "D", octave: 5 },
      { name: "E", octave: 5 },
      { name: "F", octave: 5 },
      // Descending
      { name: "E", octave: 5 },
      { name: "D", octave: 5 },
      { name: "C", octave: 5 },
      { name: "Bb", octave: 4 },
      { name: "A", octave: 4 },
      { name: "G", octave: 4 },
      { name: "F", octave: 4 },
      { name: "F", octave: 4 },
    ],
    4,
  ),
};

/**
 * Simple rhythm exercise - same note, different rhythms
 * Uses only C4 to focus on timing
 */
export const rhythmExercise1: Sheet = {
  id: "rhythm-exercise-1",
  title: "Exercício de Ritmo 1",
  composer: "Valvecraft",
  bpm: 90,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "exercise",
  totalMeasures: 4,
  notes: [
    // Measure 1: Four quarter notes
    { pitch: createNote("C", 4), startBeat: 0, duration: 1, measure: 1 },
    { pitch: createNote("C", 4), startBeat: 1, duration: 1, measure: 1 },
    { pitch: createNote("C", 4), startBeat: 2, duration: 1, measure: 1 },
    { pitch: createNote("C", 4), startBeat: 3, duration: 1, measure: 1 },
    // Measure 2: Two half notes
    { pitch: createNote("G", 4), startBeat: 4, duration: 2, measure: 2 },
    { pitch: createNote("G", 4), startBeat: 6, duration: 2, measure: 2 },
    // Measure 3: One whole note
    { pitch: createNote("E", 4), startBeat: 8, duration: 4, measure: 3 },
    // Measure 4: Mixed
    { pitch: createNote("C", 4), startBeat: 12, duration: 2, measure: 4 },
    { pitch: createNote("G", 4), startBeat: 14, duration: 1, measure: 4 },
    { pitch: createNote("C", 5), startBeat: 15, duration: 1, measure: 4 },
  ],
};

/**
 * Ode to Joy (simplified) - Beethoven
 * First 8 measures, quarter notes only
 */
export const odeToJoySimple: Sheet = {
  id: "ode-to-joy-simple",
  title: "Ode à Alegria",
  composer: "Beethoven (simplificado)",
  bpm: 100,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "melody",
  totalMeasures: 4,
  notes: createQuarterNoteSequence(
    [
      // Measure 1
      { name: "E", octave: 4 },
      { name: "E", octave: 4 },
      { name: "F", octave: 4 },
      { name: "G", octave: 4 },
      // Measure 2
      { name: "G", octave: 4 },
      { name: "F", octave: 4 },
      { name: "E", octave: 4 },
      { name: "D", octave: 4 },
      // Measure 3
      { name: "C", octave: 4 },
      { name: "C", octave: 4 },
      { name: "D", octave: 4 },
      { name: "E", octave: 4 },
      // Measure 4
      { name: "E", octave: 4 },
      { name: "D", octave: 4 },
      { name: "D", octave: 4 },
      { name: "D", octave: 4 },
    ],
    4,
  ),
};

/**
 * Hot Cross Buns - Traditional
 * Very simple, 3 notes only
 */
export const hotCrossBuns: Sheet = {
  id: "hot-cross-buns",
  title: "Hot Cross Buns",
  composer: "Tradicional",
  bpm: 90,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "melody",
  totalMeasures: 2,
  notes: [
    // E - D - C (half notes)
    { pitch: createNote("E", 4), startBeat: 0, duration: 1, measure: 1 },
    { pitch: createNote("D", 4), startBeat: 1, duration: 1, measure: 1 },
    { pitch: createNote("C", 4), startBeat: 2, duration: 2, measure: 1 },
    // E - D - C (half notes)
    { pitch: createNote("E", 4), startBeat: 4, duration: 1, measure: 2 },
    { pitch: createNote("D", 4), startBeat: 5, duration: 1, measure: 2 },
    { pitch: createNote("C", 4), startBeat: 6, duration: 2, measure: 2 },
  ],
};

/**
 * All available sheets
 */
export const allSheets: Sheet[] = [
  cMajorScale,
  gMajorScale,
  fMajorScale,
  rhythmExercise1,
  odeToJoySimple,
  hotCrossBuns,
];

/**
 * Get sheets by difficulty
 */
export function getSheetsByDifficulty(
  difficulty: Sheet["difficulty"],
): Sheet[] {
  return allSheets.filter((s) => s.difficulty === difficulty);
}

/**
 * Get sheets by category
 */
export function getSheetsByCategory(category: Sheet["category"]): Sheet[] {
  return allSheets.filter((s) => s.category === category);
}

/**
 * Get a sheet by its ID
 */
export function getSheetById(id: string): Sheet | undefined {
  return allSheets.find((s) => s.id === id);
}
