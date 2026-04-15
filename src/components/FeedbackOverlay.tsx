import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { AnswerResult } from "../types";
import {
  CORRECT_FEEDBACK_MS,
  WRONG_ANSWER_TIME_PENALTY_MS,
  WRONG_FEEDBACK_MS,
  OVERPERFECT_THRESHOLD_MS,
  OVERPERFECT_FEEDBACK_MS,
} from "../utils/gameRules";

interface FeedbackOverlayProps {
  result: AnswerResult | null;
  onDismiss: () => void;
}

type Band = "overperfect" | "perfect" | "good" | "slow" | "wrong";

function getBand(result: AnswerResult): Band {
  if (!result.correct) return "wrong";
  // Cap at "good" if the player already missed this note at least once
  if (result.hadPriorError) return "good";
  if (result.timeMs <= OVERPERFECT_THRESHOLD_MS) return "overperfect";
  if (result.quality === "perfect") return "perfect";
  if (result.quality === "good") return "good";
  return "slow";
}

const rm =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type BandCfg = {
  label: string;
  rootBg: string;
  indicatorColor: string;
  indicatorSize: string;
  indicatorAnimation?: string;
  indicatorFilter?: string;
  labelStyle: CSSProperties;
  badgeStyle: CSSProperties;
};

const FONT = "'Rajdhani', system-ui, sans-serif";

const BAND: Record<Band, BandCfg> = {
  overperfect: {
    label: "INCRÍVEL!",
    rootBg: "rgba(212,168,83,0.22)",
    indicatorColor: "#ffd34d",
    indicatorSize: "text-9xl",
    indicatorAnimation: rm ? undefined : "fb-pop-strong 180ms cubic-bezier(.2,.9,.2,1) both",
    indicatorFilter: "drop-shadow(0 0 36px rgba(255,200,50,0.95))",
    labelStyle: {
      fontFamily: FONT,
      color: "#ffd34d",
      fontSize: "1.5rem",
      fontWeight: 900,
      letterSpacing: "0.18em",
      textShadow: "0 0 24px rgba(255,200,50,0.8)",
      animation: rm ? undefined : "fb-pop 220ms ease both",
    },
    badgeStyle: {
      fontFamily: FONT,
      color: "#ffd34d",
      backgroundColor: "rgba(212,168,83,0.2)",
      boxShadow: "0 0 22px rgba(212,168,83,0.45)",
    },
  },
  perfect: {
    label: "PERFEITO!",
    rootBg: "rgba(34,197,94,0.15)",
    indicatorColor: "#4ade80",
    indicatorSize: "text-8xl",
    indicatorAnimation: rm ? undefined : "fb-pop 320ms cubic-bezier(.2,.9,.25,1) both",
    indicatorFilter: "drop-shadow(0 0 22px rgba(34,197,94,0.7))",
    labelStyle: {
      fontFamily: FONT,
      color: "#4ade80",
      fontSize: "1.3rem",
      fontWeight: 800,
      letterSpacing: "0.14em",
      animation: rm ? undefined : "fb-fade-up 380ms ease both",
    },
    badgeStyle: {
      fontFamily: FONT,
      color: "#4ade80",
      backgroundColor: "rgba(34,197,94,0.18)",
    },
  },
  good: {
    label: "BOM!",
    rootBg: "rgba(234,179,8,0.1)",
    indicatorColor: "#facc15",
    indicatorSize: "text-7xl",
    indicatorAnimation: rm ? undefined : "fb-fade-up 350ms ease both",
    indicatorFilter: "drop-shadow(0 0 14px rgba(234,179,8,0.5))",
    labelStyle: {
      fontFamily: FONT,
      color: "#facc15",
      fontSize: "1.1rem",
      fontWeight: 700,
      letterSpacing: "0.12em",
      opacity: 0.9,
    },
    badgeStyle: {
      fontFamily: FONT,
      color: "#facc15",
      backgroundColor: "rgba(234,179,8,0.12)",
      opacity: 0.9,
    },
  },
  slow: {
    label: "DEVAGAR...",
    rootBg: "rgba(59,130,246,0.07)",
    indicatorColor: "#60a5fa",
    indicatorSize: "text-6xl",
    labelStyle: {
      fontFamily: FONT,
      color: "#60a5fa",
      fontSize: "0.95rem",
      fontWeight: 600,
      letterSpacing: "0.1em",
      opacity: 0.45,
    },
    badgeStyle: {
      fontFamily: FONT,
      color: "#60a5fa",
      backgroundColor: "rgba(59,130,246,0.08)",
      opacity: 0.45,
    },
  },
  wrong: {
    label: "ERRADO!",
    rootBg: "rgba(239,68,68,0.2)",
    indicatorColor: "#ff7b7b",
    indicatorSize: "text-8xl",
    indicatorAnimation: rm ? undefined : "fb-shake 380ms ease both",
    indicatorFilter: "drop-shadow(0 0 22px rgba(239,68,68,0.7))",
    labelStyle: {
      fontFamily: FONT,
      color: "#ff7b7b",
      fontSize: "1.3rem",
      fontWeight: 800,
      letterSpacing: "0.14em",
      animation: rm ? undefined : "fb-pop 250ms ease both",
    },
    badgeStyle: {
      fontFamily: FONT,
      color: "#fca5a5",
      backgroundColor: "rgba(239,68,68,0.15)",
    },
  },
};

export function FeedbackOverlay({ result, onDismiss }: FeedbackOverlayProps) {
  const [visible, setVisible] = useState(false);

  const band = result ? getBand(result) : null;

  const displayMs = result
    ? result.correct
      ? band === "overperfect"
        ? OVERPERFECT_FEEDBACK_MS
        : CORRECT_FEEDBACK_MS
      : WRONG_FEEDBACK_MS
    : 0;

  useEffect(() => {
    if (!result) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, displayMs);
    return () => clearTimeout(timer);
  }, [result, onDismiss, displayMs]);

  if (!result || !visible || !band) return null;

  const cfg = BAND[band];

  const indicatorStyle: CSSProperties = {
    fontFamily: FONT,
    color: cfg.indicatorColor,
    animation: cfg.indicatorAnimation,
    filter: cfg.indicatorFilter,
    opacity: band === "slow" ? 0.35 : undefined,
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center"
      style={{ backgroundColor: cfg.rootBg }}
    >
      {/* Band label */}
      <div
        className="mb-1 uppercase tracking-widest"
        style={cfg.labelStyle}
      >
        {cfg.label}
      </div>

      {/* Correct / Wrong indicator */}
      <div
        className={`font-black leading-none ${cfg.indicatorSize}`}
        style={indicatorStyle}
      >
        {result.correct ? "✓" : "✗"}
      </div>

      {/* Time badge */}
      <div
        className="mt-4 rounded-full px-4 py-1 text-sm font-bold"
        style={cfg.badgeStyle}
      >
        {result.timeMs}ms
        {!result.correct && (
          <span className="ml-2" style={{ color: "#fca5a5" }}>
            -{WRONG_ANSWER_TIME_PENALTY_MS / 1000}s
          </span>
        )}
        {result.correct && <span className="ml-2">+{result.timeGainMs}s</span>}
      </div>
    </div>
  );
}
