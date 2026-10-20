import { z } from "zod";
import type { Questionnaire } from "./types";

const answer = z.enum(["yes", "partial", "no", "na"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const contextSchema = z.object({
  organization: optionalText(120),
  systemName: optionalText(120),
  scope: optionalText(500),
});

/** Envelope of a submission; answers are checked against the questionnaire with `checkAnswers`. */
export const submissionSchema = z.object({
  versionCode: z.string().min(1).max(40),
  /** Client-generated id so that a double submission creates only one assessment. */
  clientRequestId: z.uuid(),
  answers: z.record(z.string().max(20), answer),
  context: contextSchema.prefault({}),
});

/** Every question must be answered (FR-005) and unknown question ids are rejected. */
export function checkAnswers(questionnaire: Questionnaire, answers: Record<string, unknown>): string | null {
  const ids = new Set(questionnaire.questions.map((q) => q.id));
  if (Object.keys(answers).some((id) => !ids.has(id))) return "Unknown question id";
  if (questionnaire.questions.some((q) => !answers[q.id])) return "All questions must be answered";
  return null;
}

export const emailRequestSchema = z.object({
  email: z.email().max(254),
  /** Client-generated key so that a double-click sends only once (FR-036). */
  requestId: z.uuid(),
  /** Honeypot field: should stay empty; checked by the route so bots get a silent fake success (FR-036). */
  website: z.string().max(200).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
