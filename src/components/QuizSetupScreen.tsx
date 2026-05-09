import { useMemo, useState } from "react";
import type {
  GameMode,
  NoteType,
  QuizMode,
  RangeLevel,
  TrumpetType,
} from "../types";
import { getNotesForMode } from "../utils/noteUtils";
import { HelpModal, HelpSection, HelpItem } from "./HelpModal";

interface QuizSetupScreenProps {
  trumpetType: TrumpetType;
  highScore: number;
  bestStreak: number;
  onBack: () => void;
  onStart: (mode: GameMode) => void;
}

const RANGE_OPTIONS: { value: RangeLevel; label: string; desc: string }[] = [
  {
    value: "beginner",
    label: "Iniciante",
    desc: "Faixa curta e confortável.",
  },
  {
    value: "intermediate",
    label: "Intermediário",
    desc: "Registro mais comum.",
  },
  {
    value: "advanced",
    label: "Avançado",
    desc: "Faixa prática completa.",
  },
  {
    value: "extreme",
    label: "Extremo",
    desc: "De F#3 até C6.",
  },
];

const TYPE_OPTIONS: { value: NoteType; label: string; desc: string }[] = [
  {
    value: "natural",
    label: "Naturais",
    desc: "Sem sustenidos ou bemóis.",
  },
  {
    value: "accidental",
    label: "Acidentes",
    desc: "Com sustenidos e bemóis.",
  },
];

const QUIZ_MODE_OPTIONS: {
  value: QuizMode;
  label: string;
  desc: string;
}[] = [
  {
    value: "challenge",
    label: "Desafio",
    desc: "Com tempo e recorde.",
  },
  {
    value: "training",
    label: "Treino",
    desc: "Sem tempo, com dedilhado livre.",
  },
];

export function QuizSetupScreen({
  trumpetType,
  highScore,
  bestStreak,
  onBack,
  onStart,
}: QuizSetupScreenProps) {
  const [rangeLevel, setRangeLevel] = useState<RangeLevel>("beginner");
  const [noteType, setNoteType] = useState<NoteType>("natural");
  const [quizMode, setQuizMode] = useState<QuizMode>("challenge");
  const [showHelp, setShowHelp] = useState(false);

  const mode = useMemo<GameMode>(
    () => ({ rangeLevel, noteType, trumpetType, quizMode }),
    [noteType, quizMode, rangeLevel, trumpetType],
  );
  const previewNotes = getNotesForMode(mode);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      {showHelp && (
        <HelpModal
          title="Como jogar — Modo Quiz"
          onClose={() => setShowHelp(false)}
        >
          <HelpSection title="Objetivo">
            <HelpItem>
              Uma nota aparece na pauta. Pressione as válvulas corretas do
              trompete para tocar aquela nota.
            </HelpItem>
            <HelpItem>
              Use as teclas configuradas para pressionar as válvulas 1, 2 e 3 e
              o slide. Para nota aberta (sem válvulas), pressione a tecla de
              confirmar.
            </HelpItem>
          </HelpSection>
          <HelpSection title="Modo Desafio">
            <HelpItem>
              Você começa com um tempo limitado. Cada acerto ganha alguns
              segundos; cada erro perde. O jogo termina quando o tempo zera.
            </HelpItem>
            <HelpItem>
              O score aumenta com velocidade de resposta e sequência (streak) de
              acertos consecutivos.
            </HelpItem>
            <HelpItem>
              Seu recorde e melhor streak ficam salvos automaticamente.
            </HelpItem>
          </HelpSection>
          <HelpSection title="Modo Treino">
            <HelpItem>
              Sem tempo nem score — ideal para aprender os dedilhados com calma.
            </HelpItem>
            <HelpItem>
              Use o botão{" "}
              <strong className="text-[#fffff0]/90">Ver dedilhado</strong> para
              ver o dedilhado correto antes de responder.
            </HelpItem>
          </HelpSection>
          <HelpSection title="Dica">
            <HelpItem>
              Comece pelo nível Iniciante com notas Naturais e vá aumentando a
              dificuldade conforme ganhar confiança.
            </HelpItem>
          </HelpSection>
        </HelpModal>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-[#cd7f32]/30 px-4 py-2 text-sm text-[#cd7f32]/70 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
        >
          ← Voltar
        </button>

        <div className="flex items-center gap-2">
          <div className="text-center">
            <h1 className="text-gradient-gold text-3xl font-black">
              Configurar Quiz
            </h1>
            <p className="mt-1 text-sm text-[#fffff0]/45">
              Escolha o modo e a faixa antes de começar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            title="Como jogar"
            className="mb-4 flex h-6 w-6 items-center justify-center rounded-full border border-[#cd7f32]/30 text-xs font-bold text-[#cd7f32]/50 transition-colors hover:border-[#cd7f32]/70 hover:text-[#cd7f32]"
          >
            ?
          </button>
        </div>

        <div className="rounded-lg border border-[#cd7f32]/20 bg-[#16213e] px-3 py-2 text-right text-sm text-[#fffff0]/60">
          <div className="text-xs uppercase tracking-wider text-[#cd7f32]/60">
            Afinação ativa
          </div>
          <div className="font-semibold text-[#d4a853]">{trumpetType}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="order-1 rounded-xl border border-[#cd7f32]/20 bg-[#16213e] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
            Modo
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {QUIZ_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setQuizMode(opt.value)}
                className={`rounded-lg border-2 px-3 py-3 text-left transition-all ${
                  quizMode === opt.value
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                }`}
              >
                <div className="text-sm font-bold">{opt.label}</div>
                <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="order-3 rounded-xl border border-[#cd7f32]/20 bg-[#16213e] p-4 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
            Dificuldade
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRangeLevel(opt.value)}
                className={`min-h-24 rounded-lg border-2 px-3 py-3 text-left transition-all xl:min-h-28 ${
                  rangeLevel === opt.value
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                }`}
              >
                <div className="text-sm font-bold">{opt.label}</div>
                <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="order-2 rounded-xl border border-[#cd7f32]/20 bg-[#16213e] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
            Tipo de Notas
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNoteType(opt.value)}
                className={`rounded-lg border-2 px-3 py-3 text-left transition-all ${
                  noteType === opt.value
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                }`}
              >
                <div className="text-sm font-bold">{opt.label}</div>
                <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-xl border border-[#cd7f32]/20 bg-[#16213e] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
              Notas Incluídas
            </h2>
            <span className="text-xs text-[#fffff0]/45">
              {previewNotes.length} notas
            </span>
          </div>

          <p className="mb-3 text-sm text-[#fffff0]/50">
            {quizMode === "training" ? "Treino" : "Desafio"} com{" "}
            {previewNotes.length} notas.
          </p>

          <div className="flex flex-wrap gap-2">
            {previewNotes.map((note) => (
              <span
                key={note.id}
                className="rounded bg-[#1a1a2e] px-2 py-1 text-xs font-mono text-[#fffff0]/70"
              >
                {note.id}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#cd7f32]/20 bg-[#16213e] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
            Seu Melhor Quiz
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#1a1a2e]/70 p-3 text-center">
              <div className="text-xs uppercase tracking-wider text-[#cd7f32]/60">
                Recorde
              </div>
              <div className="mt-1 text-xl font-black text-[#d4a853]">
                {highScore.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-[#1a1a2e]/70 p-3 text-center">
              <div className="text-xs uppercase tracking-wider text-[#cd7f32]/60">
                Melhor Streak
              </div>
              <div className="mt-1 text-xl font-black text-[#fffff0]/75">
                {bestStreak}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStart(mode)}
            disabled={previewNotes.length === 0}
            className={`mt-4 w-full rounded-xl py-3 text-lg font-black uppercase tracking-wider transition-all ${
              previewNotes.length > 0
                ? "bg-linear-to-br from-[#d4a853] to-[#a86d20] text-[#1a1a2e] shadow-lg shadow-[#d4a853]/20 hover:shadow-[#d4a853]/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
                : "cursor-not-allowed bg-[#2a2a4a] text-[#fffff0]/30"
            }`}
          >
            {quizMode === "training" ? "Começar Treino" : "Começar Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
