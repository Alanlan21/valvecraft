import { useState } from "react";
import type { GameMode, RangeLevel, NoteType } from "../types";
import { getNotesForMode } from "../utils/noteUtils";

interface ModeSelectorProps {
  onStart: (mode: GameMode) => void;
}

const RANGE_OPTIONS: { value: RangeLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "Iniciante", desc: "C4 – G4 (8 notas)" },
  { value: "intermediate", label: "Intermediário", desc: "G3 – C5 (18 notas)" },
  { value: "advanced", label: "Avançado", desc: "G3 – G5 (25 notas)" },
];

const TYPE_OPTIONS: { value: NoteType; label: string; desc: string }[] = [
  { value: "natural", label: "Naturais", desc: "Apenas notas sem acidente" },
  { value: "flat", label: "Bemóis", desc: "Naturais + bemóis" },
  { value: "sharp", label: "Sustenidos", desc: "Naturais + sustenidos" },
  { value: "chromatic", label: "Cromático", desc: "Todas as notas" },
];

export function ModeSelector({ onStart }: ModeSelectorProps) {
  const [rangeLevel, setRangeLevel] = useState<RangeLevel>("beginner");
  const [noteType, setNoteType] = useState<NoteType>("natural");

  const mode: GameMode = { rangeLevel, noteType };
  const previewNotes = getNotesForMode(mode);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-black tracking-tight text-[#d4a853]">
          Valvecraft
        </h1>
        <p className="text-sm text-[#fffff0]/50">
          Treine o dedilhado do trompete — nota por nota
        </p>
      </div>

      {/* Range Selection */}
      <div className="w-full">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
          Dificuldade
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRangeLevel(opt.value)}
              className={`
                rounded-lg border-2 px-3 py-3 text-left transition-all
                ${
                  rangeLevel === opt.value
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-[#cd7f32]/20 bg-[#16213e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                }
              `}
            >
              <div className="text-sm font-bold">{opt.label}</div>
              <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Note Type Selection */}
      <div className="w-full">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
          Tipo de Notas
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setNoteType(opt.value)}
              className={`
                rounded-lg border-2 px-3 py-3 text-left transition-all
                ${
                  noteType === opt.value
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-[#cd7f32]/20 bg-[#16213e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                }
              `}
            >
              <div className="text-sm font-bold">{opt.label}</div>
              <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Note Preview */}
      <div className="w-full rounded-lg border border-[#cd7f32]/20 bg-[#16213e] p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Notas incluídas ({previewNotes.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {previewNotes.map((n) => (
            <span
              key={n.id}
              className="rounded bg-[#1a1a2e] px-2 py-1 text-xs font-mono text-[#fffff0]/70"
            >
              {n.id}
            </span>
          ))}
        </div>
      </div>

      {/* Controls help */}
      <div className="w-full rounded-lg border border-[#cd7f32]/20 bg-[#16213e] p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
          Controles
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-[#fffff0]/60">
          <div>
            <kbd className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[#d4a853]">
              Q
            </kbd>{" "}
            Válvula 1
          </div>
          <div>
            <kbd className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[#d4a853]">
              W
            </kbd>{" "}
            Válvula 2
          </div>
          <div>
            <kbd className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[#d4a853]">
              E
            </kbd>{" "}
            Válvula 3
          </div>
          <div>
            <kbd className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[#d4a853]">
              ⇧
            </kbd>{" "}
            Slide
          </div>
          <div className="col-span-2">
            <kbd className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[#d4a853]">
              Espaço
            </kbd>{" "}
            Confirmar resposta
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => onStart(mode)}
        disabled={previewNotes.length === 0}
        className={`
          w-full rounded-xl py-4 text-lg font-black uppercase tracking-wider transition-all
          ${
            previewNotes.length > 0
              ? "bg-[#d4a853] text-[#1a1a2e] shadow-lg shadow-[#d4a853]/20 hover:bg-[#e0b86a] hover:shadow-[#d4a853]/40 active:scale-[0.98]"
              : "cursor-not-allowed bg-[#2a2a4a] text-[#fffff0]/30"
          }
        `}
      >
        Iniciar Treino
      </button>
    </div>
  );
}
