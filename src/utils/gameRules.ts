export const RUN_DURATION_MS = 60_000;
export const WRONG_ANSWER_TIME_PENALTY_MS = 3_000;
export const CORRECT_FEEDBACK_MS = 350;
export const WRONG_FEEDBACK_MS = 900;
export const NOTE_REVEAL_DELAY_MS = 300;

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
