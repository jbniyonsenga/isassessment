"use client";

import Link from "next/link";
import { useState } from "react";

type State =
  | { name: "editing" }
  | { name: "confirming" }
  | { name: "sending" }
  | { name: "sent"; to: string }
  | { name: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Optional email delivery (FR-030 to FR-037). The online report never depends on it (BR-006). */
export function EmailReportForm({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<State>({ name: "editing" });
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  function review(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError("Please enter a valid email address.");
      return;
    }
    setFieldError(null);
    setState({ name: "confirming" });
  }

  async function send() {
    if (state.name === "sending") return;
    setState({ name: "sending" });
    try {
      const res = await fetch(`/api/report/${token}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), requestId, website }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "The email could not be sent.");
      setState({ name: "sent", to: email.trim() });
      setRequestId(crypto.randomUUID());
    } catch (error) {
      setState({
        name: "error",
        message: error instanceof Error ? error.message : "The email could not be sent.",
      });
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Receive the PDF report by email</h2>
        <p className="text-sm text-slate-600">
          Optional. Your address is used only to send this report and to keep a record of the delivery for 12
          months. It will never be used for marketing. <Link href="/privacy" className="underline">Privacy notice</Link>.
        </p>
      </div>

      {state.name === "sent" ? (
        <div role="status" className="space-y-2">
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Your request has been accepted. The report is being sent to <strong>{state.to}</strong>. Check your spam
            folder if you do not receive it within a few minutes.
          </p>
          <button type="button" className="text-sm text-indigo-600 hover:underline" onClick={() => setState({ name: "editing" })}>
            Send to another address
          </button>
        </div>
      ) : state.name === "editing" ? (
        <form onSubmit={review} className="space-y-2" noValidate>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input sm:max-w-sm"
              placeholder="name@example.com"
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "email-error" : undefined}
            />
            {/* Honeypot: hidden from people, filled in by naive bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <button type="submit" className="btn-secondary">
              Continue
            </button>
          </div>
          {fieldError && (
            <p id="email-error" className="text-sm text-red-600">
              {fieldError}
            </p>
          )}
        </form>
      ) : (
        <div className="space-y-3">
          {state.name === "error" ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {state.message}
            </p>
          ) : (
            <p className="text-sm">
              Send the PDF report to <strong>{email.trim()}</strong>?
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={send} disabled={state.name === "sending"}>
              {state.name === "sending" ? "Sending…" : state.name === "error" ? "Retry" : "Confirm and send"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={state.name === "sending"}
              onClick={() => setState({ name: "editing" })}
            >
              Change address
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
