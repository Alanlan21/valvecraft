interface ScoreBoardProps {
  score: number;
  streak: number;
  bestStreak: number;
  totalAnswers: number;
  correctAnswers: number;
}

export function ScoreBoard({
  score,
  streak,
  bestStreak,
  totalAnswers,
  correctAnswers,
}: ScoreBoardProps) {
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return (
    <div className="flex items-center gap-6 rounded-xl bg-[#16213e] px-6 py-3 shadow-lg shadow-black/20">
      {/* Score */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Score
        </span>
        <span className="text-2xl font-black tabular-nums text-[#d4a853]">
          {score.toLocaleString()}
        </span>
      </div>

      <div className="h-10 w-px bg-[#cd7f32]/20" />

      {/* Streak */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Streak
        </span>
        <span
          className={`text-2xl font-black tabular-nums ${
            streak >= 5
              ? "text-green-400"
              : streak > 0
                ? "text-[#d4a853]"
                : "text-[#fffff0]/40"
          }`}
        >
          {streak}
          {streak >= 5 && " 🔥"}
        </span>
      </div>

      <div className="h-10 w-px bg-[#cd7f32]/20" />

      {/* Best Streak */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Melhor
        </span>
        <span className="text-2xl font-black tabular-nums text-[#fffff0]/60">
          {bestStreak}
        </span>
      </div>

      <div className="h-10 w-px bg-[#cd7f32]/20" />

      {/* Accuracy */}
      <div className="flex flex-col items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Acertos
        </span>
        <span className="text-2xl font-black tabular-nums text-[#fffff0]/60">
          {accuracy}%
        </span>
      </div>
    </div>
  );
}
