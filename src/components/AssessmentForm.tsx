"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ANSWER_LABELS } from "@/lib/assessment/config";
import { missingAnswers } from "@/lib/assessment/scoring";
import { loadDraft, saveDraft } from "@/lib/assessment/storage";
import type { Answer, AssessmentContext, Questionnaire as QuestionnaireData } from "@/lib/assessment/types";

const ANSWERS: Answer[] = ["yes", "partial", "no", "na"];

const ANSWER_STYLES: Record<Answer, string> = {
  yes: "peer-checked:border-green-600 peer-checked:bg-green-50 peer-checked:text-green-800",
  partial: "peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-800",
  no: "peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-800",
  na: "peer-checked:border-slate-500 peer-checked:bg-slate-100 peer-checked:text-slate-800",
};

const noopSubscribe = () => () => {};

export function AssessmentForm({ questionnaire }: { questionnaire: QuestionnaireData }) {
  // The draft lives in sessionStorage, which only exists in the browser: render once hydrated.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!hydrated) return <p className="text-slate-500">Loading questionnaire…</p>;
  return <Questionnaire questionnaire={questionnaire} />;
}

function Questionnaire({ questionnaire }: { questionnaire: QuestionnaireData }) {
  const { criteria: CRITERIA, questions: QUESTIONS, code: versionCode } = questionnaire;
  // Step 0: context, steps 1..n: criteria, last step: review.
  const REVIEW_STEP = CRITERIA.length + 1;
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Restores a draft from this tab, e.g. after going back from the report to modify answers.
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => loadDraft(versionCode)?.answers ?? {});
  const [context, setContext] = useState<AssessmentContext>(() => loadDraft(versionCode)?.context ?? {});
  const [showMissing, setShowMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Same id for re-sends of identical content, so a double click creates only one assessment.
  const lastRequest = useRef<{ key: string; id: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => saveDraft({ versionCode, answers, context }), [versionCode, answers, context]);

  const answeredCount = QUESTIONS.filter((q) => answers[q.id]).length;
  const missing = missingAnswers(questionnaire, answers);

  /** Unanswered questions of a criterion step (1..n); none for the context and review steps. */
  function missingInStep(i: number): string[] {
    const c = CRITERIA[i - 1];
    if (!c) return [];
    return QUESTIONS.filter((q) => q.criterion === c.id && !answers[q.id]).map((q) => q.id);
  }

  // Every question is required: a section cannot be skipped until all its questions are answered.
  const firstIncompleteStep = CRITERIA.findIndex((_, i) => missingInStep(i + 1).length > 0) + 1 || REVIEW_STEP;

  function goTo(next: number) {
    setStep(next);
    setShowMissing(false);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function next() {
    const stepMissing = missingInStep(step);
    if (stepMissing.length > 0) {
      setShowMissing(true);
      document.getElementById(`q-${stepMissing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    goTo(step + 1);
  }

  async function submit() {
    if (missing.length > 0) {
      const firstMissing = QUESTIONS.find((q) => q.id === missing[0])!;
      goTo(CRITERIA.findIndex((c) => c.id === firstMissing.criterion) + 1);
      setShowMissing(true);
      return;
    }
    const key = JSON.stringify({ answers, context });
    if (lastRequest.current?.key !== key) lastRequest.current = { key, id: crypto.randomUUID() };

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionCode, clientRequestId: lastRequest.current.id, answers, context }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.token) throw new Error(body?.error ?? "Your assessment could not be saved.");
      router.push(`/report/${body.token}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Your assessment could not be saved.");
      setSubmitting(false);
    }
  }

  const criterion = step >= 1 && step <= CRITERIA.length ? CRITERIA[step - 1] : null;

  return (
    <div ref={topRef} className="scroll-mt-4 space-y-6">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm text-slate-600">
          <span>
            {answeredCount} of {QUESTIONS.length} questions answered
          </span>
          <span>{Math.round((answeredCount / QUESTIONS.length) * 100)}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={answeredCount}
        >
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <ol className="flex flex-wrap gap-1 pt-1">
          {["Context", ...CRITERIA.map((c) => c.name), "Review"].map((label, i) => {
            const c = CRITERIA[i - 1];
            const complete = c && QUESTIONS.filter((q) => q.criterion === c.id).every((q) => answers[q.id]);
            const locked = i > firstIncompleteStep;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={locked}
                  title={locked ? "Answer all questions of the previous sections first" : undefined}
                  className={`rounded-full px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                    i === step
                      ? "bg-indigo-600 text-white"
                      : complete
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {complete && i !== step ? "✓ " : ""}
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {step === 0 && (
        <section className="card space-y-4">
          <div>
            <h1 className="text-xl font-semibold">Assessment context</h1>
            <p className="text-sm text-slate-600">
              Optional. This information appears in your report, which is kept for 12 months.
            </p>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Organization name</span>
            <input
              className="input"
              maxLength={120}
              value={context.organization ?? ""}
              onChange={(e) => setContext({ ...context, organization: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">System name</span>
            <input
              className="input"
              maxLength={120}
              placeholder="e.g. ERP, payroll application, CRM"
              value={context.systemName ?? ""}
              onChange={(e) => setContext({ ...context, systemName: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Assessment scope</span>
            <textarea
              className="input min-h-24"
              maxLength={500}
              placeholder="e.g. Finance modules, production environment, hosted by supplier X"
              value={context.scope ?? ""}
              onChange={(e) => setContext({ ...context, scope: e.target.value })}
            />
          </label>
        </section>
      )}

      {criterion && (
        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Criterion {step} of {CRITERIA.length}
            </p>
            <h1 className="text-2xl font-semibold">{criterion.name}</h1>
            <p className="text-sm text-slate-600">{criterion.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              <span className="text-red-600">*</span> All questions are required. Choose{" "}
              <strong>Not applicable</strong> if a question does not apply to your system.
            </p>
          </div>
          {showMissing && missingInStep(step).length > 0 && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Please answer the {missingInStep(step).length} remaining question(s) of this section to continue.
            </p>
          )}
          {QUESTIONS.filter((q) => q.criterion === criterion.id).map((q, index) => {
            const isMissing = showMissing && !answers[q.id];
            return (
              <fieldset
                key={q.id}
                id={`q-${q.id}`}
                aria-required="true"
                className={`card scroll-mt-24 p-5 ${isMissing ? "border-red-400 ring-2 ring-red-100" : ""}`}
              >
                <legend className="sr-only">{q.text} (required)</legend>
                <p className="font-medium">
                  <span className="mr-2 text-slate-400">{index + 1}.</span>
                  {q.text}
                  <span aria-hidden="true" className="ml-1 text-red-600">
                    *
                  </span>
                </p>
                {isMissing && <p className="mt-1 text-sm text-red-600">Please answer this question.</p>}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ANSWERS.map((a) => (
                    <label key={a} className="cursor-pointer">
                      <input
                        type="radio"
                        name={q.id}
                        value={a}
                        required
                        checked={answers[q.id] === a}
                        onChange={() => setAnswers({ ...answers, [q.id]: a })}
                        className="peer sr-only"
                      />
                      <span
                        className={`block rounded-lg border border-slate-300 px-3 py-2 text-center text-sm transition hover:bg-slate-50 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 ${ANSWER_STYLES[a]}`}
                      >
                        {ANSWER_LABELS[a]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </section>
      )}

      {step === REVIEW_STEP && (
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold">Review your answers</h1>
            <p className="text-sm text-slate-600">
              Check your answers before submitting. Click a criterion to modify its answers.
            </p>
          </div>
          {missing.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {missing.length} question(s) still need an answer.
            </div>
          )}
          {CRITERIA.map((c, i) => (
            <div key={c.id} className="card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{c.name}</h2>
                <button type="button" className="text-sm text-indigo-600 hover:underline" onClick={() => goTo(i + 1)}>
                  Modify
                </button>
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {QUESTIONS.filter((q) => q.criterion === c.id).map((q) => (
                  <li key={q.id} className="flex justify-between gap-4 py-2">
                    <span className="text-slate-700">{q.text}</span>
                    <span
                      className={`shrink-0 font-medium ${answers[q.id] ? "text-slate-900" : "text-red-600"}`}
                    >
                      {answers[q.id] ? ANSWER_LABELS[answers[q.id]] : "Missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {submitError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {submitError}
        </p>
      )}

      <div className="flex justify-between gap-3">
        <button type="button" className="btn-secondary" disabled={step === 0} onClick={() => goTo(step - 1)}>
          ← Previous
        </button>
        {step < REVIEW_STEP ? (
          <button type="button" className="btn-primary" onClick={next}>
            {step === CRITERIA.length ? "Review answers" : "Next"} →
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Submit and view report"}
          </button>
        )}
      </div>
    </div>
  );
}
