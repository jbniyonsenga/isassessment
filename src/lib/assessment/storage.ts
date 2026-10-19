"use client";

import type { Answer, AssessmentContext } from "./types";

/**
 * Answers live only in this browser tab's sessionStorage: nothing is stored on the
 * server and the data disappears when the tab is closed (NFR-003, NFR-004).
 */
const DRAFT_KEY = "isa:draft";
const SUBMITTED_KEY = "isa:submitted";

export interface Draft {
  answers: Record<string, Answer>;
  context: AssessmentContext;
}

export interface Submitted extends Draft {
  assessedAt: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): the flow still works within the page.
  }
}

export const loadDraft = () => read<Draft>(DRAFT_KEY);
export const saveDraft = (draft: Draft) => write(DRAFT_KEY, draft);
export const saveSubmitted = (submitted: Submitted) => write(SUBMITTED_KEY, submitted);

const CHANGE_EVENT = "isa:storage";
let cachedRaw: string | null = null;
let cachedSubmitted: Submitted | null = null;

/** Snapshot for useSyncExternalStore: stable as long as the stored value does not change. */
export function getSubmittedSnapshot(): Submitted | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(SUBMITTED_KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSubmitted = read<Submitted>(SUBMITTED_KEY);
  }
  return cachedSubmitted;
}

export function subscribeSubmitted(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function clearAll() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(SUBMITTED_KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
