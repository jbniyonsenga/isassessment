import Link from "next/link";
import { CRITERIA, QUESTIONS } from "@/lib/assessment/questions";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How sound is your information system?
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Answer {QUESTIONS.length} questions on the seven information quality criteria associated with COBIT and
          get an immediate report with scores, identified risks and improvement recommendations.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <li>✓ No registration</li>
          <li>✓ About 10 minutes</li>
          <li>✓ Online report and PDF</li>
          <li>✓ Answers are not stored</li>
        </ul>
        <div className="flex gap-3 pt-2">
          <Link href="/assessment" className="btn-primary px-6 py-3 text-base">
            Start the assessment
          </Link>
          <Link href="/methodology" className="btn-secondary px-6 py-3 text-base">
            How it works
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">The seven criteria</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CRITERIA.map((c) => (
            <div key={c.id} className="card p-5">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <strong>Indicative assessment.</strong> The result reflects your own answers. It is not an audit and does not
        constitute an official COBIT compliance certification.
      </section>
    </div>
  );
}
