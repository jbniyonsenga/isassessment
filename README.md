# IT System Quick Audit

Web application for a quick self-assessment of an information system against the seven information quality
criteria associated with COBIT: effectiveness, efficiency, confidentiality, integrity, availability, compliance
and reliability. It scores the answers, shows an online report, generates a PDF and can email it.

The assessment is indicative and is not an official COBIT compliance certification.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- `@react-pdf/renderer` for the PDF report, `nodemailer` (SMTP) or the Resend API for email delivery, `zod` for input validation
- PostgreSQL with Prisma 7 (`@prisma/adapter-pg`)
- Vitest for the scoring engine tests

## Getting started

```bash
npm install                  # also generates the Prisma client
cp .env.example .env         # set DATABASE_URL
npx prisma migrate dev       # create the schema
npx prisma db seed           # load the questionnaire into the database
npm run dev                  # http://localhost:3000
npm test
```

Without `SMTP_HOST`, the development server accepts email requests but does not send anything.

## How it works

| Path | Role |
| --- | --- |
| `prisma/schema.prisma` | Questionnaire versions, criteria, questions, participants, assessments, answers, email requests |
| `prisma/seed.ts` | Loads the questionnaire defined in code into the database (never modifies a published version) |
| `src/lib/assessment/questions.ts` | Source definition of the current questionnaire version |
| `src/lib/assessment/config.ts` | Points per answer, indicative thresholds, scoring version, disclaimer |
| `src/lib/assessment/scoring.ts` | Pure scoring engine, takes the questionnaire as a parameter |
| `src/lib/server/questionnaire.ts` | Loads questionnaire versions from the database (cached, versions are immutable) |
| `src/lib/server/assessments.ts` | Report tokens and loading a stored report |
| `src/lib/server/retention.ts` | 12-month retention and daily purge |
| `src/components/AssessmentForm.tsx` | Questionnaire: context, one step per criterion, review |
| `src/app/report/[token]` | Report page at a secret link |
| `src/lib/pdf/ReportDocument.tsx` | PDF report, rendered from the same result object |
| `src/app/api/assessments` | `POST` answers → stored assessment, returns the report token |
| `src/app/api/report/[token]/pdf` | `GET` → PDF |
| `src/app/api/report/[token]/email` | `POST` email → PDF sent as attachment, delivery recorded |

Data flow:

1. The questionnaire is read from the database. While answering, the draft stays in the tab's `sessionStorage`.
2. On submission the server validates the answers against the active version, computes the score and stores
   the assessment, its answers and the frozen overall score. The user gets a report at `/report/<token>`, where
   the token is 32 random URL-safe characters (NFR-004).
3. Anonymous users are identified by a random id in an HttpOnly cookie (`isa_pid`); no account, no personal data.
4. Email requests are recorded (status, attempts, error) with a client request id so that double clicks send once.
5. Everything is deleted 12 months after the assessment (purge runs at most daily, triggered by submissions;
   expired reports are hidden immediately).

### Questionnaire versions

Edit `src/lib/assessment/questions.ts` **under a new `QUESTIONNAIRE_VERSION`** and deploy: the seed inserts the
new version and makes it active. Existing assessments keep pointing to their own version.

### Scoring

- Yes = 2, Partially = 1, No = 0; Not applicable is excluded from the maximum.
- Score = points / maximum applicable points × 100 for each criterion and overall; no score when nothing applies.
- Critical questions (`critical: true`) answered No → critical risk, Partially → high risk. These are shown in a
  separate alert, whatever the overall score.
- Changing scoring rules: bump `SCORING_VERSION`. Reports are recomputed with the current engine; the score frozen
  at submission is kept in the database for statistics. Both versions are printed on every report.

### Security controls

- Security headers (CSP, HSTS, `X-Frame-Options`, `nosniff`, …) in `next.config.ts`
- JSON-only API bodies, 32 KB limit, strict zod validation, unknown question ids rejected
- Rate limiting by IP (submissions: 20 / h, PDF: 30 / 10 min, email: 5 / h) and by recipient (3 / h, from the
  database), honeypot field, idempotency keys for submissions and emails; failed sends can be retried
- Report pages: `Referrer-Policy: no-referrer`, `noindex`, `no-store`
- Structured logs without answers, organization details or email addresses

## Deployment on Railway

`railway.json` defines the build, the start command (runs `prisma migrate deploy` + seed, then `next start`), a health
check and a single replica.

1. In Railway, create a project from the GitHub repository (deploys on every push to `main`).
2. Add a PostgreSQL service and set `DATABASE_URL=${{Postgres.DATABASE_URL}}` on the app service.
3. Set the variables `RESEND_API_KEY` and `MAIL_FROM` (an address on a domain verified in Resend).
   Railway blocks outbound SMTP on the Hobby plan, so use Resend there; `SMTP_*` works on Pro.
4. Under Settings → Networking, generate a domain (HTTPS is provided by Railway) or attach a custom domain.

## Deployment notes

- Serve over HTTPS only (TLS terminated by the host or a reverse proxy).
- The IP rate limiter is in memory (duplicate guards and recipient limits use the database). That is enough for a single instance; use a shared
  store such as Redis when running several instances.
- `clientIp` reads `X-Forwarded-For`: deploy behind a reverse proxy that sets this header, otherwise clients can
  spoof it to bypass the IP rate limit.
- Configure `RESEND_API_KEY` or `SMTP_*`, and `MAIL_FROM`, with SPF/DKIM on the sending domain.
- Update the privacy page (`src/app/privacy/page.tsx`) with the data controller's identity and contact details.

## Out of MVP scope

User accounts, administration screens and cross-assessment analytics (the data needed for the latter is stored).
