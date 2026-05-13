import { HeatBar } from "./HeatBar";

interface ScoreBoardProps {
  timeLeftMs: number;
  trainingMode?: boolean;
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
  trainingMode = false,
  score,
  streak,
  bestStreak,
  totalAnswers,
  correctAnswers,
}: ScoreBoardProps) {
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const danger = !trainingMode && timeLeftMs <= 10_000;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-[#16213e] px-3 py-2 shadow-lg shadow-black/20 sm:px-4 sm:py-3">
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {/* Timer */}
        <div
          className={`flex min-w-14 flex-col items-center rounded-lg border px-2 py-1.5 sm:min-w-20 sm:px-3 sm:py-2 ${
            danger
              ? "border-red-400/60 bg-red-500/10"
              : "border-[#cd7f32]/20 bg-[#1a1a2e]/50"
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#cd7f32]/60 sm:text-xs">
            {trainingMode ? "Modo" : "Tempo"}
          </span>
          <span
            className={`text-xl font-black tabular-nums sm:text-3xl ${
              danger ? "text-red-400" : "text-[#d4a853]"
            }`}
          >
            {trainingMode ? "Livre" : formatTime(timeLeftMs)}
          </span>
        </div>

        {/* Score — hidden in training mode */}
        {!trainingMode && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#cd7f32]/60 sm:text-xs">
                Score
              </span>
              <span className="text-lg font-black tabular-nums text-[#d4a853] sm:text-2xl">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="h-8 w-px bg-[#cd7f32]/20 sm:h-10" />
          </>
        )}

        {/* Streak */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#cd7f32]/60 sm:text-xs">
            Streak
          </span>
          <span
            className={`text-lg font-black tabular-nums sm:text-2xl ${
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
        </div>

        {/* Best Streak — hidden on mobile */}
        <div className="hidden h-10 w-px bg-[#cd7f32]/20 sm:block" />
        <div className="hidden flex-col items-center sm:flex">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
            Melhor
          </span>
          <span className="text-2xl font-black tabular-nums text-[#fffff0]/60">
            {bestStreak}
          </span>
        </div>

        {/* Accuracy — hidden on mobile */}
        <div className="hidden h-10 w-px bg-[#cd7f32]/20 sm:block" />
        <div className="hidden flex-col items-center sm:flex">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
            Acertos
          </span>
          <span className="text-2xl font-black tabular-nums text-[#fffff0]/60">
            {accuracy}%
          </span>
        </div>
      </div>

      {/* Heat bar — spans full width at the bottom */}
      <HeatBar streak={streak} />
    </div>
  );
}
