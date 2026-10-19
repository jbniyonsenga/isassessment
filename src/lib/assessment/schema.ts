import { z } from "zod";
import { QUESTIONS } from "./questions";

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

/** A complete submission: every question must be answered (FR-005), unknown ids are rejected. */
export const submissionSchema = z.object({
  answers: z
    .record(z.string(), answer)
    .refine((a) => Object.keys(a).every((id) => QUESTIONS.some((q) => q.id === id)), {
      message: "Unknown question id",
    })
    .refine((a) => QUESTIONS.every((q) => a[q.id]), {
      message: "All questions must be answered",
    }),
  context: contextSchema.prefault({}),
  /** ISO date the assessment was submitted, so the PDF matches the online report (FR-024). */
  assessedAt: z.iso.datetime().optional(),
});

export const emailRequestSchema = submissionSchema.extend({
  email: z.email().max(254),
  /** Client-generated key so that a double-click sends only once (FR-036). */
  requestId: z.uuid(),
  /** Honeypot field: should stay empty; checked by the route so bots get a silent fake success (FR-036). */
  website: z.string().max(200).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
