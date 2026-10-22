import { z } from "zod";

export const CONTACT_TOPICS = {
  help: "I need help with the assessment",
  feedback: "Feedback or suggestion",
  partnership: "Audit or consulting request",
  privacy: "Privacy / my data",
  other: "Other",
} as const;

export type ContactTopic = keyof typeof CONTACT_TOPICS;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  organization: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  topic: z.enum(Object.keys(CONTACT_TOPICS) as [ContactTopic, ...ContactTopic[]]),
  message: z.string().trim().min(10).max(5000),
  /** Explicit acknowledgement of the privacy notice. */
  consent: z.literal(true),
  /** Client-generated id so that a double click stores the message once. */
  requestId: z.uuid(),
  /** Honeypot field: should stay empty. */
  website: z.string().max(200).optional(),
});
