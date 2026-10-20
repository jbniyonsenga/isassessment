-- CreateEnum
CREATE TYPE "ScoreLevel" AS ENUM ('strong', 'moderate', 'weak');

-- CreateEnum
CREATE TYPE "AnswerValue" AS ENUM ('yes', 'partial', 'no', 'na');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "QuestionnaireVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "organization" TEXT,
    "systemName" TEXT,
    "scope" TEXT,
    "score" DOUBLE PRECISION,
    "level" "ScoreLevel",
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" "AnswerValue" NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("assessmentId","questionId")
);

-- CreateTable
CREATE TABLE "EmailRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireVersion_code_key" ON "QuestionnaireVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_versionId_key_key" ON "Criterion"("versionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Question_criterionId_code_key" ON "Question"("criterionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_token_key" ON "Assessment"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_clientRequestId_key" ON "Assessment"("clientRequestId");

-- CreateIndex
CREATE INDEX "Assessment_submittedAt_idx" ON "Assessment"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRequest_requestId_key" ON "EmailRequest"("requestId");

-- CreateIndex
CREATE INDEX "EmailRequest_email_createdAt_idx" ON "EmailRequest"("email", "createdAt");

-- CreateIndex
CREATE INDEX "EmailRequest_createdAt_idx" ON "EmailRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuestionnaireVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuestionnaireVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailRequest" ADD CONSTRAINT "EmailRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
