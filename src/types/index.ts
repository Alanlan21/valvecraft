export interface Note {
  /** Display name, e.g. "C#", "Eb", "G" */
  name: string;
  octave: number;
  /** VexFlow key format, e.g. "c#/4", "eb/4", "g/5" */
  vexflowKey: string;
  /** Unique id for lookups: "C4", "C#4", "Eb4", etc. */
  id: string;
}

export interface Fingering {
  /** [valve1, valve2, valve3] — true = pressed */
  valves: [boolean, boolean, boolean];
  /** 3rd valve slide required for intonation correction */
  slide: boolean;
}

export type RangeLevel = "beginner" | "intermediate" | "advanced";
export type NoteType = "natural" | "flat" | "sharp" | "chromatic";

export interface GameMode {
  rangeLevel: RangeLevel;
  noteType: NoteType;
}

export interface AnswerResult {
  correct: boolean;
  expected: Fingering;
  given: Fingering;
  timeMs: number;
  note: Note;
}

export type GameScreen = "menu" | "game" | "result";
