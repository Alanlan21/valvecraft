import { useEffect, useState } from "react";
import type { AnswerResult } from "../types";
import {
  CORRECT_FEEDBACK_MS,
  WRONG_ANSWER_TIME_PENALTY_MS,
  WRONG_FEEDBACK_MS,
} from "../utils/gameRules";

interface FeedbackOverlayProps {
  result: AnswerResult | null;
  onDismiss: () => void;
}

export function FeedbackOverlay({
  result,
  onDismiss,
}: FeedbackOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!result) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const timer = setTimeout(
      () => {
        setVisible(false);
        onDismiss();
      },
      result.correct ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS,
    );
    return () => clearTimeout(timer);
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
        {!result.correct && (
          <span className="ml-2 text-red-300">
            -{WRONG_ANSWER_TIME_PENALTY_MS / 1000}s
          </span>
        )}
        {result.correct && (
          <span className="ml-2 text-green-400">+{result.timeGainMs}s</span>
        )}
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
    </div>
  );
}
