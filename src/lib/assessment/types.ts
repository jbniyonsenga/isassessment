/** Criterion key, e.g. "confidentiality". */
export type CriterionId = string;

export type Answer = "yes" | "partial" | "no" | "na";

export interface Criterion {
  id: CriterionId;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  criterion: CriterionId;
  text: string;
  /** Critical indicators are evaluated independently of the overall score (FR-015). */
  critical?: boolean;
  risk: string;
  recommendation: string;
}

/** A questionnaire version as used by the scoring engine (loaded from the database at runtime). */
export interface Questionnaire {
  code: string;
  criteria: Criterion[];
  /** Question ids are the question codes (e.g. "CON-01"), unique within a version. */
  questions: Question[];
}

export interface AssessmentContext {
  organization?: string;
  systemName?: string;
  scope?: string;
}

export interface AssessmentSubmission {
  answers: Record<string, Answer>;
  context: AssessmentContext;
}

export type ScoreLevel = "strong" | "moderate" | "weak";

export interface CriterionResult {
  criterion: Criterion;
  points: number;
  maxPoints: number;
  /** null when no applicable question was answered (BR-002). */
  score: number | null;
  level: ScoreLevel | null;
  answered: number;
  notApplicable: number;
}

export type FindingSeverity = "critical" | "high" | "medium" | "low";

export interface Finding {
  question: Question;
  answer: Extract<Answer, "no" | "partial">;
  severity: FindingSeverity;
}

export interface AssessmentResult {
  overall: {
    points: number;
    maxPoints: number;
    score: number | null;
    level: ScoreLevel | null;
  };
  criteria: CriterionResult[];
  /** All negative and partial answers, most severe first (FR-014). */
  findings: Finding[];
  /** Critical indicators answered No or Partially, regardless of score (FR-015, BR-004). */
  criticalRisks: Finding[];
  context: AssessmentContext;
  assessedAt: string;
  questionnaireVersion: string;
  scoringVersion: string;
}
