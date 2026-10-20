"use client";

import type { Answer, AssessmentContext } from "./types";

/**
 * The in-progress draft lives only in this browser tab's sessionStorage until the
 * assessment is submitted; it then lets the user go back and modify their answers.
 */
const DRAFT_KEY = "isa:draft";

export interface Draft {
  versionCode: string;
  answers: Record<string, Answer>;
  context: AssessmentContext;
}

export function loadDraft(versionCode: string): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const draft = raw ? (JSON.parse(raw) as Draft) : null;
    // A draft made on another questionnaire version cannot be reused.
    return draft?.versionCode === versionCode ? draft : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode, quota): the flow still works within the page.
  }
}
