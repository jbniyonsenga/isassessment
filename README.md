# IT System Quick Audit

Web application for a quick self-assessment of an information system against the seven information quality
criteria associated with COBIT: effectiveness, efficiency, confidentiality, integrity, availability, compliance
and reliability. It scores the answers, shows an online report, generates a PDF and can email it.

The assessment is indicative and is not an official COBIT compliance certification.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- `@react-pdf/renderer` for the PDF report, `nodemailer` (SMTP) or the Resend API for email delivery, `zod` for input validation
- Vitest for the scoring engine tests
- No database: nothing about an assessment is stored on the server

## Getting started

```bash
npm install
cp .env.example .env.local   # optional in development
npm run dev                  # http://localhost:3000
npm test
```

Without `SMTP_HOST`, the development server accepts email requests but does not send anything.

## How it works

| Path | Role |
| --- | --- |
| `src/lib/assessment/questions.ts` | Criteria and questions (questionnaire version, critical indicators, risks, recommendations) |
| `src/lib/assessment/config.ts` | Points per answer, indicative thresholds, scoring version, disclaimer |
| `src/lib/assessment/scoring.ts` | Pure scoring engine shared by the browser and the server |
| `src/lib/assessment/schema.ts` | Validation of submissions and email requests |
| `src/components/AssessmentForm.tsx` | Questionnaire: context, one step per criterion, review |
| `src/components/ReportView.tsx` | Online report |
| `src/lib/pdf/ReportDocument.tsx` | PDF report, rendered from the same result object |
| `src/app/api/report/pdf` | `POST` answers → PDF |
| `src/app/api/report/email` | `POST` answers + email → PDF sent as attachment |

Data flow:

1. Answers are kept in the browser tab's `sessionStorage` only.
2. The report page computes the result in the browser, so it never depends on email (BR-006).
3. For a PDF or an email, the raw answers are posted to the server, which validates them, **recomputes** the
   scores (client figures are never trusted), renders the PDF in memory and returns or emails it.
4. Reports never have a URL (NFR-004). Email addresses are not stored or logged (FR-037, NFR-008).

### Scoring

- Yes = 2, Partially = 1, No = 0; Not applicable is excluded from the maximum.
- Score = points / maximum applicable points × 100 for each criterion and overall; no score when nothing applies.
- Critical questions (`critical: true`) answered No → critical risk, Partially → high risk. These are shown in a
  separate alert, whatever the overall score.
- Changing questions or scoring rules: bump `QUESTIONNAIRE_VERSION` or `SCORING_VERSION`. Both versions are printed
  on every report.

### Security controls

- Security headers (CSP, HSTS, `X-Frame-Options`, `nosniff`, …) in `next.config.ts`
- JSON-only API bodies, 32 KB limit, strict zod validation, unknown question ids rejected
- Rate limiting by IP (PDF: 30 / 10 min, email: 5 / h) and by recipient (3 / h), honeypot field,
  idempotency key per email request so a double click sends only once; failed sends can be retried
- Structured logs without answers, organization details or email addresses

## Deployment on Railway

`railway.json` defines the build, start command, health check and a single replica.

1. In Railway, create a project from the GitHub repository (deploys on every push to `main`).
2. Set the variables `RESEND_API_KEY` and `MAIL_FROM` (an address on a domain verified in Resend).
   Railway blocks outbound SMTP on the Hobby plan, so use Resend there; `SMTP_*` works on Pro.
3. Under Settings → Networking, generate a domain (HTTPS is provided by Railway) or attach a custom domain.

## Deployment notes

- Serve over HTTPS only (TLS terminated by the host or a reverse proxy).
- The rate limiter and duplicate-request guard are in memory. That is enough for a single instance; use a shared
  store such as Redis when running several instances.
- `clientIp` reads `X-Forwarded-For`: deploy behind a reverse proxy that sets this header, otherwise clients can
  spoof it to bypass the IP rate limit.
- Configure `RESEND_API_KEY` or `SMTP_*`, and `MAIL_FROM`, with SPF/DKIM on the sending domain.
- Update the privacy page (`src/app/privacy/page.tsx`) with the data controller's identity and contact details.

## Out of MVP scope

User accounts, assessment history, administration and cross-assessment analytics.
