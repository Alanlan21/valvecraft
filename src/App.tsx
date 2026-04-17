import { useState } from "react";
import type {
  AudioMode,
  GameMode,
  GameScreen,
  TrumpetType,
  Sheet,
  RhythmSessionResult,
} from "./types";
import { useControlBindings } from "./hooks/useControlBindings";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ModeSelector } from "./components/ModeSelector";
import { GameScreen as GameView } from "./components/GameScreen";
import { SheetSelector } from "./components/SheetSelector";
import { RhythmModeScreen } from "./components/RhythmModeScreen";

function App() {
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [mode, setMode] = useState<GameMode | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [trumpetType, setTrumpetType] = useState<TrumpetType>("Bb");
  const [highScore, setHighScore] = useLocalStorage("valvecraft:highScore", 0);
  const [bestStreak, setBestStreak] = useLocalStorage(
    "valvecraft:bestStreak",
    0,
  );
  const [audioMode, setAudioMode] = useLocalStorage<AudioMode>(
    "valvecraft:audioMode",
    "mono",
  );
  const {
    bindings: controlBindings,
    setBindings: setControlBindings,
    resetBindings: resetControlBindings,
  } = useControlBindings();

  function handleStart(selectedMode: GameMode) {
    setMode(selectedMode);
    setTrumpetType(selectedMode.trumpetType);
    setScreen("game");
  }

  function handleRhythmMode(selectedTrumpetType: TrumpetType) {
    setTrumpetType(selectedTrumpetType);
    setScreen("rhythm-select");
  }

  function handleSheetSelect(sheet: Sheet) {
    setSelectedSheet(sheet);
    setScreen("rhythm-play");
  }

  function handleRhythmComplete(result: RhythmSessionResult) {
    // TODO: Save rhythm mode scores
    console.log("Rhythm session complete:", result);
  }

  function handleExit() {
    setScreen("menu");
    setMode(null);
    setSelectedSheet(null);
  }

  function handleBackToSheetSelect() {
    setScreen("rhythm-select");
    setSelectedSheet(null);
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#fffff0]">
      {screen === "menu" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <ModeSelector
            audioMode={audioMode}
            controlBindings={controlBindings}
            onAudioModeChange={setAudioMode}
            onControlBindingsChange={setControlBindings}
            onControlBindingsReset={resetControlBindings}
            onStart={handleStart}
            onRhythmMode={handleRhythmMode}
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
          audioMode={audioMode}
          controlBindings={controlBindings}
          mode={mode}
          onExit={handleExit}
          onScoreUpdate={(score, streak) => {
            if (score > highScore) setHighScore(score);
            if (streak > bestStreak) setBestStreak(streak);
          }}
        />
      )}

      {screen === "rhythm-select" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <SheetSelector onSelect={handleSheetSelect} onBack={handleExit} />
        </div>
      )}

      {screen === "rhythm-play" && selectedSheet && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <RhythmModeScreen
            sheet={selectedSheet}
            trumpetType={trumpetType}
            onBack={handleBackToSheetSelect}
            onComplete={handleRhythmComplete}
          />
        </div>
      )}
    </div>
  );
}

export default App;
