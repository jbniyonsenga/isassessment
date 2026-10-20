"use client";

import Link from "next/link";
import { useState } from "react";

export function ReportActions({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the URL remains in the address bar.
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Assessment report</h1>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={copyLink}>
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
        <Link href="/assessment" className="btn-secondary">
          New / modified assessment
        </Link>
        <a href={`/api/report/${token}/pdf`} className="btn-primary" download>
          Download PDF
        </a>
      </div>
    </div>
  );
}
