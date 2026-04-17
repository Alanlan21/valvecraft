import { useState } from "react";
import type { Sheet } from "../types/sheet";
import { allSheets } from "../data/sheets";

interface SheetSelectorProps {
  /** Callback when a sheet is selected */
  onSelect: (sheet: Sheet) => void;
  /** Callback to go back */
  onBack: () => void;
}

type FilterCategory = "all" | Sheet["category"];
type FilterDifficulty = "all" | Sheet["difficulty"];

const CATEGORY_LABELS: Record<Sheet["category"], string> = {
  scale: "Escalas",
  exercise: "Exercícios",
  melody: "Melodias",
  song: "Músicas",
};

const DIFFICULTY_LABELS: Record<Sheet["difficulty"], string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const DIFFICULTY_COLORS: Record<Sheet["difficulty"], string> = {
  easy: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function SheetSelector({ onSelect, onBack }: SheetSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<FilterDifficulty>("all");

  // Apply filters
  let filteredSheets = allSheets;

  if (categoryFilter !== "all") {
    filteredSheets = filteredSheets.filter(
      (s) => s.category === categoryFilter,
    );
  }

  if (difficultyFilter !== "all") {
    filteredSheets = filteredSheets.filter(
      (s) => s.difficulty === difficultyFilter,
    );
  }

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
        <h1 className="text-2xl font-bold text-white">Modo Ritmo</h1>
        <div className="w-24" /> {/* Spacer for alignment */}
      </div>

      {/* Description */}
      <div className="text-center text-slate-400 max-w-lg mx-auto">
        Escolha um exercício ou música para praticar. O playhead passará pelas
        notas — toque a digitação correta no momento certo!
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 justify-center">
        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Categoria:</span>
          <div className="flex gap-1">
            <FilterButton
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            >
              Todas
            </FilterButton>
            {(Object.keys(CATEGORY_LABELS) as Sheet["category"][]).map(
              (cat) => (
                <FilterButton
                  key={cat}
                  active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </FilterButton>
              ),
            )}
          </div>
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Dificuldade:</span>
          <div className="flex gap-1">
            <FilterButton
              active={difficultyFilter === "all"}
              onClick={() => setDifficultyFilter("all")}
            >
              Todas
            </FilterButton>
            {(Object.keys(DIFFICULTY_LABELS) as Sheet["difficulty"][]).map(
              (diff) => (
                <FilterButton
                  key={diff}
                  active={difficultyFilter === diff}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {DIFFICULTY_LABELS[diff]}
                </FilterButton>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Sheet list */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSheets.map((sheet) => (
          <SheetCard key={sheet.id} sheet={sheet} onSelect={onSelect} />
        ))}
      </div>

      {filteredSheets.length === 0 && (
        <div className="text-center text-slate-500 py-8">
          Nenhum exercício encontrado com esses filtros.
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

interface SheetCardProps {
  sheet: Sheet;
  onSelect: (sheet: Sheet) => void;
}

function SheetCard({ sheet, onSelect }: SheetCardProps) {
  return (
    <button
      onClick={() => onSelect(sheet)}
      className="flex flex-col p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 transition-all text-left group"
    >
      {/* Title and composer */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
          {sheet.title}
        </h3>
        {sheet.composer && (
          <p className="text-sm text-slate-400">{sheet.composer}</p>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between mt-4">
        {/* Category badge */}
        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
          {CATEGORY_LABELS[sheet.category]}
        </span>

        {/* Difficulty badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded border ${
            DIFFICULTY_COLORS[sheet.difficulty]
          }`}
        >
          {DIFFICULTY_LABELS[sheet.difficulty]}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="text-amber-400">♩</span>
          {sheet.bpm} BPM
        </span>
        <span>
          {sheet.timeSignature.beats}/{sheet.timeSignature.beatValue}
        </span>
        <span>{sheet.notes.length} notas</span>
        <span>{sheet.totalMeasures} compassos</span>
      </div>
    </button>
  );
}
