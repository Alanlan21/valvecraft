import { getStreakTier } from "../utils/gameRules";

interface ScoreBoardProps {
  timeLeftMs: number;
  score: number;
  streak: number;
  bestStreak: number;
  totalAnswers: number;
  correctAnswers: number;
}

function formatTime(timeLeftMs: number) {
  const totalSeconds = Math.ceil(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ScoreBoard({
  timeLeftMs,
  score,
  streak,
  bestStreak,
  totalAnswers,
  correctAnswers,
}: ScoreBoardProps) {
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const danger = timeLeftMs <= 10_000;
  const tier = getStreakTier(streak);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl bg-[#16213e] px-4 py-3 shadow-lg shadow-black/20">
      {/* Timer */}
      <div
        className={`flex min-w-20 flex-col items-center rounded-lg border px-3 py-2 ${
          danger
            ? "border-red-400/60 bg-red-500/10"
            : "border-[#cd7f32]/20 bg-[#1a1a2e]/50"
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Tempo
        </span>
        <span
          className={`text-3xl font-black tabular-nums ${
            danger ? "text-red-400" : "text-[#d4a853]"
          }`}
        >
          {formatTime(timeLeftMs)}
        </span>
      </div>

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
            streak >= 15
              ? "text-red-300"
              : streak >= 5
                ? "text-green-400"
                : streak > 0
                  ? "text-[#d4a853]"
                  : "text-[#fffff0]/40"
          }`}
        >
          {streak}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#fffff0]/30">
          {tier.label}
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
