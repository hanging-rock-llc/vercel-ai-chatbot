"use client";

import { useRouter } from "next/navigation";
import type { BudgetSummaryItem } from "@/lib/db/queries-profit-iq";
import { BudgetTable } from "./budget-table";

interface BudgetTableWrapperProps {
  projectId: string;
  initialSummary: BudgetSummaryItem[];
}

export function BudgetTableWrapper({
  projectId,
  initialSummary,
}: BudgetTableWrapperProps) {
  const router = useRouter();

  return (
    <BudgetTable
      projectId={projectId}
      summary={initialSummary}
      onUpdate={() => router.refresh()}
    />
  );
}
