import type { Answer, ScoreLevel } from "./types";

export const SCORING_VERSION = "S-1.0";

/** Default scoring method (FR-012). Not Applicable is excluded from the maximum (FR-013). */
export const ANSWER_POINTS: Record<Exclude<Answer, "na">, number> = {
  yes: 2,
  partial: 1,
  no: 0,
};

export const MAX_POINTS_PER_QUESTION = 2;

/**
 * Indicative score thresholds (BR-003). A score is placed in the first level
 * whose `min` it reaches. Override with SCORE_THRESHOLDS="80,50".
 */
export interface Threshold {
  level: ScoreLevel;
  min: number;
  label: string;
}

function parseThresholds(raw: string | undefined): [number, number] {
  const fallback: [number, number] = [80, 50];
  if (!raw) return fallback;
  const [strong, moderate] = raw.split(",").map((v) => Number(v.trim()));
  if (
    Number.isFinite(strong) &&
    Number.isFinite(moderate) &&
    strong <= 100 &&
    moderate >= 0 &&
    strong > moderate
  ) {
    return [strong, moderate];
  }
  return fallback;
}

const [STRONG_MIN, MODERATE_MIN] = parseThresholds(process.env.NEXT_PUBLIC_SCORE_THRESHOLDS);

export const THRESHOLDS: Threshold[] = [
  { level: "strong", min: STRONG_MIN, label: "Strong control environment" },
  { level: "moderate", min: MODERATE_MIN, label: "Moderate — improvements needed" },
  { level: "weak", min: 0, label: "Weak — significant improvements needed" },
];

export function levelFor(score: number): ScoreLevel {
  return (THRESHOLDS.find((t) => score >= t.min) ?? THRESHOLDS[THRESHOLDS.length - 1]).level;
}

export function thresholdFor(level: ScoreLevel): Threshold {
  return THRESHOLDS.find((t) => t.level === level)!;
}

export const ANSWER_LABELS: Record<Answer, string> = {
  yes: "Yes",
  partial: "Partially",
  no: "No",
  na: "Not applicable",
};

export const DISCLAIMER =
  "This assessment is an indicative self-assessment based on the answers provided. " +
  "It does not constitute an audit, nor an official COBIT compliance certification or opinion. " +
  "Score thresholds are indicative.";
