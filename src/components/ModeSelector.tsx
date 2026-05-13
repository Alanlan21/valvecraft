import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type {
  AudioMode,
  ControlAction,
  ControlBindings,
  NoteNomenclature,
  TrumpetType,
} from "../types";
import {
  CONTROL_ACTION_LABELS,
  CONTROL_ACTIONS,
  createKeyBindingFromEvent,
  getControlConflict,
  isReservedControlCode,
} from "../utils/controlBindings";
import { useTouchDevice } from "../hooks/useTouchDevice";

interface ModeSelectorProps {
  audioMode: AudioMode;
  controlBindings: ControlBindings;
  trumpetType: TrumpetType;
  nomenclature: NoteNomenclature;
  onAudioModeChange: (mode: AudioMode) => void;
  onTrumpetTypeChange: (type: TrumpetType) => void;
  onNomenclatureChange: (n: NoteNomenclature) => void;
  onControlBindingsChange: (
    value: ControlBindings | ((prev: ControlBindings) => ControlBindings),
  ) => void;
  onControlBindingsReset: () => void;
  onQuizMode: () => void;
  onRhythmMode: () => void;
  onNoteReadingMode: () => void;
}

type SettingsPanel = "trumpet" | "controls" | "nomenclature";

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
  audioMode,
  controlBindings,
  trumpetType,
  nomenclature,
  onAudioModeChange,
  onTrumpetTypeChange,
  onNomenclatureChange,
  onControlBindingsChange,
  onControlBindingsReset,
  onQuizMode,
  onRhythmMode,
  onNoteReadingMode,
}: ModeSelectorProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanel | null>(null);
  const [listeningAction, setListeningAction] = useState<ControlAction | null>(
    null,
  );
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  const isTouchDevice = useTouchDevice();

  const selectedTrumpet = TRUMPET_OPTIONS.find(
    (opt) => opt.value === trumpetType,
  )!;
  const settingButtons: {
    panel: SettingsPanel;
    label: string;
    value: string;
  }[] = [
    {
      panel: "trumpet",
      label: "Afinação",
      value: selectedTrumpet.shortLabel,
    },
    {
      panel: "controls",
      label: "Controles",
      value: `${controlBindings.valve1.label}/${controlBindings.valve2.label}/${controlBindings.valve3.label}`,
    },
    {
      panel: "nomenclature",
      label: "Notas",
      value: nomenclature === "anglo" ? "C D E (Anglo)" : "Dó Ré Mi (Latino)",
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

  function handleAudioModeChange(mode: AudioMode) {
    onAudioModeChange(mode);
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-white/[0.07] bg-[#16213e]/70 px-8 py-10 shadow-2xl shadow-black/60 backdrop-blur-md">
      {/* Title */}
      <div className="text-center">
        <div className="mb-2 select-none text-4xl">🎺</div>
        <h1 className="text-gradient-gold mb-2 text-5xl font-black tracking-tight">
          Valvecraft
        </h1>
        <p className="text-sm text-[#fffff0]/50">
          Treine dedilhado, leitura e tempo no trompete
        </p>
      </div>

      {/* Quick start */}
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full gap-3">
          <button
            onClick={onQuizMode}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-linear-to-br from-[#d4a853] to-[#a86d20] px-4 py-5 text-[#1a1a2e] shadow-lg shadow-[#d4a853]/25 transition-all hover:-translate-y-0.5 hover:shadow-[#d4a853]/45 active:translate-y-0 active:scale-[0.98]"
          >
            <span className="text-2xl select-none">🎵</span>
            <span className="text-base font-black uppercase tracking-wider">
              Modo Quiz
            </span>
            <span className="text-xs font-medium opacity-60">
              Dedilhado e leitura
            </span>
          </button>

          <button
            onClick={onRhythmMode}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 px-4 py-5 text-white shadow-lg shadow-emerald-700/30 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/45 active:translate-y-0 active:scale-[0.98]"
          >
            <span className="text-2xl select-none">🎼</span>
            <span className="text-base font-black uppercase tracking-wider">
              Modo Ritmo
            </span>
            <span className="text-xs font-medium opacity-70">
              Partitura e timing
            </span>
          </button>
        </div>

        {/* Note Reading — learning mode, no fingerings needed */}
        <button
          onClick={onNoteReadingMode}
          className="flex w-full items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-900/20 px-4 py-3 text-left text-violet-300 transition-all hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-violet-900/30 active:translate-y-0 active:scale-[0.98]"
        >
          <span className="select-none text-2xl">📖</span>
          <div className="flex-1">
            <div className="text-sm font-black uppercase tracking-wide">
              Leitura de Notas
            </div>
            <div className="text-xs font-medium opacity-60">
              Aprenda a identificar notas na pauta
            </div>
          </div>
          <span className="text-xs opacity-40">→</span>
        </button>

        <p className="text-center text-xs text-[#fffff0]/35">
          Escolha um modo para começar. Afinação ativa:{" "}
          {selectedTrumpet.shortLabel}.
        </p>
      </div>

      {/* Settings categories */}
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        {settingButtons
          .filter((item) => !(isTouchDevice && item.panel === "controls"))
          .map((item) => {
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
          {activePanel === "trumpet" && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
                Afinação do Trompete
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {TRUMPET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onTrumpetTypeChange(opt.value)}
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
                {!isTouchDevice && (
                  <button
                    type="button"
                    onClick={handleControlBindingsReset}
                    className="rounded border border-[#cd7f32]/30 px-2 py-1 text-xs text-[#cd7f32]/70 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
                  >
                    Restaurar padrão
                  </button>
                )}
              </div>

              <div className="mb-4 rounded-md bg-[#1a1a2e]/70 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#cd7f32]/60">
                  Som
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "mono" as AudioMode, label: "Mono curto" },
                    { value: "off" as AudioMode, label: "Sem som" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAudioModeChange(opt.value)}
                      className={`
                        rounded border px-3 py-2 text-sm font-semibold transition-colors
                        ${
                          audioMode === opt.value
                            ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                            : "border-[#cd7f32]/20 bg-[#16213e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {!isTouchDevice && (
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
              )}

              {controlMessage && (
                <p className="mt-3 text-xs text-[#fffff0]/40">
                  {controlMessage}
                </p>
              )}
            </div>
          )}

          {activePanel === "nomenclature" && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#cd7f32]">
                Nomenclatura das Notas
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: "anglo" as const,
                      label: "Anglo / Germânica",
                      example: "C  D  E  F  G  A  B",
                    },
                    {
                      value: "latin" as const,
                      label: "Latino / Solfejo",
                      example: "Dó Ré Mi Fá Sol Lá Si",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onNomenclatureChange(opt.value)}
                    className={`
                      rounded-lg border-2 px-3 py-3 text-left transition-all
                      ${
                        nomenclature === opt.value
                          ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                          : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                      }
                    `}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="mt-1 font-mono text-xs opacity-60">
                      {opt.example}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
