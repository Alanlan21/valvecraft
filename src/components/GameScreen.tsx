import { useCallback, useEffect, useRef } from "react";
import type { GameMode } from "../types";
import { useGameEngine } from "../hooks/useGameEngine";
import { useKeyboardInput } from "../hooks/useKeyboardInput";
import { StaffDisplay } from "./StaffDisplay";
import { ValveIndicator } from "./ValveIndicator";
import { FeedbackOverlay } from "./FeedbackOverlay";
import { ScoreBoard } from "./ScoreBoard";

interface GameScreenProps {
  mode: GameMode;
  onExit: () => void;
  onScoreUpdate?: (score: number, streak: number) => void;
}

export function GameScreen({ mode, onExit, onScoreUpdate }: GameScreenProps) {
  const engine = useGameEngine();

  const handleSubmit = useCallback(
    (fingering: Parameters<typeof engine.submitAnswer>[0]) => {
      engine.submitAnswer(fingering);
    },
    [engine.submitAnswer],
  );

  const { currentInput } = useKeyboardInput(engine.gameActive, handleSubmit);

  // Persist high scores
  const onScoreUpdateRef = useRef(onScoreUpdate);
  onScoreUpdateRef.current = onScoreUpdate;
  useEffect(() => {
    onScoreUpdateRef.current?.(engine.score, engine.bestStreak);
  }, [engine.score, engine.bestStreak]);

  // Start game on mount
  if (!engine.gameActive && !engine.currentNote) {
    engine.startGame(mode);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-6 px-4 py-6">
      {/* Top bar: score + exit */}
      <div className="flex w-full max-w-2xl items-center justify-between">
        <ScoreBoard
          score={engine.score}
          streak={engine.streak}
          bestStreak={engine.bestStreak}
          totalAnswers={engine.totalAnswers}
          correctAnswers={engine.correctAnswers}
        />
        <button
          onClick={onExit}
          className="rounded-lg border border-[#cd7f32]/30 px-4 py-2 text-sm text-[#cd7f32]/60 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
        >
          Sair
        </button>
      </div>

      {/* Note name */}
      {engine.currentNote && (
        <div className="text-center">
          <span className="text-lg font-mono text-[#fffff0]/30">
            Qual é o dedilhado?
          </span>
        </div>
      )}

      {/* Staff display */}
      <StaffDisplay note={engine.currentNote} />

      {/* Valve indicator */}
      <div className="mt-4">
        <ValveIndicator
          currentInput={currentInput}
          expected={
            engine.lastResult && !engine.lastResult.correct
              ? engine.lastResult.expected
              : null
          }
          showExpected={!!engine.lastResult && !engine.lastResult.correct}
        />
      </div>

      {/* Submit hint */}
      <div className="mt-2 text-center text-sm text-[#fffff0]/20">
        Segure as válvulas e pressione{" "}
        <kbd className="rounded bg-[#16213e] px-2 py-0.5 font-mono text-[#d4a853]/60">
          Espaço
        </kbd>{" "}
        para confirmar
      </div>

      {/* Feedback overlay */}
      <FeedbackOverlay
        result={engine.lastResult}
        onDismiss={engine.clearLastResult}
      />
    </div>
  );
}
