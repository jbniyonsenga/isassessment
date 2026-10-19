import { ANSWER_POINTS, MAX_POINTS_PER_QUESTION, SCORING_VERSION, levelFor } from "./config";
import { CRITERIA, QUESTIONNAIRE_VERSION, QUESTIONS } from "./questions";
import type {
  AssessmentResult,
  AssessmentSubmission,
  CriterionResult,
  Finding,
  FindingSeverity,
} from "./types";

const SEVERITY_ORDER: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** BR-001: points obtained / maximum applicable points × 100, or null when nothing is applicable (BR-002). */
function score(points: number, maxPoints: number): number | null {
  if (maxPoints === 0) return null;
  return Math.round((points / maxPoints) * 1000) / 10;
}

/** Returns the ids of questions that have no answer (FR-005). */
export function missingAnswers(answers: AssessmentSubmission["answers"]): string[] {
  return QUESTIONS.filter((q) => !answers[q.id]).map((q) => q.id);
}

export function computeResult(
  submission: AssessmentSubmission,
  assessedAt: Date = new Date(),
): AssessmentResult {
  const { answers } = submission;
  const findings: Finding[] = [];

  const criteria: CriterionResult[] = CRITERIA.map((criterion) => {
    let points = 0;
    let maxPoints = 0;
    let answered = 0;
    let notApplicable = 0;

    for (const question of QUESTIONS.filter((q) => q.criterion === criterion.id)) {
      const answer = answers[question.id];
      if (!answer) continue;
      answered++;
      if (answer === "na") {
        notApplicable++;
        continue;
      }
      points += ANSWER_POINTS[answer];
      maxPoints += MAX_POINTS_PER_QUESTION;

      if (answer === "no" || answer === "partial") {
        const severity: FindingSeverity = question.critical
          ? answer === "no"
            ? "critical"
            : "high"
          : answer === "no"
            ? "medium"
            : "low";
        findings.push({ question, answer, severity });
      }
    }

    const criterionScore = score(points, maxPoints);
    return {
      criterion,
      points,
      maxPoints,
      score: criterionScore,
      level: criterionScore === null ? null : levelFor(criterionScore),
      answered,
      notApplicable,
    };
  });

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const points = criteria.reduce((sum, c) => sum + c.points, 0);
  const maxPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const overallScore = score(points, maxPoints);

  return {
    overall: {
      points,
      maxPoints,
      score: overallScore,
      level: overallScore === null ? null : levelFor(overallScore),
    },
    criteria,
    findings,
    criticalRisks: findings.filter((f) => f.question.critical),
    context: submission.context,
    assessedAt: assessedAt.toISOString(),
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    scoringVersion: SCORING_VERSION,
  };
}
