import { useState, useEffect, useRef, useCallback } from "react";
import type { Note, RangeLevel, TrumpetType } from "../types";
import { getNotesForMode, getRandomNote } from "../utils/noteUtils";
import { StaffDisplay } from "./StaffDisplay";
import { useTrumpetAudio } from "../hooks/useTrumpetAudio";

interface NoteReadingScreenProps {
  trumpetType: TrumpetType;
  onBack: () => void;
  onAudioIssue?: (msg: string) => void;
}

const RANGE_OPTIONS: { value: RangeLevel; label: string }[] = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Médio" },
  { value: "advanced", label: "Avançado" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build 4 options (1 correct + 3 distractors), deduplicated by note name. */
function buildOptions(correct: Note, pool: Note[]): Note[] {
  const byName = new Map<string, Note>();
  for (const n of pool) {
    if (!byName.has(n.name)) byName.set(n.name, n);
  }
  const unique = Array.from(byName.values());
  const distractors = shuffle(
    unique.filter((n) => n.name !== correct.name),
  ).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

type Phase = "question" | "correct" | "wrong";

export function NoteReadingScreen({
  trumpetType,
  onBack,
  onAudioIssue,
}: NoteReadingScreenProps) {
  const [rangeLevel, setRangeLevel] = useState<RangeLevel>("beginner");
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [options, setOptions] = useState<Note[]>([]);
  const [phase, setPhase] = useState<Phase>("question");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [hits, setHits] = useState(0);

  const notePoolRef = useRef<Note[]>([]);
  const streakRef = useRef(streak);
  streakRef.current = streak;

  const { playNote, playError } = useTrumpetAudio(trumpetType, "mono", onAudioIssue);

  const nextNote = useCallback((pool: Note[], prevId?: string) => {
    const note = getRandomNote(pool, prevId);
    setCurrentNote(note);
    setOptions(buildOptions(note, pool));
    setPhase("question");
    setSelectedId(null);
  }, []);

  // Rebuild pool when range or trumpetType changes and reset counters
  useEffect(() => {
    const pool = getNotesForMode({
      rangeLevel,
      noteType: "natural",
      trumpetType,
      quizMode: "training",
    });
    notePoolRef.current = pool;
    setScore(0);
    setStreak(0);
    setTotal(0);
    setHits(0);
    nextNote(pool);
  }, [rangeLevel, trumpetType, nextNote]);

  function handleAnswer(chosen: Note) {
    if (phase !== "question" || !currentNote) return;

    const correct = chosen.name === currentNote.name;
    setSelectedId(chosen.id);
    setTotal((t) => t + 1);

    if (correct) {
      const newStreak = streakRef.current + 1;
      setStreak(newStreak);
      setHits((h) => h + 1);
      setScore((s) => s + 10 + (newStreak - 1) * 2);
      setPhase("correct");
      playNote(currentNote.id);
      const prevId = currentNote.id;
      setTimeout(() => {
        nextNote(notePoolRef.current, prevId);
      }, 750);
    } else {
      setStreak(0);
      setPhase("wrong");
      playError();
      setTimeout(() => {
        setPhase("question");
        setSelectedId(null);
      }, 650);
    }
  }

  const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;

  return (
    <div className="flex w-full max-w-lg flex-col gap-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-[#cd7f32]/30 px-4 py-2 text-sm text-[#cd7f32]/70 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
        >
          ← Voltar
        </button>
        <h1 className="text-gradient-gold text-lg font-black">
          Leitura de Notas
        </h1>
        <div className="text-right">
          <div className="text-xl font-black tabular-nums text-[#d4a853]">
            {score}
          </div>
          <div className="text-xs text-[#fffff0]/40">{accuracy}% acertos</div>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRangeLevel(opt.value)}
            className={`flex-1 rounded-lg border py-2 text-xs font-bold uppercase tracking-wide transition-all ${
              rangeLevel === opt.value
                ? "border-[#d4a853] bg-[#d4a853]/15 text-[#d4a853]"
                : "border-[#cd7f32]/20 bg-[#16213e] text-[#fffff0]/50 hover:border-[#cd7f32]/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <p className="text-center text-sm text-[#fffff0]/45">
        Qual é essa nota?
      </p>

      {/* Staff — label hidden until correct answer */}
      {currentNote && (
        <StaffDisplay
          note={currentNote}
          trumpetType={trumpetType}
          hideLabel={phase !== "correct"}
        />
      )}

      {/* Streak badge */}
      {streak >= 3 && (
        <p className="text-center text-sm font-bold text-emerald-400">
          🔥 {streak} seguidas!
        </p>
      )}

      {/* Answer buttons — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCorrectNote = opt.name === currentNote?.name;

          let btnClass =
            "border-[#cd7f32]/25 bg-[#16213e] text-[#fffff0]/85 hover:-translate-y-0.5 active:scale-[0.97]";

          if (phase === "correct" && isCorrectNote) {
            btnClass =
              "border-emerald-400 bg-emerald-500/20 text-emerald-300 scale-[1.04]";
          } else if (phase === "wrong") {
            if (isSelected) {
              btnClass = "border-red-400 bg-red-500/20 text-red-300";
            } else if (isCorrectNote) {
              btnClass =
                "border-emerald-400/50 bg-emerald-500/10 text-emerald-400/80";
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt)}
              disabled={phase !== "question"}
              className={`rounded-xl border-2 py-6 text-3xl font-black transition-all duration-150 ${btnClass}`}
            >
              {opt.name}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-6 text-center text-xs text-[#fffff0]/35">
        <span>
          Acertos:{" "}
          <strong className="text-[#fffff0]/60">
            {hits}/{total}
          </strong>
        </span>
        <span>
          Sequência:{" "}
          <strong className="text-[#fffff0]/60">{streak}</strong>
        </span>
      </div>
    </div>
  );
}
