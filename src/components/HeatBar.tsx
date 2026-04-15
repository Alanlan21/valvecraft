import { useEffect, useRef, useState } from "react";
import { STREAK_TIERS } from "../utils/gameRules";

interface HeatBarProps {
  streak: number;
}

const BLITZ_THRESHOLD = STREAK_TIERS[STREAK_TIERS.length - 1].minStreak; // 15

// Passive decay: 0.002 per 100 ms → ~2 %/s; full bar lasts ~50 s without input
const DECAY_AMOUNT = 0.002;
const DECAY_TICK_MS = 100;

const TIER_STYLE: Record<string, { fill: string; glow: string; pulse: string }> = {
  steady: { fill: "#4a9eff", glow: "0 0 4px  #4a9eff33", pulse: "2.5s" },
  combo:  { fill: "#d4a853", glow: "0 0 8px  #d4a85366", pulse: "1.8s" },
  focus:  { fill: "#ff8c00", glow: "0 0 14px #ff8c0088", pulse: "1.1s" },
  blitz:  { fill: "#ff3030", glow: "0 0 22px #ff3030aa", pulse: "0.6s" },
};

const MARKERS = STREAK_TIERS.slice(1, -1).map((t) => t.minStreak); // [5, 10]

export function HeatBar({ streak }: HeatBarProps) {
  const prevStreakRef = useRef(streak);
  const [visualFill, setVisualFill] = useState(0);
  const [flashError, setFlashError] = useState(false);
  const [tierTransition, setTierTransition] = useState(false);

  // ── React to streak changes ───────────────────────────────────────────────
  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;

    if (streak > prev) {
      // Correct answer — jump bar to streak position
      setVisualFill(Math.min(streak, BLITZ_THRESHOLD) / BLITZ_THRESHOLD);

      // Tier crossing upward → brief burst
      const crossed = STREAK_TIERS.some(
        (t) => streak >= t.minStreak && prev < t.minStreak,
      );
      if (crossed) {
        setTierTransition(true);
        const t = setTimeout(() => setTierTransition(false), 400);
        return () => clearTimeout(t);
      }
    } else if (streak < prev) {
      // Error — drop to the floor of the tier the player WAS in, not to zero
      const prevTier = STREAK_TIERS.reduce(
        (cur, t) => (prev >= t.minStreak ? t : cur),
        STREAK_TIERS[0],
      );
      // Floor = tier entry minus a small deduction so it visibly drops
      const floorFill = Math.max(0, (prevTier.minStreak - 1) / BLITZ_THRESHOLD);
      setVisualFill(floorFill);

      setFlashError(true);
      const t = setTimeout(() => setFlashError(false), 260);
      return () => clearTimeout(t);
    }
  }, [streak]);

  // ── Passive decay — runs always, makes the bar feel alive ────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setVisualFill((v) => Math.max(0, v - DECAY_AMOUNT));
    }, DECAY_TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── Derive color tier from visual fill (not raw streak) ──────────────────
  const visualStreak = visualFill * BLITZ_THRESHOLD;
  const tier = STREAK_TIERS.reduce(
    (cur, t) => (visualStreak >= t.minStreak ? t : cur),
    STREAK_TIERS[0],
  );
  const { fill: fillColor, glow, pulse } = TIER_STYLE[tier.id];

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#0d1117]/80">
      {/* Tier markers */}
      {MARKERS.map((ms) => (
        <div
          key={ms}
          className="absolute top-0 z-10 h-full w-px bg-[#fffff0]/15"
          style={{ left: `${(ms / BLITZ_THRESHOLD) * 100}%` }}
        />
      ))}

      {/* White flash on error */}
      <div
        className="absolute inset-0 rounded-full bg-white transition-opacity duration-150"
        style={{ opacity: flashError ? 0.85 : 0 }}
      />

      {/* Heat fill */}
      <div
        className={[
          "absolute left-0 top-0 h-full rounded-full",
          "transition-[width,background-color,box-shadow] duration-300 ease-out",
          tierTransition ? "scale-y-[2.5] opacity-90" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: `${visualFill * 100}%`,
          backgroundColor: fillColor,
          boxShadow: glow,
          animation: `heat-glow ${pulse} ease-in-out infinite`,
        }}
      />
    </div>
  );
}
