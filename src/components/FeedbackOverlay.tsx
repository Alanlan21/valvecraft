import { useEffect, useState } from "react";
import type { AnswerResult } from "../types";
import { ValveIndicator } from "./ValveIndicator";

interface FeedbackOverlayProps {
  result: AnswerResult | null;
  onDismiss: () => void;
}

export function FeedbackOverlay({ result, onDismiss }: FeedbackOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!result) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (result.correct) {
      // Auto-dismiss correct answers quickly
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      // Show wrong answer feedback longer
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [result, onDismiss]);

  if (!result || !visible) return null;

  return (
    <div
      className={`
        pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center
        transition-opacity duration-200
        ${result.correct ? "bg-green-500/10" : "bg-red-500/10"}
      `}
    >
      {/* Time badge */}
      <div
        className={`
          mb-4 rounded-full px-4 py-1 text-sm font-bold
          ${
            result.correct
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }
        `}
      >
        {result.timeMs}ms
      </div>

      {/* Correct / Wrong indicator */}
      <div
        className={`
          mb-2 text-5xl font-black
          ${result.correct ? "text-green-400" : "text-red-400"}
        `}
      >
        {result.correct ? "✓" : "✗"}
      </div>

      {/* Show expected fingering on wrong answer */}
      {!result.correct && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-[#1a1a2e]/90 p-4">
          <span className="text-sm font-semibold text-[#fffff0]/70">
            Digitação correta para {result.note.id}:
          </span>
          <ValveIndicator currentInput={result.expected} />
        </div>
      )}
    </div>
  );
}
