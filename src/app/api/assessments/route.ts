import { SCORING_VERSION } from "@/lib/assessment/config";
import { checkAnswers, submissionSchema } from "@/lib/assessment/schema";
import { computeResult } from "@/lib/assessment/scoring";
import { newReportToken } from "@/lib/server/assessments";
import { prisma } from "@/lib/server/db";
import { log } from "@/lib/server/logger";
import { getOrCreateParticipantId } from "@/lib/server/participant";
import { getActiveQuestionnaire } from "@/lib/server/questionnaire";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/server/rateLimit";
import { parseJson } from "@/lib/server/request";
import { schedulePurge } from "@/lib/server/retention";

/** Stores a completed assessment and returns the secret token of its report. */
export async function POST(request: Request) {
  const limit = rateLimit(`submit:${clientIp(request)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = await parseJson(request, submissionSchema);
  if (!parsed.ok) return parsed.response;
  const { versionCode, clientRequestId, answers, context } = parsed.data;

  try {
    // Double submission: return the report already created for this request.
    const existing = await prisma.assessment.findUnique({ where: { clientRequestId }, select: { token: true } });
    if (existing) return Response.json({ token: existing.token });

    const loaded = await getActiveQuestionnaire();
    if (!loaded) return Response.json({ error: "The questionnaire is unavailable." }, { status: 503 });
    if (loaded.questionnaire.code !== versionCode) {
      return Response.json(
        { error: "The questionnaire has been updated. Please reload the page and review your answers." },
        { status: 409 },
      );
    }
    const invalid = checkAnswers(loaded.questionnaire, answers);
    if (invalid) return Response.json({ error: "Invalid request", fields: ["answers"] }, { status: 400 });

    const result = computeResult(loaded.questionnaire, { answers, context });
    const participantId = await getOrCreateParticipantId();
    const token = newReportToken();

    await prisma.assessment.create({
      data: {
        token,
        clientRequestId,
        participantId,
        versionId: loaded.versionId,
        scoringVersion: SCORING_VERSION,
        organization: context.organization,
        systemName: context.systemName,
        scope: context.scope,
        score: result.overall.score,
        level: result.overall.level,
        answers: {
          create: Object.entries(answers).map(([code, value]) => ({
            questionId: loaded.dbIdByCode.get(code)!,
            value,
          })),
        },
      },
    });
    log.info("assessment.created", { version: versionCode });
    schedulePurge();
    return Response.json({ token }, { status: 201 });
  } catch (error) {
    log.error("assessment.create.failed", error);
    return Response.json({ error: "Your assessment could not be saved. Please try again." }, { status: 500 });
  }
}
