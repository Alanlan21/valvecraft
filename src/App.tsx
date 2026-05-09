import { useCallback, useEffect, useState } from "react";
import * as Tone from "tone";
import type {
  AudioMode,
  GameMode,
  GameScreen,
  TrumpetType,
  Sheet,
  RhythmSessionResult,
  RhythmStoredResults,
} from "./types";
import { useControlBindings } from "./hooks/useControlBindings";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ModeSelector } from "./components/ModeSelector";
import { QuizSetupScreen } from "./components/QuizSetupScreen";
import { GameScreen as GameView } from "./components/GameScreen";
import { SheetSelector } from "./components/SheetSelector";
import { RhythmModeScreen } from "./components/RhythmModeScreen";

function App() {
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [mode, setMode] = useState<GameMode | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [trumpetType, setTrumpetType] = useLocalStorage<TrumpetType>(
    "valvecraft:trumpetType",
    "Bb",
  );
  const [highScore, setHighScore] = useLocalStorage("valvecraft:highScore", 0);
  const [bestStreak, setBestStreak] = useLocalStorage(
    "valvecraft:bestStreak",
    0,
  );
  const [audioMode, setAudioMode] = useLocalStorage<AudioMode>(
    "valvecraft:audioMode",
    "mono",
  );
  const [rhythmBestResults, setRhythmBestResults] =
    useLocalStorage<RhythmStoredResults>("valvecraft:rhythmBestResults", {});
  const [appNotice, setAppNotice] = useState<{
    message: string;
    persistent: boolean;
  } | null>(null);
  const {
    bindings: controlBindings,
    setBindings: setControlBindings,
    resetBindings: resetControlBindings,
  } = useControlBindings();

  const pushNotice = useCallback((message: string, persistent = false) => {
    setAppNotice({ message, persistent });
  }, []);

  // Unlock the AudioContext on the first user gesture anywhere in the app.
  // This must be global so the context is running before GameScreen's first
  // note plays (which happens 450 ms after mount, before any user tap).
  useEffect(() => {
    function unlock() {
      Tone.start();
    }
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!appNotice || appNotice.persistent) return;
    const timer = window.setTimeout(() => setAppNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [appNotice]);

  useEffect(() => {
    try {
      localStorage.setItem("valvecraft:storage-check", "ok");
      localStorage.removeItem("valvecraft:storage-check");
    } catch {
      pushNotice(
        "Nao foi possivel acessar o armazenamento local. Seus recordes nao serao salvos neste navegador.",
        true,
      );
    }
  }, [pushNotice]);

  function handleStart(selectedMode: GameMode) {
    setMode(selectedMode);
    setTrumpetType(selectedMode.trumpetType);
    setScreen("game");
  }

  function handleQuizMode() {
    setScreen("quiz-setup");
  }

  function handleRhythmMode() {
    setScreen("rhythm-select");
  }

  function handleSheetSelect(sheet: Sheet) {
    setSelectedSheet(sheet);
    setScreen("rhythm-play");
  }

  function handleRhythmComplete(result: RhythmSessionResult) {
    setRhythmBestResults((prev) => {
      const current = prev[result.sheet.id];

      return {
        ...prev,
        [result.sheet.id]: {
          bestScore: Math.max(current?.bestScore ?? 0, result.score),
          bestAccuracy: Math.max(current?.bestAccuracy ?? 0, result.accuracy),
          bestCombo: Math.max(current?.bestCombo ?? 0, result.bestCombo),
          attempts: (current?.attempts ?? 0) + 1,
          lastPlayedAt: Date.now(),
        },
      };
    });
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
    <div className="min-h-screen text-[#fffff0]">
      {appNotice && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="flex max-w-3xl items-start gap-3 rounded-xl border border-amber-500/30 bg-[#16213e]/95 px-4 py-3 text-sm text-[#fffff0] shadow-xl shadow-black/40 backdrop-blur">
            <span className="mt-0.5 text-amber-400">Aviso</span>
            <span className="flex-1 text-[#fffff0]/85">
              {appNotice.message}
            </span>
            <button
              type="button"
              onClick={() => setAppNotice(null)}
              className="text-[#fffff0]/45 transition-colors hover:text-[#fffff0]/80"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {screen === "menu" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <ModeSelector
            audioMode={audioMode}
            controlBindings={controlBindings}
            trumpetType={trumpetType}
            onAudioModeChange={setAudioMode}
            onTrumpetTypeChange={setTrumpetType}
            onControlBindingsChange={setControlBindings}
            onControlBindingsReset={resetControlBindings}
            onQuizMode={handleQuizMode}
            onRhythmMode={handleRhythmMode}
          />
        </div>
      )}

      {screen === "quiz-setup" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <QuizSetupScreen
            trumpetType={trumpetType}
            highScore={highScore}
            bestStreak={bestStreak}
            onBack={handleExit}
            onStart={handleStart}
          />
        </div>
      )}

      {screen === "game" && mode && (
        <GameView
          audioMode={audioMode}
          controlBindings={controlBindings}
          mode={mode}
          onExit={handleExit}
          onAudioIssue={pushNotice}
          onScoreUpdate={(score, streak) => {
            if (mode.quizMode === "training") return;
            if (score > highScore) setHighScore(score);
            if (streak > bestStreak) setBestStreak(streak);
          }}
        />
      )}

      {screen === "rhythm-select" && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <SheetSelector
            onSelect={handleSheetSelect}
            onBack={handleExit}
            bestResults={rhythmBestResults}
            controlBindings={controlBindings}
          />
        </div>
      )}

      {screen === "rhythm-play" && selectedSheet && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <RhythmModeScreen
            sheet={selectedSheet}
            trumpetType={trumpetType}
            controlBindings={controlBindings}
            onBack={handleBackToSheetSelect}
            onComplete={handleRhythmComplete}
            onAudioIssue={pushNotice}
          />
        </div>
      )}
    </div>
  );
}

export default App;
