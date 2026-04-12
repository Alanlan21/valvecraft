interface GameOverOverlayProps {
  score: number;
  bestStreak: number;
  totalAnswers: number;
  correctAnswers: number;
  onRestart: () => void;
  onExit: () => void;
}

export function GameOverOverlay({
  score,
  bestStreak,
  totalAnswers,
  correctAnswers,
  onRestart,
  onExit,
}: GameOverOverlayProps) {
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1a1a2e]/90 px-4">
      <div className="w-full max-w-md rounded-xl border border-[#cd7f32]/30 bg-[#16213e] p-6 text-center shadow-2xl shadow-black/40">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Fim da corrida
        </p>
        <h2 className="text-4xl font-black tabular-nums text-[#d4a853]">
          {score.toLocaleString()}
        </h2>
        <p className="mt-1 text-sm text-[#fffff0]/40">score final</p>

        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-[#1a1a2e]/70 p-3">
            <div className="text-xs uppercase tracking-wider text-[#cd7f32]/60">
              Acertos
            </div>
            <div className="mt-1 text-xl font-black text-[#fffff0]/70">
              {correctAnswers}/{totalAnswers}
            </div>
          </div>
          <div className="rounded-lg bg-[#1a1a2e]/70 p-3">
            <div className="text-xs uppercase tracking-wider text-[#cd7f32]/60">
              Precisão
            </div>
            <div className="mt-1 text-xl font-black text-[#fffff0]/70">
              {accuracy}%
            </div>
          </div>
          <div className="rounded-lg bg-[#1a1a2e]/70 p-3">
            <div className="text-xs uppercase tracking-wider text-[#cd7f32]/60">
              Streak
            </div>
            <div className="mt-1 text-xl font-black text-[#fffff0]/70">
              {bestStreak}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 rounded-lg bg-[#d4a853] px-4 py-3 text-sm font-black uppercase tracking-wider text-[#1a1a2e] transition-colors hover:bg-[#e0b86a]"
          >
            Jogar de novo
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-[#cd7f32]/30 px-4 py-3 text-sm text-[#cd7f32]/70 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
