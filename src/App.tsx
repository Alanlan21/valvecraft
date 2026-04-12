import { useState } from "react";
import type { GameMode, GameScreen } from "./types";
import { useControlBindings } from "./hooks/useControlBindings";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ModeSelector } from "./components/ModeSelector";
import { GameScreen as GameView } from "./components/GameScreen";

function App() {
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [mode, setMode] = useState<GameMode | null>(null);
  const [highScore, setHighScore] = useLocalStorage("valvecraft:highScore", 0);
  const [bestStreak, setBestStreak] = useLocalStorage(
    "valvecraft:bestStreak",
    0,
  );
  const {
    bindings: controlBindings,
    setBindings: setControlBindings,
    resetBindings: resetControlBindings,
  } = useControlBindings();

  function handleStart(selectedMode: GameMode) {
    setMode(selectedMode);
    setScreen("game");
  }

  function handleExit() {
    setScreen("menu");
    setMode(null);
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#fffff0]">
      {screen === "menu" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <ModeSelector
            controlBindings={controlBindings}
            onControlBindingsChange={setControlBindings}
            onControlBindingsReset={resetControlBindings}
            onStart={handleStart}
          />

          {/* Persistent stats */}
          {(highScore > 0 || bestStreak > 0) && (
            <div className="mt-6 flex gap-6 text-sm text-[#fffff0]/30">
              <span>
                Recorde:{" "}
                <span className="font-bold text-[#d4a853]/60">
                  {highScore.toLocaleString()}
                </span>
              </span>
              <span>
                Melhor streak:{" "}
                <span className="font-bold text-[#d4a853]/60">
                  {bestStreak}
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      {screen === "game" && mode && (
        <GameView
          controlBindings={controlBindings}
          mode={mode}
          onExit={handleExit}
          onScoreUpdate={(score, streak) => {
            if (score > highScore) setHighScore(score);
            if (streak > bestStreak) setBestStreak(streak);
          }}
        />
      )}
    </div>
  );
}

export default App;
