import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/BackLink";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact us — IT System Quick Audit" };

export default function ContactPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <BackLink />
        <h1 className="mt-3 text-3xl font-bold">Contact us</h1>
        <p className="mt-2 text-slate-600">
          A question about the assessment, your report or your data? Need help interpreting the results or an
          in-depth audit? Send us a message and we will get back to you.
        </p>
      </div>
      {/* The form reads ?topic= from the URL, which is only known at request time. */}
      <Suspense fallback={<div className="card h-96" />}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
