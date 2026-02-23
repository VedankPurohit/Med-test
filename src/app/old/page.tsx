import type { Metadata } from "next";
import { PlannerShell } from "@/features/planner/components/PlannerShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function OldPlannerPage() {
  return (
    <div className="planner-legacy">
      <PlannerShell />
    </div>
  );
}
