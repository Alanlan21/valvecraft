import { useState, useCallback, useRef, useEffect } from "react";
import type { Note, Fingering, GameMode, AnswerResult } from "../types";
import { fingeringMap } from "../data/fingeringMap";
import {
  getNotesForMode,
  getRandomNote,
  calculateScore,
} from "../utils/noteUtils";
import {
  CORRECT_FEEDBACK_MS,
  NOTE_REVEAL_DELAY_MS,
  RUN_DURATION_MS,
  WRONG_ANSWER_TIME_PENALTY_MS,
  WRONG_FEEDBACK_MS,
} from "../utils/gameRules";

export interface GameEngineState {
  currentNote: Note | null;
  score: number;
  streak: number;
  bestStreak: number;
  lastResult: AnswerResult | null;
  gameActive: boolean;
  gameOver: boolean;
  notePool: Note[];
  timeLeftMs: number;
  totalAnswers: number;
  correctAnswers: number;
}

const TIMER_TICK_MS = 100;

const INITIAL_STATE: GameEngineState = {
  currentNote: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  lastResult: null,
  gameActive: false,
  gameOver: false,
  notePool: [],
  timeLeftMs: RUN_DURATION_MS,
  totalAnswers: 0,
  correctAnswers: 0,
};

/**
 * Core game loop hook.
 * Manages note selection, answer validation, scoring, streaks, and run timer.
 */
export function useGameEngine() {
  const [state, setState] = useState<GameEngineState>(INITIAL_STATE);
  const noteAppearedAt = useRef<number>(0);
  const timerTickAt = useRef<number>(0);
  const noteTimer = useRef<number | null>(null);

  const clearNoteTimer = useCallback(() => {
    if (noteTimer.current !== null) {
      window.clearTimeout(noteTimer.current);
      noteTimer.current = null;
    }
  }, []);

  const scheduleNoteTimerReset = useCallback(
    (delayMs: number) => {
      clearNoteTimer();
      noteTimer.current = window.setTimeout(() => {
        noteAppearedAt.current = performance.now();
        noteTimer.current = null;
      }, delayMs);
    },
    [clearNoteTimer],
  );

  useEffect(() => {
    return () => clearNoteTimer();
  }, [clearNoteTimer]);

  useEffect(() => {
    if (state.gameOver) {
      clearNoteTimer();
    }
  }, [clearNoteTimer, state.gameOver]);

  useEffect(() => {
    if (!state.gameActive) return;

    timerTickAt.current = performance.now();

    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsedMs = now - timerTickAt.current;
      timerTickAt.current = now;

      setState((prev) => {
        if (!prev.gameActive) return prev;

        const timeLeftMs = Math.max(0, prev.timeLeftMs - elapsedMs);

        if (timeLeftMs <= 0) {
          return {
            ...prev,
            gameActive: false,
            gameOver: true,
            lastResult: null,
            timeLeftMs: 0,
          };
        }

        return {
          ...prev,
          timeLeftMs,
        };
      });
    }, TIMER_TICK_MS);

    return () => window.clearInterval(timer);
  }, [state.gameActive]);

  const startGame = useCallback(
    (mode: GameMode) => {
      const pool = getNotesForMode(mode);
      const first = getRandomNote(pool);
      clearNoteTimer();
      noteAppearedAt.current = performance.now();
      timerTickAt.current = performance.now();

      setState({
        ...INITIAL_STATE,
        currentNote: first,
        gameActive: true,
        notePool: pool,
        timeLeftMs: RUN_DURATION_MS,
      });
    },
    [clearNoteTimer],
  );

  const submitAnswer = useCallback(
    (given: Fingering) => {
      setState((prev) => {
        if (!prev.gameActive || prev.gameOver || !prev.currentNote) return prev;

        const timeMs = Math.round(performance.now() - noteAppearedAt.current);
        const expected = fingeringMap[prev.currentNote.id];

        if (!expected) return prev;

        const correct =
          given.valves[0] === expected.valves[0] &&
          given.valves[1] === expected.valves[1] &&
          given.valves[2] === expected.valves[2] &&
          given.slide === expected.slide;

        const newStreak = correct ? prev.streak + 1 : 0;
        const points = calculateScore(timeMs, prev.streak, correct);
        const newBestStreak = Math.max(prev.bestStreak, newStreak);
        const nextNote = getRandomNote(prev.notePool, prev.currentNote.id);
        const timeLeftMs = correct
          ? prev.timeLeftMs
          : Math.max(0, prev.timeLeftMs - WRONG_ANSWER_TIME_PENALTY_MS);
        const gameOver = timeLeftMs <= 0;

        const result: AnswerResult = {
          correct,
          expected,
          given,
          timeMs,
          note: prev.currentNote,
        };

        if (!gameOver) {
          scheduleNoteTimerReset(
            (correct ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS) +
              NOTE_REVEAL_DELAY_MS,
          );
        }

        return {
          ...prev,
          score: prev.score + points,
          streak: newStreak,
          bestStreak: newBestStreak,
          lastResult: result,
          currentNote: correct && !gameOver ? nextNote : prev.currentNote,
          gameActive: !gameOver,
          gameOver,
          timeLeftMs,
          totalAnswers: prev.totalAnswers + 1,
          correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
        };
      });
    },
    [scheduleNoteTimerReset],
  );

  const endGame = useCallback(() => {
    clearNoteTimer();
    setState((prev) => ({
      ...prev,
      gameActive: false,
      gameOver: true,
      lastResult: null,
      timeLeftMs: 0,
    }));
  }, [clearNoteTimer]);

  const clearLastResult = useCallback(() => {
    setState((prev) => ({ ...prev, lastResult: null }));
  }, []);

  return {
    ...state,
    startGame,
    submitAnswer,
    endGame,
    clearLastResult,
  };
}
