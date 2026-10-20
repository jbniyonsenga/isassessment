import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy — IT System Quick Audit" };

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Privacy notice</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we process and why</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Answers and assessment context</strong> (optional organization name, system name and scope):
            stored to produce your report and make it available at a private link, and used in aggregated,
            anonymous form for statistics.
          </li>
          <li>
            <strong>Anonymous identifier</strong>: a random identifier stored in a cookie (
            <code>isa_pid</code>) links your assessments together. It contains no personal information. No account
            is created.
          </li>
          <li>
            <strong>Email address</strong> (only if you request delivery by email): used to send the report and kept
            with the delivery record (status, date) for follow-up and abuse prevention. It is never used for
            marketing and never shared.
          </li>
          <li>
            <strong>Technical data</strong>: your IP address is kept briefly in memory to protect the service
            against abuse (rate limiting). Server logs record technical events and errors, without your answers or
            email address.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Retention</h2>
        <p>
          Assessments, answers, email delivery records and anonymous identifiers are deleted automatically{" "}
          <strong>12 months</strong> after the assessment. Rate-limiting data expires within one hour. Emails sent
          remain subject to the retention of the email providers involved.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Access to reports</h2>
        <p>
          Each report is available only at a long, random, unguessable link. Reports are never listed or indexed.
          Anyone you share the link with can view the report, so share it only with people you trust.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Legal basis and your rights</h2>
        <p>
          Processing is based on your request (producing and sending the report you asked for) and on the legitimate
          interest of protecting the service and producing anonymous statistics. Under the GDPR you have the right to
          access, rectify and erase your data and to object to processing. To exercise these rights, contact us with
          the link of the report concerned.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Security</h2>
        <p>All communications use HTTPS. Data is stored in a database hosted in the cloud by our hosting provider.</p>
      </section>
    </article>
  );
}
