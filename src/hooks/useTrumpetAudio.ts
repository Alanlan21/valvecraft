import { useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import type { TrumpetType } from "../types";

const BASE_URL =
  "https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/trumpet/";

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

// Normalize enharmonics — Tone.js prefere sustenidos
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

/**
 * Bb trumpet: pitch escrito soa 2 semitons ABAIXO do pitch de concerto.
 * Os samples estão em pitch de concerto, então transpomos -2 ao tocar.
 * C trumpet: sem transposição.
 */
export function useTrumpetAudio(trumpetType: TrumpetType = "Bb") {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: TRUMPET_SAMPLES,
      onload: () => {
        loadedRef.current = true;
      },
    }).toDestination();

    samplerRef.current = sampler;

    return () => {
      sampler.dispose();
      samplerRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  const playNote = useCallback(
    async (noteId: string) => {
      if (!samplerRef.current || !loadedRef.current) return;
      try {
        await Tone.start();
        const written = toToneNote(noteId);
        const semitones = trumpetType === "Bb" ? -2 : 0;
        const concert =
          semitones === 0
            ? written
            : (Tone.Frequency(written).transpose(semitones).toNote() as string);
        samplerRef.current.releaseAll(); // stop any previous note before attacking
        samplerRef.current.triggerAttackRelease(concert, "2n");
      } catch {
        // Audio blocked or unavailable — silently ignore
      }
    },
    [trumpetType],
  );

  /** Short dissonant buzz — fallback when the fingering has no known note. */
  const playError = useCallback(async () => {
    try {
      await Tone.start();
      const synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
      }).toDestination();
      synth.triggerAttackRelease("C2", "16n");
      setTimeout(() => synth.dispose(), 500);
    } catch {
      // ignore
    }
  }, []);

  return { playNote, playError };
}
