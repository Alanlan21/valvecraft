import { useState, useEffect, useCallback, useRef } from "react";
import type { Sheet, NoteHitResult, RhythmSessionResult } from "../types/sheet";
import type { Fingering, TrumpetType, ControlBindings } from "../types";
import { usePlaybackEngine } from "../hooks/usePlaybackEngine";
import {
  useHitDetection,
  calculateSessionResults,
} from "../hooks/useHitDetection";
import { useKeyboardInput } from "../hooks/useKeyboardInput";
import { useTrumpetAudio } from "../hooks/useTrumpetAudio";
import { SheetMusicDisplay } from "./SheetMusicDisplay";
import { ValveIndicator } from "./ValveIndicator";
import { DEFAULT_CONTROL_BINDINGS } from "../utils/controlBindings";
import { normalizeKeyboardEventCode } from "../utils/controlBindings";

interface RhythmModeScreenProps {
  /** The sheet to play */
  sheet: Sheet;
  /** Trumpet type for audio */
  trumpetType: TrumpetType;
  /** Control bindings */
  controlBindings?: ControlBindings;
  /** Callback when player wants to go back */
  onBack: () => void;
  /** Callback when session completes with results */
  onComplete: (result: RhythmSessionResult) => void;
  /** Non-blocking audio issue reporter */
  onAudioIssue?: (message: string) => void;
}

type GamePhase = "ready" | "countdown" | "playing" | "paused" | "complete";

export function RhythmModeScreen({
  sheet,
  trumpetType,
  controlBindings = DEFAULT_CONTROL_BINDINGS,
  onBack,
  onComplete,
  onAudioIssue,
}: RhythmModeScreenProps) {
  // Game phase
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(4);
  const startTimeRef = useRef<number>(0);

  // Note results tracking
  const [noteResults, setNoteResults] = useState<Map<number, NoteHitResult>>(
    new Map(),
  );
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sessionResult, setSessionResult] = useState<RhythmSessionResult | null>(
    null,
  );

  // Audio
  const { attackNote, releaseNote, playMetronomeClick } = useTrumpetAudio(
    trumpetType,
    "mono",
    onAudioIssue,
  );

  // Playback engine
  const [playbackState, playbackControls] = usePlaybackEngine({
    sheet,
    countInBeats: 2, // 1 measure count-in
    onComplete: () => {
      setPhase("complete");
      const results = hitActions.getAllResults();
      const completedSession = calculateSessionResults(
        sheet,
        results,
        Date.now() - startTimeRef.current,
      );
      completedSession.bestCombo = bestCombo;
      setSessionResult(completedSession);
      onComplete(completedSession);
    },
    onBeat: (beat, isDownbeat) => {
      // Play metronome during count-in
      if (beat < 0) {
        playMetronomeClick?.(isDownbeat);
      }
    },
  });

  // Hit detection
  const handleNoteResult = useCallback(
    (result: NoteHitResult) => {
      setNoteResults((prev) => {
        const next = new Map(prev);
        next.set(result.noteIndex, result);
        return next;
      });

      setScore((prev) => prev + result.points);

      // Update combo
      if (result.judgment === "perfect") {
        setCombo((prev) => {
          const newCombo = prev + 1;
          setBestCombo((best) => Math.max(best, newCombo));
          return newCombo;
        });

        // Sustain the note — will ring until the player releases all keys
        attackNote(result.note.pitch.id);
      } else {
        setCombo(0);
      }
    },
    [attackNote],
  );

  // Keyboard input - we don't use submit in rhythm mode
  const { currentInput } = useKeyboardInput(
    phase === "playing" || phase === "countdown",
    () => {}, // onSubmit not used
    controlBindings,
  );

  // Build current fingering from input.
  // For rhythm mode we require an explicit 'open' input (submit binding) to
  // register an open fingering. If no valves are pressed and the submit key
  // is not held, we treat it as "no input" (null) so open notes only fire
  // when the player explicitly presses the configured key.
  const [openPressed, setOpenPressed] = useState(false);
  const openBindingCode = controlBindings.submit.code;
  const openBindingLabel = controlBindings.submit.label;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (normalizeKeyboardEventCode(e) === openBindingCode) {
        if (!e.repeat) setOpenPressed(true);
        e.preventDefault();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (normalizeKeyboardEventCode(e) === openBindingCode) {
        setOpenPressed(false);
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [openBindingCode]);

  const anyValvePressed =
    currentInput.valves.some((v) => v) || currentInput.slide;
  const EMPTY_FINGERING: Fingering = {
    valves: [false, false, false],
    slide: false,
  };
  const effectiveFingering: Fingering | null = anyValvePressed
    ? currentInput
    : openPressed
      ? EMPTY_FINGERING
      : null;

  const displayFingeringForIndicator: Fingering = openPressed
    ? EMPTY_FINGERING
    : currentInput;

  const hitActions = useHitDetection({
    sheet,
    currentBeat: playbackState.currentBeat,
    isPlaying: phase === "playing",
    currentFingering: effectiveFingering,
    onNoteResult: handleNoteResult,
  });

  // Every beat tick OR fingering change: check for hits and misses
  useEffect(() => {
    if (phase === "playing") {
      hitActions.checkNotes();
    }
  }, [playbackState.currentBeat, effectiveFingering, phase, hitActions]);

  // Release sustained note when the player fully releases all keys
  const prevFingeringRef = useRef<typeof effectiveFingering>(null);
  useEffect(() => {
    const prev = prevFingeringRef.current;
    prevFingeringRef.current = effectiveFingering;
    // Transition from holding (non-null) to fully released (null)
    if (prev !== null && effectiveFingering === null) {
      releaseNote();
    }
  }, [effectiveFingering, releaseNote]);

  // Handle countdown
  useEffect(() => {
    if (phase !== "countdown") return;

    const timer = setInterval(
      () => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setPhase("playing");
            playbackControls.play();
            startTimeRef.current = Date.now();
            return 0;
          }
          playMetronomeClick?.(prev === 4); // Downbeat on 4
          return prev - 1;
        });
      },
      (60 / sheet.bpm) * 1000,
    ); // One beat interval

    return () => clearInterval(timer);
  }, [phase, sheet.bpm, playbackControls, playMetronomeClick]);

  // Start the game
  const handleStart = () => {
    setPhase("countdown");
    setCountdown(4);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setSessionResult(null);
    setNoteResults(new Map());
    hitActions.reset();
  };

  // Pause/resume
  const handlePause = () => {
    if (phase === "playing") {
      releaseNote(); // stop any held note on pause
      playbackControls.pause();
      setPhase("paused");
    } else if (phase === "paused") {
      playbackControls.play();
      setPhase("playing");
    }
  };

  // Restart
  const handleRestart = () => {
    releaseNote(); // stop any held note on restart
    playbackControls.stop();
    setNoteResults(new Map());
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setSessionResult(null);
    hitActions.reset();
    setPhase("ready");
  };

  // Calculate accuracy
  const totalNotes = sheet.notes.length;
  const hitNotes = noteResults.size;
  const maxPossibleScore = totalNotes * 100;
  const accuracy = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          ← Voltar
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{sheet.title}</h1>
          {sheet.composer && (
            <p className="text-sm text-slate-400">{sheet.composer}</p>
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-mono text-amber-400">
            {sheet.bpm} BPM
          </div>
          <div className="text-sm text-slate-400">
            {sheet.timeSignature.beats}/{sheet.timeSignature.beatValue}
          </div>
        </div>
      </div>

      {/* Sheet Music Display */}
      <SheetMusicDisplay
        sheet={sheet}
        currentBeat={playbackState.currentBeat}
        noteResults={noteResults}
        showPlayhead={phase === "playing" || phase === "paused"}
        height={200}
      />

      {/* Score and Stats */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{score}</div>
          <div className="text-xs text-slate-400">Pontos</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-400">{combo}x</div>
          <div className="text-xs text-slate-400">Combo</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">
            {accuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Precisão</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-300">
            {hitNotes}/{totalNotes}
          </div>
          <div className="text-xs text-slate-400">Notas</div>
        </div>
      </div>

      {/* Valve Indicator */}
      <div className="flex justify-center">
        <ValveIndicator
          controlBindings={controlBindings}
          currentInput={displayFingeringForIndicator}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {phase === "ready" && (
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-colors shadow-lg"
          >
            ▶ Começar
          </button>
        )}

        {phase === "countdown" && (
          <div className="text-6xl font-bold text-amber-400 animate-pulse">
            {countdown}
          </div>
        )}

        {(phase === "playing" || phase === "paused") && (
          <>
            <button
              onClick={handlePause}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
            >
              {phase === "playing" ? "⏸ Pausar" : "▶ Continuar"}
            </button>
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold transition-colors"
            >
              ↺ Reiniciar
            </button>
          </>
        )}

        {phase === "complete" && (
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-4">
              Completo!
            </div>
            {sessionResult && (
              <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-800/40 p-4 text-sm text-slate-300 sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Pontos
                  </div>
                  <div className="text-lg font-bold text-white">
                    {sessionResult.score}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Precisao
                  </div>
                  <div className="text-lg font-bold text-emerald-400">
                    {sessionResult.accuracy.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Dedilhado
                  </div>
                  <div className="text-lg font-bold text-amber-400">
                    {sessionResult.judgments.wrongFingering}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Combo
                  </div>
                  <div className="text-lg font-bold text-white">
                    {sessionResult.bestCombo}x
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
              >
                ↺ Tentar Novamente
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold transition-colors"
              >
                ← Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      {(phase === "ready" || phase === "paused") && (
        <div className="text-center text-sm text-slate-500">
          Use as teclas{" "}
          <kbd className="px-2 py-0.5 bg-slate-700 rounded">
            {controlBindings.valve1.label}
          </kbd>{" "}
          <kbd className="px-2 py-0.5 bg-slate-700 rounded">
            {controlBindings.valve2.label}
          </kbd>{" "}
          <kbd className="px-2 py-0.5 bg-slate-700 rounded">
            {controlBindings.valve3.label}
          </kbd>{" "}
          para as válvulas e{" "}
          <kbd className="px-2 py-0.5 bg-slate-700 rounded">
            {controlBindings.slide.label}
          </kbd>{" "}
          para o slide
          <div className="mt-2 text-sm text-slate-400">
            Ou pressione{" "}
            <kbd className="px-2 py-0.5 bg-slate-700 rounded">
              {openBindingLabel}
            </kbd>{" "}
            para nota aberta
          </div>
        </div>
      )}

      {/* Progress bar */}
      {(phase === "playing" || phase === "paused" || phase === "complete") && (
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-green-500 to-emerald-400 transition-all duration-100"
            style={{ width: `${playbackState.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
