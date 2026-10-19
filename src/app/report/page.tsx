import type { Metadata } from "next";
import { ReportScreen } from "@/components/ReportScreen";

export const metadata: Metadata = {
  title: "Report — IT System Quick Audit",
  robots: { index: false, follow: false },
};

export default function ReportPage() {
  return <ReportScreen />;
}
