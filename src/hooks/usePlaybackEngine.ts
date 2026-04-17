import { useState, useCallback, useRef, useEffect } from "react";
import type { Sheet, TimeSignature } from "../types/sheet";

export interface PlaybackState {
  /** Is the playback currently running? */
  isPlaying: boolean;
  /** Is the playback paused? (vs stopped) */
  isPaused: boolean;
  /** Current position in beats (0.0, 0.5, 1.0, etc.) */
  currentBeat: number;
  /** Current measure number (1-indexed) */
  currentMeasure: number;
  /** Current beat within the measure (1-indexed, e.g., 1, 2, 3, 4 in 4/4) */
  beatInMeasure: number;
  /** Current BPM */
  bpm: number;
  /** Total beats in the sheet */
  totalBeats: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Has the sheet completed? */
  isComplete: boolean;
}

export interface PlaybackControls {
  /** Start playback from current position */
  play: () => void;
  /** Pause playback (keeps position) */
  pause: () => void;
  /** Stop playback and reset to beginning */
  stop: () => void;
  /** Restart from the beginning */
  restart: () => void;
  /** Seek to a specific beat */
  seekToBeat: (beat: number) => void;
  /** Change the BPM */
  setBpm: (bpm: number) => void;
}

interface UsePlaybackEngineOptions {
  /** Sheet to play */
  sheet: Sheet;
  /** Number of count-in beats before starting (default: 4 = 1 measure in 4/4) */
  countInBeats?: number;
  /** Callback when playback completes */
  onComplete?: () => void;
  /** Callback on each beat (for metronome clicks) */
  onBeat?: (beat: number, isDownbeat: boolean) => void;
}

/**
 * Calculate total beats in a sheet
 */
function calculateTotalBeats(sheet: Sheet): number {
  if (sheet.notes.length === 0) return 0;

  // Find the last note and add its duration
  const lastNote = sheet.notes[sheet.notes.length - 1];
  return lastNote.startBeat + lastNote.duration;
}

/**
 * Calculate current measure and beat within measure
 */
function calculateMeasureInfo(
  currentBeat: number,
  timeSignature: TimeSignature,
): { measure: number; beatInMeasure: number } {
  const beatsPerMeasure = timeSignature.beats;
  const measure = Math.floor(currentBeat / beatsPerMeasure) + 1;
  const beatInMeasure = (currentBeat % beatsPerMeasure) + 1;

  return { measure, beatInMeasure };
}

/**
 * Hook to control playback timing for sheet music.
 * Uses requestAnimationFrame for smooth, precise timing.
 */
export function usePlaybackEngine({
  sheet,
  countInBeats = 0,
  onComplete,
  onBeat,
}: UsePlaybackEngineOptions): [PlaybackState, PlaybackControls] {
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-countInBeats);
  const [bpm, setBpmState] = useState(sheet.bpm);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for animation frame
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Calculated values
  const totalBeats = calculateTotalBeats(sheet);
  const msPerBeat = (60 / bpm) * 1000;
  const { measure: currentMeasure, beatInMeasure } = calculateMeasureInfo(
    Math.max(0, currentBeat),
    sheet.timeSignature,
  );

  // Animation loop
  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Calculate beat progress
      const beatDelta = deltaMs / msPerBeat;

      setCurrentBeat((prev) => {
        const newBeat = prev + beatDelta;

        // Check for beat change (for metronome callback)
        const prevWholeBeat = Math.floor(prev);
        const newWholeBeat = Math.floor(newBeat);

        if (newWholeBeat > prevWholeBeat && newWholeBeat >= 0 && onBeat) {
          const isDownbeat = newWholeBeat % sheet.timeSignature.beats === 0;
          onBeat(newWholeBeat, isDownbeat);
        }

        // Check for completion
        if (newBeat >= totalBeats) {
          setIsComplete(true);
          setIsPlaying(false);
          onComplete?.();
          return totalBeats;
        }

        return newBeat;
      });

      // Continue animation
      animationRef.current = requestAnimationFrame(tick);
    },
    [msPerBeat, totalBeats, sheet.timeSignature.beats, onBeat, onComplete],
  );

  // Start/stop animation based on isPlaying
  useEffect(() => {
    if (isPlaying && !isComplete) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, isComplete, tick]);

  // Reset when sheet changes
  useEffect(() => {
    setCurrentBeat(-countInBeats);
    setIsPlaying(false);
    setIsPaused(false);
    setIsComplete(false);
    setBpmState(sheet.bpm);
  }, [sheet, countInBeats]);

  // Controls
  const play = useCallback(() => {
    if (isComplete) {
      // Restart if completed
      setCurrentBeat(-countInBeats);
      setIsComplete(false);
    }
    setIsPlaying(true);
    setIsPaused(false);
  }, [isComplete, countInBeats]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentBeat(-countInBeats);
    setIsComplete(false);
  }, [countInBeats]);

  const restart = useCallback(() => {
    setCurrentBeat(-countInBeats);
    setIsComplete(false);
    setIsPlaying(true);
    setIsPaused(false);
  }, [countInBeats]);

  const seekToBeat = useCallback(
    (beat: number) => {
      const clampedBeat = Math.max(-countInBeats, Math.min(beat, totalBeats));
      setCurrentBeat(clampedBeat);
      setIsComplete(clampedBeat >= totalBeats);
    },
    [countInBeats, totalBeats],
  );

  const setBpm = useCallback((newBpm: number) => {
    setBpmState(Math.max(30, Math.min(300, newBpm)));
  }, []);

  // Build state object
  const state: PlaybackState = {
    isPlaying,
    isPaused,
    currentBeat,
    currentMeasure,
    beatInMeasure,
    bpm,
    totalBeats,
    progress: Math.max(0, (currentBeat / totalBeats) * 100),
    isComplete,
  };

  const controls: PlaybackControls = {
    play,
    pause,
    stop,
    restart,
    seekToBeat,
    setBpm,
  };

  return [state, controls];
}
