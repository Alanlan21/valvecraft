import { useCallback, useEffect, useRef, useState } from "react";
import type { ControlBindings, GameMode, Note } from "../types";
import { useGameEngine } from "../hooks/useGameEngine";
import { useKeyboardInput } from "../hooks/useKeyboardInput";
import { useTrumpetAudio } from "../hooks/useTrumpetAudio";
import { NOTE_REVEAL_DELAY_MS } from "../utils/gameRules";
import { fingeringToNoteId } from "../utils/noteUtils";
import { StaffDisplay } from "./StaffDisplay";
import { ValveIndicator } from "./ValveIndicator";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { GameOverOverlay } from "./GameOverOverlay";
import { ScoreBoard } from "./ScoreBoard";

interface GameScreenProps {
  controlBindings: ControlBindings;
  mode: GameMode;
  onExit: () => void;
  onScoreUpdate?: (score: number, streak: number) => void;
}

export function GameScreen({
  controlBindings,
  mode,
  onExit,
  onScoreUpdate,
}: GameScreenProps) {
  const engine = useGameEngine();
  const {
    bestStreak,
    clearLastResult,
    correctAnswers,
    currentNote,
    gameActive,
    gameOver,
    lastResult,
    score,
    startGame,
    streak,
    submitAnswer,
    timeLeftMs,
    totalAnswers,
  } = engine;
  const { playNote, playError } = useTrumpetAudio(mode.trumpetType);

  // Guard: block submissions while feedback is showing
  const handleSubmit = useCallback(
    (fingering: Parameters<typeof submitAnswer>[0]) => {
      if (lastResult || gameOver) return;
      submitAnswer(fingering);
    },
    [gameOver, lastResult, submitAnswer],
  );

  const { currentInput, resetInput } = useKeyboardInput(
    gameActive && !gameOver && !lastResult,
    handleSubmit,
    controlBindings,
  );

  useEffect(() => {
    if (lastResult || gameOver) {
      resetInput();
    }
  }, [gameOver, lastResult, resetInput]);

  // Persist high scores
  const onScoreUpdateRef = useRef(onScoreUpdate);
  onScoreUpdateRef.current = onScoreUpdate;
  useEffect(() => {
    onScoreUpdateRef.current?.(score, bestStreak);
  }, [score, bestStreak]);

  // Start game on mount
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startGame(mode);
    }
  }, [mode, startGame]);

  // Audio feedback on answer
  const lastResultId = useRef<string | null>(null);
  useEffect(() => {
    const r = lastResult;
    if (!r) return;
    // Use a timestamp-like key to avoid re-firing on same result object
    const key = `${r.note.id}-${r.timeMs}`;
    if (key === lastResultId.current) return;
    lastResultId.current = key;

    if (r.correct) {
      // Confirm with the correct note
      playNote(r.note.id);
    } else {
      // Play the note the player's fingering actually corresponds to
      const wrongNoteId = fingeringToNoteId(r.given, r.note.octave);
      if (wrongNoteId) {
        playNote(wrongNoteId);
      } else {
        playError();
      }
    }
  }, [lastResult, playNote, playError]);

  // displayNote: the note actually rendered on screen.
  // Hidden the instant the overlay appears; revealed together with audio after it clears.
  const [displayNote, setDisplayNote] = useState<Note | null>(null);
  useEffect(() => {
    if (gameOver) {
      setDisplayNote(null);
      return;
    }

    if (lastResult) {
      // Overlay just appeared — hide note immediately
      setDisplayNote(null);
      return;
    }
    if (!currentNote) return;
    // Overlay cleared (or game start) — reveal note + play audio together after a short breath
    const id = setTimeout(() => {
      setDisplayNote(currentNote);
      playNote(currentNote.id);
    }, NOTE_REVEAL_DELAY_MS);
    return () => clearTimeout(id);
  }, [currentNote, gameOver, lastResult, playNote]);

  const handleRestart = useCallback(() => {
    lastResultId.current = null;
    resetInput();
    setDisplayNote(null);
    startGame(mode);
  }, [mode, resetInput, startGame]);

  // Escape key to exit
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onExit]);

  return (
    <div className="relative flex min-h-screen select-none flex-col items-center gap-6 px-4 py-6">
      {/* Top bar: score + exit */}
      <div className="flex w-full max-w-3xl items-center justify-between gap-4">
        <ScoreBoard
          timeLeftMs={timeLeftMs}
          score={score}
          streak={streak}
          bestStreak={bestStreak}
          totalAnswers={totalAnswers}
          correctAnswers={correctAnswers}
        />
        <button
          onClick={onExit}
          className="rounded-lg border border-[#cd7f32]/30 px-4 py-2 text-sm text-[#cd7f32]/60 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
        >
          Sair
        </button>
      </div>

      {/* Note name */}
      {displayNote && (
        <div className="text-center">
          <span className="text-lg font-mono text-[#fffff0]/30">
            Qual é o dedilhado?
          </span>
        </div>
      )}

      {/* Staff display — shown in sync with audio */}
      <StaffDisplay note={displayNote} />

      {/* Valve indicator */}
      <div className="mt-4">
        <ValveIndicator
          controlBindings={controlBindings}
          currentInput={currentInput}
          expected={
            lastResult && !lastResult.correct ? lastResult.expected : null
          }
          showExpected={!!lastResult && !lastResult.correct}
        />
      </div>

      {/* Submit hint */}
      <div className="mt-2 text-center text-sm text-[#fffff0]/20">
        Segure as válvulas e pressione{" "}
        <kbd className="rounded bg-[#16213e] px-2 py-0.5 font-mono text-[#d4a853]/60">
          {controlBindings.submit.label}
        </kbd>{" "}
        para confirmar
      </div>

      {/* Feedback overlay */}
      {!gameOver && (
        <FeedbackOverlay
          controlBindings={controlBindings}
          result={lastResult}
          onDismiss={clearLastResult}
        />
      )}

      {gameOver && (
        <GameOverOverlay
          score={score}
          bestStreak={bestStreak}
          totalAnswers={totalAnswers}
          correctAnswers={correctAnswers}
          onRestart={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
}
