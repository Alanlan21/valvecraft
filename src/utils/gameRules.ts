export const RUN_DURATION_MS = 60_000;
export const WRONG_ANSWER_TIME_PENALTY_MS = 1_500;
export const CORRECT_FEEDBACK_MS = 350;
export const WRONG_FEEDBACK_MS = 900;
export const NOTE_REVEAL_DELAY_MS = 450;

// ── Time-gain mechanic ────────────────────────────────────────────────────────
// Correct answers can extend the run. The gain diminishes continuously as the
// run progresses, making elite-level runs theoretically infinite but
// progressively harder to sustain.
//
// timeGain = baseGain × (1 / (1 + elapsedMs / 60_000)) ^ 1.2
//
// Examples for a Perfect (+400 ms base):
//   t=0s  → +400 ms   t=60s → +193 ms   t=180s → +93 ms   t=300s → +61 ms

/** Thresholds for answer quality classification (response time in ms). */
export const PERFECT_THRESHOLD_MS = 1000;
export const GOOD_THRESHOLD_MS = 1_800;

/** Base time added to the run clock per quality band (in ms). */
export const TIME_GAIN_PERFECT_MS = 1000;
export const TIME_GAIN_GOOD_MS = 500;
// Ok (correct but slow) → 0 ms gain

/** Exponent controlling how fast the gain decays over time. Higher = steeper decay. */
export const TIME_GAIN_DECAY_EXPONENT = 1.2;
// ─────────────────────────────────────────────────────────────────────────────

export interface StreakTier {
  id: "steady" | "combo" | "focus" | "blitz";
  label: string;
  minStreak: number;
  scoreWindowMs: number;
  streakBonus: number;
  tierMultiplier: number;
}

export const STREAK_TIERS: StreakTier[] = [
  {
    id: "steady",
    label: "Ritmo",
    minStreak: 0,
    scoreWindowMs: 3000,
    streakBonus: 0.1,
    tierMultiplier: 1,
  },
  {
    id: "combo",
    label: "Combo",
    minStreak: 5,
    scoreWindowMs: 3000,
    streakBonus: 0.12,
    tierMultiplier: 1.15,
  },
  {
    id: "focus",
    label: "Foco",
    minStreak: 10,
    scoreWindowMs: 2500,
    streakBonus: 0.14,
    tierMultiplier: 1.3,
  },
  {
    id: "blitz",
    label: "Blitz",
    minStreak: 15,
    scoreWindowMs: 2000,
    streakBonus: 0.16,
    tierMultiplier: 1.5,
  },
];

export function getStreakTier(streak: number) {
  return STREAK_TIERS.reduce((current, tier) =>
    streak >= tier.minStreak ? tier : current,
  );
}
