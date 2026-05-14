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
import { HelpModal, HelpSection, HelpItem } from "./HelpModal";

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
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanel>("trumpet");
  const [listeningAction, setListeningAction] = useState<ControlAction | null>(
    null,
  );
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  const isTouchDevice = useTouchDevice();

  const selectedTrumpet = TRUMPET_OPTIONS.find(
    (opt) => opt.value === trumpetType,
  )!;

  function toggleSettings() {
    setShowSettings((v) => !v);
    setListeningAction(null);
  }

  function selectTab(panel: SettingsPanel) {
    setActivePanel(panel);
    if (panel !== "controls") {
      setListeningAction(null);
    }
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
    <div className="flex w-full max-w-lg flex-col items-center gap-8 rounded-2xl border border-white/[0.07] bg-[#16213e]/70 px-8 py-10 shadow-2xl shadow-black/60 backdrop-blur-md">
      {/* Header: title + action icons */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="select-none text-4xl">🎺</span>
          <div>
            <h1 className="text-gradient-gold text-4xl font-black leading-none tracking-tight">
              Valvecraft
            </h1>
            <p className="mt-1 text-sm text-[#fffff0]/40">
              Treine dedilhado, leitura e tempo
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Help */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-label="Como jogar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fffff0]/20 text-[#fffff0]/50 transition-all hover:border-[#fffff0]/40 hover:text-[#fffff0]/80 active:scale-95"
          >
            <span className="text-base font-bold leading-none">?</span>
          </button>
          {/* Settings */}
          <button
            type="button"
            onClick={toggleSettings}
            aria-label="Configurações"
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
              showSettings
                ? "border-[#d4a853] bg-[#d4a853]/15 text-[#d4a853]"
                : "border-[#d4a853]/50 bg-[#d4a853]/5 text-[#d4a853] hover:border-[#d4a853]/80 hover:bg-[#d4a853]/10"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mode buttons */}
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full gap-4">
          <button
            onClick={onQuizMode}
            className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-linear-to-br from-[#d4a853] to-[#a86d20] px-5 py-7 text-[#1a1a2e] shadow-lg shadow-[#d4a853]/25 transition-all hover:-translate-y-0.5 hover:shadow-[#d4a853]/45 active:translate-y-0 active:scale-[0.98]"
          >
            <span className="select-none text-3xl">🎵</span>
            <span className="text-base font-black uppercase tracking-wider">
              Modo Quiz
            </span>
            <span className="text-xs font-medium opacity-60">
              Dedilhado e leitura
            </span>
          </button>

          <button
            onClick={onRhythmMode}
            className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 px-5 py-7 text-white shadow-lg shadow-emerald-700/30 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/45 active:translate-y-0 active:scale-[0.98]"
          >
            <span className="select-none text-3xl">🎼</span>
            <span className="text-base font-black uppercase tracking-wider">
              Modo Ritmo
            </span>
            <span className="text-xs font-medium opacity-70">
              Partitura e timing
            </span>
          </button>
        </div>

        <button
          onClick={onNoteReadingMode}
          className="flex w-full items-center gap-4 rounded-xl border border-violet-500/30 bg-violet-900/20 px-5 py-4 text-left text-violet-300 transition-all hover:-translate-y-0.5 hover:border-violet-400/50 hover:bg-violet-900/30 active:translate-y-0 active:scale-[0.98]"
        >
          <span className="select-none text-3xl">📖</span>
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

        {!showSettings && (
          <p className="text-center text-xs text-[#fffff0]/35">
            Ajuste o instrumento{" "}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline h-3 w-3 align-middle text-[#d4a853]/70">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>{" "}
            antes de jogar
          </p>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="w-full overflow-hidden rounded-xl border border-[#cd7f32]/20 bg-[#16213e]">
          {/* Tab bar */}
          <div className="flex border-b border-[#cd7f32]/15">
            {(
              [
                { panel: "trumpet" as SettingsPanel, label: "Afinação" },
                ...(!isTouchDevice
                  ? [{ panel: "controls" as SettingsPanel, label: "Controles" }]
                  : []),
                { panel: "nomenclature" as SettingsPanel, label: "Notas" },
              ] as { panel: SettingsPanel; label: string }[]
            ).map((tab) => (
              <button
                key={tab.panel}
                type="button"
                onClick={() => selectTab(tab.panel)}
                className={`flex-1 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activePanel === tab.panel
                    ? "border-[#d4a853] text-[#d4a853]"
                    : "border-transparent text-[#fffff0]/40 hover:text-[#fffff0]/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="p-4">
            {activePanel === "trumpet" && (
              <div className="grid grid-cols-2 gap-2">
                {TRUMPET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onTrumpetTypeChange(opt.value)}
                    className={`rounded-lg border-2 px-3 py-3 text-left transition-all ${
                      trumpetType === opt.value
                        ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                        : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="mt-1 text-xs opacity-60">{opt.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {activePanel === "controls" && (
              <div>
                {!isTouchDevice && (
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleControlBindingsReset}
                      className="rounded border border-[#cd7f32]/30 px-2 py-1 text-xs text-[#cd7f32]/70 transition-colors hover:border-[#cd7f32]/60 hover:text-[#cd7f32]"
                    >
                      Restaurar padrão
                    </button>
                  </div>
                )}

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
                        className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${
                          audioMode === opt.value
                            ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                            : "border-[#cd7f32]/20 bg-[#16213e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                        }`}
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
                            className={`min-w-24 rounded border px-2 py-1 text-center font-mono text-xs transition-colors ${
                              active
                                ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                                : "border-[#cd7f32]/30 bg-[#16213e] text-[#d4a853]"
                            }`}
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
                    className={`rounded-lg border-2 px-3 py-3 text-left transition-all ${
                      nomenclature === opt.value
                        ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                        : "border-[#cd7f32]/20 bg-[#1a1a2e] text-[#fffff0]/60 hover:border-[#cd7f32]/40"
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="mt-1 font-mono text-xs opacity-60">
                      {opt.example}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help modal */}
      {showHelp && (
        <HelpModal
          title="Como usar o Valvecraft"
          onClose={() => setShowHelp(false)}
        >
          <HelpSection title="Modo Quiz 🎵">
            <HelpItem>
              Veja a nota na pauta e pressione as válvulas corretas do trompete.
            </HelpItem>
            <HelpItem>
              Configure faixa de notas e afinação antes de começar.
            </HelpItem>
            <HelpItem>
              No celular, toque nos botões de válvula na tela.
            </HelpItem>
          </HelpSection>
          <HelpSection title="Modo Ritmo 🎼">
            <HelpItem>
              Leia uma partitura completa e toque cada nota no tempo certo.
            </HelpItem>
            <HelpItem>
              O resultado mostra sua precisão de tempo ao final.
            </HelpItem>
          </HelpSection>
          <HelpSection title="Leitura de Notas 📖">
            <HelpItem>
              Veja a nota na pauta e escolha o nome correto entre as opções.
            </HelpItem>
            <HelpItem>
              Ideal para iniciantes aprenderem a identificar notas sem trompete.
            </HelpItem>
          </HelpSection>
          <HelpSection title="Configurações ⚙">
            <HelpItem>
              Afinação — escolha Sib (padrão) ou Dó conforme seu instrumento.
            </HelpItem>
            <HelpItem>
              Notas — alterne entre Anglo (C D E) e Latino (Dó Ré Mi).
            </HelpItem>
            <HelpItem>
              Controles — personalize as teclas das 3 válvulas (desktop).
            </HelpItem>
          </HelpSection>
        </HelpModal>
      )}
    </div>
  );
}
