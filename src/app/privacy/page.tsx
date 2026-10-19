import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy — IT System Quick Audit" };

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Privacy notice</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we process</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Answers and assessment context</strong> (organization, system name, scope): kept only in your
            browser tab (session storage). They are sent to the server only to generate a PDF or an email, processed
            in memory and not stored.
          </li>
          <li>
            <strong>Email address</strong> (only if you request delivery by email): used solely to send the report.
            It is not stored, not added to any mailing list and never used for marketing.
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
          No assessment is stored on our servers. Your answers are deleted when you close the browser tab or click
          &quot;Clear my answers&quot; on the report page. Rate-limiting data expires within one hour. Emails sent
          remain subject to the retention of the email providers involved.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Legal basis and your rights</h2>
        <p>
          Processing is based on your request (sending the report you asked for) and on the legitimate interest of
          protecting the service. Under the GDPR you have the right to access, rectify and erase your data and to
          object to processing. As no assessment data is retained, there is usually nothing to access or erase after
          your session ends.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Security</h2>
        <p>
          All communications use HTTPS. Reports are never published at a URL: they exist only in your browser and
          in the PDF you download or receive.
        </p>
      </section>
    </article>
  );
}
