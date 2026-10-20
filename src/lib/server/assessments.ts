import "server-only";
import { randomBytes } from "node:crypto";
import { computeResult } from "@/lib/assessment/scoring";
import type { Answer, AssessmentResult } from "@/lib/assessment/types";
import { prisma } from "./db";
import { getQuestionnaireVersion } from "./questionnaire";
import { retentionCutoff } from "./retention";

/** 24 random bytes → 32 URL-safe characters: report URLs cannot be guessed (NFR-004). */
export function newReportToken(): string {
  return randomBytes(24).toString("base64url");
}

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export interface StoredReport {
  assessmentId: string;
  token: string;
  result: AssessmentResult;
}

/** Loads a report by its secret token; null when unknown, malformed or past retention. */
export async function loadReport(token: string): Promise<StoredReport | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const assessment = await prisma.assessment.findUnique({
    where: { token },
    include: { answers: true },
  });
  if (!assessment || assessment.submittedAt < retentionCutoff()) return null;

  const loaded = await getQuestionnaireVersion(assessment.versionId);
  if (!loaded) return null;

  const answers: Record<string, Answer> = {};
  for (const a of assessment.answers) {
    const code = loaded.codeByDbId.get(a.questionId);
    if (code) answers[code] = a.value;
  }

  const result = computeResult(
    loaded.questionnaire,
    {
      answers,
      context: {
        organization: assessment.organization ?? undefined,
        systemName: assessment.systemName ?? undefined,
        scope: assessment.scope ?? undefined,
      },
    },
    assessment.submittedAt,
  );
  // Scores are recomputed with the current engine and labelled with its version; the
  // score frozen at submission (assessment.score / scoringVersion) is kept for statistics.
  return { assessmentId: assessment.id, token: assessment.token, result };
}
