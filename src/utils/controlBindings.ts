import type { ControlAction, ControlBindings, KeyBinding } from "../types";

export const CONTROL_BINDINGS_STORAGE_KEY = "valvecraft:controls:v1";

export const CONTROL_ACTIONS: ControlAction[] = [
  "valve1",
  "valve2",
  "valve3",
  "slide",
  "submit",
];

export const CONTROL_ACTION_LABELS: Record<ControlAction, string> = {
  valve1: "Válvula 1",
  valve2: "Válvula 2",
  valve3: "Válvula 3",
  slide: "Slide",
  submit: "Confirmar resposta",
};

export const DEFAULT_CONTROL_BINDINGS: ControlBindings = {
  valve1: { code: "KeyQ", label: "Q" },
  valve2: { code: "KeyW", label: "W" },
  valve3: { code: "KeyE", label: "E" },
  slide: { code: "Shift", label: "Shift" },
  submit: { code: "Space", label: "Espaço" },
};

const MODIFIER_CODES: Record<string, string> = {
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  ControlLeft: "Control",
  ControlRight: "Control",
  AltLeft: "Alt",
  AltRight: "Alt",
  MetaLeft: "Meta",
  MetaRight: "Meta",
};

const RESERVED_CODES = new Set(["Escape"]);

export function normalizeKeyCode(code: string): string {
  return MODIFIER_CODES[code] ?? code;
}

export function normalizeKeyboardEventCode(event: Pick<KeyboardEvent, "code">) {
  return normalizeKeyCode(event.code);
}

export function isReservedControlCode(code: string) {
  return RESERVED_CODES.has(normalizeKeyCode(code));
}

export function createKeyBindingFromEvent(
  event: Pick<KeyboardEvent, "code" | "key">,
): KeyBinding | null {
  const code = normalizeKeyboardEventCode(event);

  if (!code) {
    return null;
  }

  return {
    code,
    label: formatKeyLabel(code, event.key),
  };
}

export function getControlConflict(
  bindings: ControlBindings,
  binding: KeyBinding,
  currentAction: ControlAction,
) {
  return (
    CONTROL_ACTIONS.find(
      (action) =>
        action !== currentAction &&
        normalizeKeyCode(bindings[action].code) === binding.code,
    ) ?? null
  );
}

export function getActionForKeyboardEvent(
  bindings: ControlBindings,
  event: Pick<KeyboardEvent, "code">,
) {
  const code = normalizeKeyboardEventCode(event);

  return (
    CONTROL_ACTIONS.find(
      (action) => normalizeKeyCode(bindings[action].code) === code,
    ) ?? null
  );
}

export function sanitizeControlBindings(value: unknown): ControlBindings {
  if (!isControlBindings(value)) {
    return DEFAULT_CONTROL_BINDINGS;
  }

  const usedCodes = new Set<string>();
  const normalized = {} as ControlBindings;

  for (const action of CONTROL_ACTIONS) {
    const binding = value[action];
    const code = normalizeKeyCode(binding.code);

    if (isReservedControlCode(code) || usedCodes.has(code)) {
      return DEFAULT_CONTROL_BINDINGS;
    }

    usedCodes.add(code);
    normalized[action] = {
      code,
      label: binding.label.trim() || formatKeyLabel(code, code),
    };
  }

  return normalized;
}

function isControlBindings(value: unknown): value is ControlBindings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Record<ControlAction, Partial<KeyBinding>>>;

  return CONTROL_ACTIONS.every((action) => {
    const binding = candidate[action];
    return (
      !!binding &&
      typeof binding.code === "string" &&
      binding.code.length > 0 &&
      typeof binding.label === "string"
    );
  });
}

function formatKeyLabel(code: string, key: string) {
  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3);
  }

  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5);
  }

  if (/^Numpad[0-9]$/.test(code)) {
    return `Num ${code.slice(6)}`;
  }

  switch (code) {
    case "Space":
      return "Espaço";
    case "Control":
      return "Ctrl";
    case "ArrowUp":
      return "Seta para cima";
    case "ArrowDown":
      return "Seta para baixo";
    case "ArrowLeft":
      return "Seta esquerda";
    case "ArrowRight":
      return "Seta direita";
    default:
      break;
  }

  if (key && key !== "Unidentified") {
    return key.length === 1 ? key.toUpperCase() : key;
  }

  return code.replace(/([a-z])([A-Z])/g, "$1 $2");
}
