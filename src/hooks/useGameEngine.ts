import { useState, useCallback, useRef } from "react";
import type { Note, Fingering, GameMode, AnswerResult } from "../types";
import { fingeringMap } from "../data/fingeringMap";
import {
  getNotesForMode,
  getRandomNote,
  calculateScore,
} from "../utils/noteUtils";

export interface GameEngineState {
  currentNote: Note | null;
  score: number;
  streak: number;
  bestStreak: number;
  lastResult: AnswerResult | null;
  gameActive: boolean;
  notePool: Note[];
  totalAnswers: number;
  correctAnswers: number;
}

const INITIAL_STATE: GameEngineState = {
  currentNote: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  lastResult: null,
  gameActive: false,
  notePool: [],
  totalAnswers: 0,
  correctAnswers: 0,
};

/**
 * Core game loop hook.
 * Manages note selection, answer validation, scoring, and streaks.
 */
export function useGameEngine() {
  const [state, setState] = useState<GameEngineState>(INITIAL_STATE);
  const noteAppearedAt = useRef<number>(0);

  const startGame = useCallback((mode: GameMode) => {
    const pool = getNotesForMode(mode);
    const first = getRandomNote(pool);
    noteAppearedAt.current = performance.now();

    setState({
      ...INITIAL_STATE,
      currentNote: first,
      gameActive: true,
      notePool: pool,
    });
  }, []);

  const submitAnswer = useCallback((given: Fingering) => {
    setState((prev) => {
      if (!prev.gameActive || !prev.currentNote) return prev;

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

      const result: AnswerResult = {
        correct,
        expected,
        given,
        timeMs,
        note: prev.currentNote,
      };

      const nextNote = getRandomNote(prev.notePool, prev.currentNote.id);

      // Schedule the timestamp update after state settles
      setTimeout(
        () => {
          noteAppearedAt.current = performance.now();
        },
        correct ? 0 : 1500,
      ); // delay next note timer if wrong (feedback display)

      return {
        ...prev,
        score: prev.score + points,
        streak: newStreak,
        bestStreak: newBestStreak,
        lastResult: result,
        currentNote: correct ? nextNote : prev.currentNote,
        totalAnswers: prev.totalAnswers + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      };
    });
  }, []);

  const endGame = useCallback(() => {
    setState((prev) => ({ ...prev, gameActive: false }));
  }, []);

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
