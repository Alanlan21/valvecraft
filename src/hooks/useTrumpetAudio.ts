import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import type { AudioMode, TrumpetType } from "../types";

const BASE_URL =
  "https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/trumpet/";
const NOTE_DURATION_SECONDS = 0.35;
const NOTE_ATTACK_OFFSET_SECONDS = 0.005;
// Maximum sustain before auto-release (safety cap so notes don't hang forever)
const MAX_SUSTAIN_SECONDS = 8;
const SYNTH_DISPOSE_DELAY_MS = 400;

const TRUMPET_SAMPLES: Record<string, string> = {
  A3: `${BASE_URL}A3.mp3`,
  "A#4": `${BASE_URL}As4.mp3`,
  A5: `${BASE_URL}A5.mp3`,
  C4: `${BASE_URL}C4.mp3`,
  C6: `${BASE_URL}C6.mp3`,
  D5: `${BASE_URL}D5.mp3`,
  "D#4": `${BASE_URL}Ds4.mp3`,
  F3: `${BASE_URL}F3.mp3`,
  F4: `${BASE_URL}F4.mp3`,
  F5: `${BASE_URL}F5.mp3`,
  G4: `${BASE_URL}G4.mp3`,
};

const ENHARMONIC: Record<string, string> = {
  Db4: "C#4",
  Eb4: "D#4",
  Gb4: "F#4",
  Ab3: "G#3",
  Ab4: "G#4",
  Db5: "C#5",
  Eb5: "D#5",
  Gb5: "F#5",
};

function toToneNote(noteId: string): string {
  return ENHARMONIC[noteId] ?? noteId;
}

function isAudioOff(modeRef: { current: AudioMode }) {
  return modeRef.current === "off";
}

export function useTrumpetAudio(
  trumpetType: TrumpetType = "Bb",
  audioMode: AudioMode = "mono",
  onAudioIssue?: (message: string) => void,
) {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const loadedRef = useRef(false);
  const playTokenRef = useRef(0);
  const lastIssueRef = useRef<string | null>(null);
  const onAudioIssueRef = useRef(onAudioIssue);
  onAudioIssueRef.current = onAudioIssue;
  const audioModeRef = useRef(audioMode);
  audioModeRef.current = audioMode;
  // Track the currently attacked note so releaseNote can target it
  const attackedNoteRef = useRef<string | null>(null);
  // Auto-release timer to cap sustain duration
  const sustainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportAudioIssue = useCallback((message: string) => {
    if (lastIssueRef.current === message) return;
    lastIssueRef.current = message;
    onAudioIssueRef.current?.(message);
  }, []);

  const clearAudioIssue = useCallback(() => {
    lastIssueRef.current = null;
  }, []);

  useEffect(() => {
    const loadWarningTimer = window.setTimeout(() => {
      if (!loadedRef.current && !isAudioOff(audioModeRef)) {
        reportAudioIssue(
          "Os samples do trompete ainda nao carregaram. O jogo continua, mas o som pode falhar temporariamente.",
        );
      }
    }, 4000);

    const sampler = new Tone.Sampler({
      urls: TRUMPET_SAMPLES,
      release: 0.04,
      onload: () => {
        loadedRef.current = true;
        window.clearTimeout(loadWarningTimer);
        clearAudioIssue();
      },
    }).toDestination();

    samplerRef.current = sampler;

    return () => {
      window.clearTimeout(loadWarningTimer);
      playTokenRef.current += 1;
      if (sustainTimerRef.current) clearTimeout(sustainTimerRef.current);
      sampler.dispose();
      samplerRef.current = null;
      loadedRef.current = false;
    };
  }, [clearAudioIssue, reportAudioIssue]);

  const playNote = useCallback(
    async (noteId: string) => {
      if (
        isAudioOff(audioModeRef) ||
        !samplerRef.current ||
        !loadedRef.current
      ) {
        return;
      }

      const playToken = (playTokenRef.current += 1);

      try {
        await Tone.start();

        if (
          playToken !== playTokenRef.current ||
          isAudioOff(audioModeRef) ||
          !samplerRef.current
        ) {
          return;
        }

        const written = toToneNote(noteId);
        const semitones = trumpetType === "Bb" ? -2 : 0;
        const concert =
          semitones === 0
            ? written
            : (Tone.Frequency(written).transpose(semitones).toNote() as string);
        const now = Tone.now();

        samplerRef.current.releaseAll(now);
        samplerRef.current.triggerAttackRelease(
          concert,
          NOTE_DURATION_SECONDS,
          now + NOTE_ATTACK_OFFSET_SECONDS,
        );
        clearAudioIssue();
      } catch {
        reportAudioIssue(
          "O navegador bloqueou o audio ou o dispositivo nao respondeu. Toque em um botao da tela para tentar novamente.",
        );
      }
    },
    [clearAudioIssue, reportAudioIssue, trumpetType],
  );

  /**
   * Start sustaining a note — sound continues until releaseNote() is called.
   * Use this in rhythm mode so the note rings while the player holds the keys.
   * A safety timer auto-releases after MAX_SUSTAIN_SECONDS.
   */
  const attackNote = useCallback(
    async (noteId: string) => {
      if (
        isAudioOff(audioModeRef) ||
        !samplerRef.current ||
        !loadedRef.current
      ) {
        return;
      }

      const playToken = (playTokenRef.current += 1);

      try {
        await Tone.start();

        if (
          playToken !== playTokenRef.current ||
          isAudioOff(audioModeRef) ||
          !samplerRef.current
        ) {
          return;
        }

        // Cancel any pending auto-release from a previous attack
        if (sustainTimerRef.current) {
          clearTimeout(sustainTimerRef.current);
          sustainTimerRef.current = null;
        }

        const written = toToneNote(noteId);
        const semitones = trumpetType === "Bb" ? -2 : 0;
        const concert =
          semitones === 0
            ? written
            : (Tone.Frequency(written).transpose(semitones).toNote() as string);
        const now = Tone.now();

        // Release any previously sustained note first
        samplerRef.current.releaseAll(now);
        samplerRef.current.triggerAttack(
          concert,
          now + NOTE_ATTACK_OFFSET_SECONDS,
        );
        attackedNoteRef.current = concert;
        clearAudioIssue();

        // Safety cap: auto-release if the player never releases the keys
        sustainTimerRef.current = setTimeout(() => {
          sustainTimerRef.current = null;
          samplerRef.current?.releaseAll(Tone.now());
          attackedNoteRef.current = null;
        }, MAX_SUSTAIN_SECONDS * 1000);
      } catch {
        reportAudioIssue(
          "O navegador bloqueou o audio ou o dispositivo nao respondeu. Toque em um botao da tela para tentar novamente.",
        );
      }
    },
    [clearAudioIssue, reportAudioIssue, trumpetType],
  );

  /**
   * Stop the currently sustained note (triggered when the player releases all keys).
   */
  const releaseNote = useCallback(() => {
    if (sustainTimerRef.current) {
      clearTimeout(sustainTimerRef.current);
      sustainTimerRef.current = null;
    }
    if (samplerRef.current && attackedNoteRef.current) {
      samplerRef.current.releaseAll(Tone.now());
      attackedNoteRef.current = null;
    }
  }, []);

  const playError = useCallback(async () => {
    if (isAudioOff(audioModeRef)) return;

    const playToken = (playTokenRef.current += 1);

    try {
      await Tone.start();

      if (playToken !== playTokenRef.current || isAudioOff(audioModeRef)) {
        return;
      }

      const synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 },
      }).toDestination();

      synth.triggerAttackRelease("C2", "16n");
      setTimeout(() => synth.dispose(), SYNTH_DISPOSE_DELAY_MS);
      clearAudioIssue();
    } catch {
      reportAudioIssue(
        "O navegador bloqueou o audio ou o dispositivo nao respondeu. Toque em um botao da tela para tentar novamente.",
      );
    }
  }, [clearAudioIssue, reportAudioIssue]);

  const playMetronomeClick = useCallback(
    async (isDownbeat: boolean = false) => {
      if (isAudioOff(audioModeRef)) return;

      const playToken = (playTokenRef.current += 1);

      try {
        await Tone.start();

        if (playToken !== playTokenRef.current || isAudioOff(audioModeRef)) {
          return;
        }

        const synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
        }).toDestination();

        // Higher pitch for downbeat, lower for other beats
        const note = isDownbeat ? "G5" : "C5";
        synth.triggerAttackRelease(note, "32n");
        setTimeout(() => synth.dispose(), SYNTH_DISPOSE_DELAY_MS);
        clearAudioIssue();
      } catch {
        reportAudioIssue(
          "O navegador bloqueou o audio ou o dispositivo nao respondeu. Toque em um botao da tela para tentar novamente.",
        );
      }
    },
    [clearAudioIssue, reportAudioIssue],
  );

  return { playNote, attackNote, releaseNote, playError, playMetronomeClick };
}
