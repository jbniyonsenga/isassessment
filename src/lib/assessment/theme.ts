import type { FindingSeverity, ScoreLevel } from "./types";

/**
 * Status colors shared by the online report and the PDF. They always come with an
 * icon and a text label, never color alone.
 */
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  neutral: "#94a3b8",
} as const;

export const LEVEL_COLOR: Record<ScoreLevel, string> = {
  strong: STATUS.good,
  moderate: STATUS.warning,
  weak: STATUS.critical,
};

export const LEVEL_ICON: Record<ScoreLevel, string> = {
  strong: "✓",
  moderate: "!",
  weak: "✕",
};

export const SEVERITY_COLOR: Record<FindingSeverity, string> = {
  critical: STATUS.critical,
  high: STATUS.serious,
  medium: STATUS.warning,
  low: STATUS.neutral,
};

export const BRAND = "#4f46e5";

/** Logo geometry (32×32 viewBox), shared by the web Logo component, the favicon and the PDF. */
export const LOGO_SHIELD = "M16 2 L28 6.5 V15 C28 22.6 22.9 28.3 16 30 C9.1 28.3 4 22.6 4 15 V6.5 Z";
export const LOGO_BARS = [
  { x: 9.5, y: 17, h: 5 },
  { x: 14.5, y: 13, h: 9 },
  { x: 19.5, y: 9.5, h: 12.5 },
];
