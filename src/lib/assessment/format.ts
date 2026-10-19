import type { FindingSeverity } from "./types";

export function formatScore(score: number | null): string {
  return score === null ? "—" : `${Math.round(score)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};
