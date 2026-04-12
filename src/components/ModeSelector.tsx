import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type {
  ControlAction,
  ControlBindings,
  GameMode,
  NoteType,
  RangeLevel,
  TrumpetType,
} from "../types";
import { getNotesForMode } from "../utils/noteUtils";
import {
  CONTROL_ACTION_LABELS,
  CONTROL_ACTIONS,
  createKeyBindingFromEvent,
  getControlConflict,
  isReservedControlCode,
} from "../utils/controlBindings";

interface ModeSelectorProps {
  controlBindings: ControlBindings;
  onControlBindingsChange: (
    value: ControlBindings | ((prev: ControlBindings) => ControlBindings),
  ) => void;
  onControlBindingsReset: () => void;
  onStart: (mode: GameMode) => void;
}

type SettingsPanel = "range" | "notes" | "trumpet" | "controls";

const RANGE_OPTIONS: { value: RangeLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "Iniciante", desc: "C4 - G4 (8 notas)" },
  { value: "intermediate", label: "Intermediário", desc: "G3 - C5 (18 notas)" },
  { value: "advanced", label: "Avançado", desc: "G3 - G5 (25 notas)" },
];

const TYPE_OPTIONS: { value: NoteType; label: string; desc: string }[] = [
  { value: "natural", label: "Naturais", desc: "Apenas notas sem acidente" },
  { value: "flat", label: "Bemóis", desc: "Naturais + bemóis" },
  { value: "sharp", label: "Sustenidos", desc: "Naturais + sustenidos" },
  { value: "chromatic", label: "Cromático", desc: "Todas as notas" },
];

const TRUMPET_OPTIONS: {
  value: TrumpetType;
  label: string;
  shortLabel: string;
  desc: string;
}[] = [
  {
    value: "Bb",
    label: "Trompete in Sib (B♭)",
    shortLabel: "Sib (B♭)",
    desc: "Leitura transposta - padrão",
  },
  {
    value: "C",
    label: "Trompete in Dó (C)",
    shortLabel: "Dó (C)",
    desc: "Leitura em pitch de concerto",
  },
];

export function ModeSelector({
  controlBindings,
  onControlBindingsChange,
  onControlBindingsReset,
  onStart,
}: ModeSelectorProps) {
  const [rangeLevel, setRangeLevel] = useState<RangeLevel>("beginner");
  const [noteType, setNoteType] = useState<NoteType>("natural");
  const [trumpetType, setTrumpetType] = useState<TrumpetType>("Bb");
  const [activePanel, setActivePanel] = useState<SettingsPanel | null>(null);
  const [listeningAction, setListeningAction] =
    useState<ControlAction | null>(null);
  const [controlMessage, setControlMessage] = useState<string | null>(null);

  const mode: GameMode = { rangeLevel, noteType, trumpetType };
  const previewNotes = getNotesForMode(mode);
  const selectedRange = RANGE_OPTIONS.find((opt) => opt.value === rangeLevel)!;
  const selectedType = TYPE_OPTIONS.find((opt) => opt.value === noteType)!;
  const selectedTrumpet = TRUMPET_OPTIONS.find(
    (opt) => opt.value === trumpetType,
  )!;
  const settingButtons: {
    panel: SettingsPanel;
    label: string;
    value: string;
  }[] = [
    { panel: "range", label: "Dificuldade", value: selectedRange.label },
    {
      panel: "notes",
      label: "Tipo de notas",
      value: `${selectedType.label} (${previewNotes.length})`,
    },
    { panel: "trumpet", label: "Instrumento", value: selectedTrumpet.shortLabel },
    {
      panel: "controls",
      label: "Controles",
      value: `${controlBindings.valve1.label}/${controlBindings.valve2.label}/${controlBindings.valve3.label}`,
    },
  ];

  function togglePanel(panel: SettingsPanel) {
    setActivePanel((current) => {
      const next = current === panel ? null : panel;

      if (next !== "controls") {
        setListeningAction(null);
      }

      return next;
    });
  }

  function beginControlCapture(action: ControlAction) {
    setListeningAction(action);
    setControlMessage(
      `Pressione uma tecla para ${CONTROL_ACTION_LABELS[action]}.`,
    );
  }

  function handleControlKeyDown(
    action: ControlAction,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    if (listeningAction !== action) return;

    event.preventDefault();
    event.stopPropagation();

    const binding = createKeyBindingFromEvent(event.nativeEvent);

    if (!binding) {
      setControlMessage("Tecla não reconhecida.");
      return;
    }

    if (isReservedControlCode(binding.code)) {
      setControlMessage("Escape fica reservado para sair do jogo.");
      return;
    }

    const conflict = getControlConflict(controlBindings, binding, action);

    if (conflict) {
      setControlMessage(
        `${binding.label} já está em uso em ${CONTROL_ACTION_LABELS[conflict]}.`,
      );
      return;
    }

    onControlBindingsChange({
      ...controlBindings,
      [action]: binding,
    });
    setListeningAction(null);
    setControlMessage(
      `${CONTROL_ACTION_LABELS[action]} agora usa ${binding.label}.`,
    );
  }

  function handleControlBlur(action: ControlAction) {
    if (listeningAction === action) {
      setListeningAction(null);
    }
  }

  function handleControlBindingsReset() {
    setListeningAction(null);
    onControlBindingsReset();
    setControlMessage("Controles restaurados.");
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-black tracking-tight text-[#d4a853]">
          (Nome do jogo?)
        </h1>
        <p className="text-sm text-[#fffff0]/50">
          Treine o dedilhado do trompete
        </p>
      </div>

      {/* Quick start */}
      <div className="flex w-full flex-col items-center gap-3">
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
          Jogar
        </button>

        <p className="text-center text-xs text-[#fffff0]/35">
          {selectedRange.label} / {selectedType.label} /{" "}
          {selectedTrumpet.shortLabel} / {previewNotes.length} notas
        </p>
      </div>

      {/* Settings categories */}
      <div className="grid w-full grid-cols-2 gap-2">
        {settingButtons.map((item) => {
          const selected = activePanel === item.panel;

          return (
            <button
              key={item.panel}
              type="button"
              onClick={() => togglePanel(item.panel)}
              className={`
                rounded-lg border-2 px-3 py-3 text-left transition-all
                ${
                  selected
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-[#cd7f32]/20 bg-[#16213e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                }
              `}
            >
              <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
                {item.label}
              </div>
              <div className="mt-1 truncate text-sm font-bold">
                {item.value}
              </div>
            </button>
          );
        })}
      </div>

      {activePanel && (
        <div className="w-full rounded-lg border border-[#cd7f32]/20 bg-[#16213e] p-4">
          {activePanel === "range" && (
            <div>
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
                          : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                      }
                    `}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === "notes" && (
            <div>
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
                          : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                      }
                    `}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
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
            </div>
          )}

          {activePanel === "trumpet" && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
                Instrumento
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {TRUMPET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTrumpetType(opt.value)}
                    className={`
                      rounded-lg border-2 px-3 py-3 text-left transition-all
                      ${
                        trumpetType === opt.value
                          ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                          : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                      }
                    `}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === "controls" && (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
                  Controles
                </h2>
                <button
                  type="button"
                  onClick={handleControlBindingsReset}
                  className="rounded border border-[#cd7f32]/30 px-2 py-1 text-xs text-[#cd7f32]/70 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
                >
                  Restaurar padrão
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm text-[#fffff0]/60 sm:grid-cols-2">
                {CONTROL_ACTIONS.map((action) => {
                  const active = listeningAction === action;

                  return (
                    <div
                      key={action}
                      className="flex items-center justify-between gap-3 rounded-md bg-[#1a1a2e]/70 px-3 py-2"
                    >
                      <span>{CONTROL_ACTION_LABELS[action]}</span>
                      <button
                        type="button"
                        aria-label={`Alterar tecla para ${CONTROL_ACTION_LABELS[action]}`}
                        onBlur={() => handleControlBlur(action)}
                        onClick={() => beginControlCapture(action)}
                        onKeyDown={(event) =>
                          handleControlKeyDown(action, event)
                        }
                        className={`
                          min-w-24 rounded border px-2 py-1 text-center font-mono text-xs transition-colors
                          ${
                            active
                              ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                              : "border-[#cd7f32]/30 bg-[#16213e] text-[#d4a853]"
                          }
                        `}
                      >
                        {active
                          ? "Pressione..."
                          : controlBindings[action].label}
                      </button>
                    </div>
                  );
                })}
              </div>

              {controlMessage && (
                <p className="mt-3 text-xs text-[#fffff0]/40">
                  {controlMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
