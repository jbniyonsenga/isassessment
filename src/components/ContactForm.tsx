"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/contact";

type State = { name: "editing" } | { name: "sending" } | { name: "sent" } | { name: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Fields {
  name: string;
  email: string;
  organization: string;
  topic: ContactTopic;
  message: string;
  consent: boolean;
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic");
  const [fields, setFields] = useState<Fields>({
    name: "",
    email: "",
    organization: "",
    topic: initialTopic && initialTopic in CONTACT_TOPICS ? (initialTopic as ContactTopic) : "help",
    message: "",
    consent: false,
  });
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [state, setState] = useState<State>({ name: "editing" });
  // Same id while the content is unchanged, so a double click stores the message once.
  const lastRequest = useRef<{ key: string; id: string } | null>(null);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!fields.name.trim()) e.name = "Please enter your name.";
    if (!EMAIL_PATTERN.test(fields.email.trim())) e.email = "Please enter a valid email address.";
    if (fields.message.trim().length < 10) e.message = "Please write at least 10 characters.";
    if (!fields.consent) e.consent = "Please confirm you have read the privacy notice.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state.name === "sending" || !validate()) return;

    const key = JSON.stringify(fields);
    if (lastRequest.current?.key !== key) lastRequest.current = { key, id: crypto.randomUUID() };

    setState({ name: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, email: fields.email.trim(), requestId: lastRequest.current.id, website }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Your message could not be sent.");
      setState({ name: "sent" });
    } catch (error) {
      setState({ name: "error", message: error instanceof Error ? error.message : "Your message could not be sent." });
    }
  }

  if (state.name === "sent") {
    return (
      <div role="status" className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Thank you, your message has been received.</h2>
        <p className="text-sm text-slate-600">We will get back to you at {fields.email.trim()} as soon as possible.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="btn-secondary">
            Back to home
          </Link>
          <Link href="/assessment" className="btn-primary">
            Start the assessment
          </Link>
        </div>
      </div>
    );
  }

  const fieldError = (key: keyof Fields) =>
    errors[key] ? (
      <p id={`${key}-error`} className="text-sm text-red-600">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            Name <span className="text-red-600">*</span>
          </span>
          <input
            className="input"
            autoComplete="name"
            maxLength={120}
            required
            value={fields.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {fieldError("name")}
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            Email <span className="text-red-600">*</span>
          </span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={fields.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {fieldError("email")}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Organization</span>
          <input
            className="input"
            autoComplete="organization"
            maxLength={120}
            value={fields.organization}
            onChange={(e) => set("organization", e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">
            Subject <span className="text-red-600">*</span>
          </span>
          <select className="input" value={fields.topic} onChange={(e) => set("topic", e.target.value as ContactTopic)}>
            {Object.entries(CONTACT_TOPICS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">
          Message <span className="text-red-600">*</span>
        </span>
        <textarea
          className="input min-h-36"
          maxLength={5000}
          required
          value={fields.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        <span className="block text-right text-xs text-slate-400">{fields.message.length} / 5000</span>
        {fieldError("message")}
      </label>

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

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-indigo-600"
          checked={fields.consent}
          onChange={(e) => set("consent", e.target.checked)}
          aria-invalid={!!errors.consent}
        />
        <span>
          I agree that my message and contact details are stored to answer my request, and deleted after 12 months (
          <Link href="/privacy" className="underline">
            privacy notice
          </Link>
          ). They will never be used for marketing. <span className="text-red-600">*</span>
        </span>
      </label>
      {fieldError("consent")}

      {state.name === "error" && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          <span className="text-red-600">*</span> Required
        </span>
        <button type="submit" className="btn-primary" disabled={state.name === "sending"}>
          {state.name === "sending" ? "Sending…" : state.name === "error" ? "Retry" : "Send message"}
        </button>
      </div>
    </form>
  );
}
