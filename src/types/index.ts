// Re-export sheet music types
export * from "./sheet";

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

export type RangeLevel = "beginner" | "intermediate" | "advanced" | "extreme";
export type NoteType = "natural" | "accidental";
export type TrumpetType = "Bb" | "C";
export type AudioMode = "mono" | "off";
/** Note naming convention shown to the user. */
export type NoteNomenclature = "anglo" | "latin";
export type ControlAction = "valve1" | "valve2" | "valve3" | "slide" | "submit";
export type QuizMode = "challenge" | "training";

export interface KeyBinding {
  code: string;
  label: string;
}

export type ControlBindings = Record<ControlAction, KeyBinding>;

export interface GameMode {
  rangeLevel: RangeLevel;
  noteType: NoteType;
  trumpetType: TrumpetType;
  quizMode: QuizMode;
  showNoteName: boolean;
}

/** Quality band assigned to a correct answer based on response time. */
export type AnswerQuality = "perfect" | "good" | "ok";

export interface AnswerResult {
  correct: boolean;
  expected: Fingering;
  given: Fingering;
  timeMs: number;
  note: Note;
  /** Quality of the answer (only meaningful when correct === true). */
  quality: AnswerQuality;
  /** Milliseconds added to the run clock by this answer (0 on wrong/ok). */
  timeGainMs: number;
  /** True when the player had at least one wrong attempt on this note before getting it right. */
  hadPriorError: boolean;
}

export type GameScreen =
  | "menu"
  | "quiz-setup"
  | "game"
  | "result"
  | "rhythm-select"
  | "rhythm-play"
  | "note-reading";
