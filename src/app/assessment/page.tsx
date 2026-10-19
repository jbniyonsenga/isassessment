import type { Metadata } from "next";
import { AssessmentForm } from "@/components/AssessmentForm";

export const metadata: Metadata = { title: "Assessment — IT System Quick Audit" };

export default function AssessmentPage() {
  return <AssessmentForm />;
}
