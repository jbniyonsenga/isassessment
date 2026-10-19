import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { computeResult, missingAnswers } from "./scoring";
import { submissionSchema } from "./schema";
import type { Answer } from "./types";

function allAnswers(answer: Answer): Record<string, Answer> {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, answer]));
}

describe("computeResult", () => {
  it("scores 100 when everything is Yes", () => {
    const result = computeResult({ answers: allAnswers("yes"), context: {} });
    expect(result.overall.score).toBe(100);
    expect(result.overall.level).toBe("strong");
    expect(result.findings).toHaveLength(0);
    expect(result.criteria.every((c) => c.score === 100)).toBe(true);
  });

  it("applies 2 / 1 / 0 points and excludes Not Applicable from the maximum", () => {
    const answers = allAnswers("na");
    answers["EFF-01"] = "yes";
    answers["EFF-02"] = "partial";
    answers["EFF-03"] = "no";
    const result = computeResult({ answers, context: {} });
    const eff = result.criteria.find((c) => c.criterion.id === "effectiveness")!;
    expect(eff.points).toBe(3);
    expect(eff.maxPoints).toBe(6);
    expect(eff.score).toBe(50);
    expect(result.overall.score).toBe(50);
  });

  it("shows no score when nothing is applicable", () => {
    const result = computeResult({ answers: allAnswers("na"), context: {} });
    expect(result.overall.score).toBeNull();
    expect(result.overall.level).toBeNull();
    expect(result.criteria.every((c) => c.score === null)).toBe(true);
  });

  it("reports critical risks even when the overall score is high", () => {
    const answers = allAnswers("yes");
    answers["AVA-01"] = "no";
    const result = computeResult({ answers, context: {} });
    expect(result.overall.score).toBeGreaterThan(95);
    expect(result.criticalRisks.map((f) => f.question.id)).toEqual(["AVA-01"]);
    expect(result.criticalRisks[0].severity).toBe("critical");
  });

  it("orders findings by severity", () => {
    const answers = allAnswers("yes");
    answers["EFF-01"] = "partial"; // low
    answers["EFF-02"] = "no"; // medium
    answers["CON-01"] = "partial"; // high (critical, partial)
    answers["CON-02"] = "no"; // critical
    const result = computeResult({ answers, context: {} });
    expect(result.findings.map((f) => f.severity)).toEqual(["critical", "high", "medium", "low"]);
  });
});

describe("validation", () => {
  it("lists missing answers", () => {
    const answers = allAnswers("yes");
    delete answers["REL-05"];
    expect(missingAnswers(answers)).toEqual(["REL-05"]);
    expect(submissionSchema.safeParse({ answers }).success).toBe(false);
  });

  it("rejects unknown question ids and invalid answers", () => {
    expect(submissionSchema.safeParse({ answers: { ...allAnswers("yes"), X: "yes" } }).success).toBe(false);
    expect(submissionSchema.safeParse({ answers: { ...allAnswers("yes"), "EFF-01": "maybe" } }).success).toBe(
      false,
    );
  });

  it("accepts a complete submission", () => {
    expect(submissionSchema.safeParse({ answers: allAnswers("partial") }).success).toBe(true);
  });
});
