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
 * Parabéns pra Você - Tradicional Brasileiro (simplificado em 4/4)
 */
export const parabens: Sheet = {
  id: "parabens",
  title: "Parabéns pra Você",
  composer: "Tradicional",
  bpm: 90,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "melody",
  totalMeasures: 6,
  notes: createQuarterNoteSequence(
    [
      // "Pa-ra-béns pra vo-cê"
      { name: "C", octave: 4 }, { name: "C", octave: 4 },
      { name: "D", octave: 4 }, { name: "C", octave: 4 },
      // "nes-ta da-ta que-ri-da"
      { name: "F", octave: 4 }, { name: "E", octave: 4 },
      { name: "C", octave: 4 }, { name: "C", octave: 4 },
      // "mui-tas fe-li-ci-da-des"
      { name: "D", octave: 4 }, { name: "C", octave: 4 },
      { name: "G", octave: 4 }, { name: "F", octave: 4 },
      // "a vo-cê"
      { name: "C", octave: 5 }, { name: "A", octave: 4 },
      { name: "F", octave: 4 }, { name: "E", octave: 4 },
      // "e pros seus"
      { name: "D", octave: 4 }, { name: "D", octave: 4 },
      { name: "Bb", octave: 4 }, { name: "A", octave: 4 },
      // "pa-ra-béns"
      { name: "G", octave: 4 }, { name: "F", octave: 4 },
      { name: "C", octave: 4 }, { name: "C", octave: 4 },
    ],
    4,
  ),
};

/**
 * Twinkle Twinkle Little Star
 */
export const twinkleTwinkle: Sheet = {
  id: "twinkle-twinkle",
  title: "Twinkle Twinkle",
  composer: "Tradicional",
  bpm: 90,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "melody",
  totalMeasures: 8,
  notes: createQuarterNoteSequence(
    [
      // "Twin-kle twin-kle lit-tle star"
      { name: "C", octave: 4 }, { name: "C", octave: 4 },
      { name: "G", octave: 4 }, { name: "G", octave: 4 },
      // "how I won-der what you are"
      { name: "A", octave: 4 }, { name: "A", octave: 4 },
      { name: "G", octave: 4 }, { name: "G", octave: 4 },
      // "Up a-bove the world so high"
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      { name: "E", octave: 4 }, { name: "E", octave: 4 },
      // "like a dia-mond in the sky"
      { name: "D", octave: 4 }, { name: "D", octave: 4 },
      { name: "C", octave: 4 }, { name: "C", octave: 4 },
      // Bridge "Twin-kle twin-kle lit-tle star"
      { name: "G", octave: 4 }, { name: "G", octave: 4 },
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      { name: "E", octave: 4 }, { name: "E", octave: 4 },
      { name: "D", octave: 4 }, { name: "D", octave: 4 },
      { name: "G", octave: 4 }, { name: "G", octave: 4 },
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      { name: "E", octave: 4 }, { name: "E", octave: 4 },
      { name: "D", octave: 4 }, { name: "D", octave: 4 },
    ],
    4,
  ),
};

/**
 * When the Saints Go Marching In - Tradicional
 */
export const whenTheSaints: Sheet = {
  id: "when-the-saints",
  title: "When the Saints",
  composer: "Tradicional",
  bpm: 100,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "easy",
  category: "melody",
  totalMeasures: 8,
  notes: [
    // "Oh when the saints"
    { pitch: createNote("C", 4), startBeat: 1, duration: 1, measure: 1 },
    { pitch: createNote("E", 4), startBeat: 2, duration: 1, measure: 1 },
    { pitch: createNote("F", 4), startBeat: 3, duration: 1, measure: 1 },
    // "go mar-ching in"
    { pitch: createNote("G", 4), startBeat: 4, duration: 2, measure: 2 },
    { pitch: createNote("C", 4), startBeat: 6, duration: 1, measure: 2 },
    { pitch: createNote("E", 4), startBeat: 7, duration: 1, measure: 2 },
    // "oh when the saints"
    { pitch: createNote("F", 4), startBeat: 8, duration: 1, measure: 3 },
    { pitch: createNote("G", 4), startBeat: 9, duration: 2, measure: 3 },
    { pitch: createNote("G", 4), startBeat: 11, duration: 1, measure: 3 },
    // "go mar-ching in"
    { pitch: createNote("C", 4), startBeat: 12, duration: 1, measure: 4 },
    { pitch: createNote("E", 4), startBeat: 13, duration: 1, measure: 4 },
    { pitch: createNote("F", 4), startBeat: 14, duration: 1, measure: 4 },
    { pitch: createNote("G", 4), startBeat: 15, duration: 1, measure: 4 },
    // "I want to be in that num-ber"
    { pitch: createNote("E", 4), startBeat: 16, duration: 2, measure: 5 },
    { pitch: createNote("C", 4), startBeat: 18, duration: 1, measure: 5 },
    { pitch: createNote("E", 4), startBeat: 19, duration: 1, measure: 5 },
    { pitch: createNote("D", 4), startBeat: 20, duration: 2, measure: 6 },
    { pitch: createNote("E", 4), startBeat: 22, duration: 1, measure: 6 },
    { pitch: createNote("D", 4), startBeat: 23, duration: 1, measure: 6 },
    // "when the saints go mar-ching in"
    { pitch: createNote("C", 4), startBeat: 24, duration: 2, measure: 7 },
    { pitch: createNote("G", 4), startBeat: 26, duration: 1, measure: 7 },
    { pitch: createNote("E", 4), startBeat: 27, duration: 1, measure: 7 },
    { pitch: createNote("C", 4), startBeat: 28, duration: 4, measure: 8 },
  ],
};

/**
 * Amazing Grace - Tradicional (simplificado em 4/4)
 */
export const amazingGrace: Sheet = {
  id: "amazing-grace",
  title: "Amazing Grace",
  composer: "Tradicional",
  bpm: 80,
  timeSignature: { beats: 4, beatValue: 4 },
  difficulty: "medium",
  category: "melody",
  totalMeasures: 8,
  notes: createQuarterNoteSequence(
    [
      // "A-ma-zing grace how sweet the sound"
      { name: "C", octave: 4 }, { name: "F", octave: 4 },
      { name: "F", octave: 4 }, { name: "A", octave: 4 },
      { name: "F", octave: 4 }, { name: "A", octave: 4 },
      { name: "C", octave: 5 }, { name: "A", octave: 4 },
      // "that saved a wretch like me"
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      { name: "C", octave: 4 }, { name: "E", octave: 4 },
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      // "I once was lost but now am found"
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
      { name: "F", octave: 4 }, { name: "A", octave: 4 },
      { name: "F", octave: 4 }, { name: "A", octave: 4 },
      { name: "C", octave: 5 }, { name: "A", octave: 4 },
      // "was blind but now I see"
      { name: "C", octave: 5 }, { name: "A", octave: 4 },
      { name: "F", octave: 4 }, { name: "A", octave: 4 },
      { name: "G", octave: 4 }, { name: "F", octave: 4 },
      { name: "F", octave: 4 }, { name: "F", octave: 4 },
    ],
    4,
  ),
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
  twinkleTwinkle,
  whenTheSaints,
  parabens,
  amazingGrace,
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
