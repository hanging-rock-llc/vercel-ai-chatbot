"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import type { BudgetSummaryItem } from "@/lib/db/queries-profit-iq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getVarianceColor(variance: number): string {
  if (variance > 0) return "text-green-600 dark:text-green-400";
  if (variance < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

interface BudgetTableProps {
  projectId: string;
  summary: BudgetSummaryItem[];
  onUpdate?: () => void;
}

export function BudgetTable({ projectId, summary, onUpdate }: BudgetTableProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = summary.reduce(
    (acc, item) => ({
      estimated: acc.estimated + item.estimatedAmount,
      actual: acc.actual + item.actualAmount,
      variance: acc.variance + item.variance,
    }),
    { estimated: 0, actual: 0, variance: 0 }
  );

  const startEditing = (category: string, currentValue: number) => {
    setEditingCategory(category);
    setEditValue(currentValue.toString());
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  const saveEstimate = async (category: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          estimatedAmount: editValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update budget");
      }

      toast.success("Budget updated");
      setEditingCategory(null);
      setEditValue("");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Estimated</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.map((item) => (
            <TableRow key={item.category}>
              <TableCell className="font-medium">{item.category}</TableCell>
              <TableCell className="text-right">
                {editingCategory === item.category ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-8 w-32 text-right ml-auto"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEstimate(item.category);
                      if (e.key === "Escape") cancelEditing();
                    }}
                  />
                ) : (
                  formatCurrency(item.estimatedAmount)
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.actualAmount)}
              </TableCell>
              <TableCell
                className={cn("text-right font-medium", getVarianceColor(item.variance))}
              >
                {item.variance >= 0 ? "+" : ""}
                {formatCurrency(item.variance)}
              </TableCell>
              <TableCell>
                {editingCategory === item.category ? (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => saveEstimate(item.category)}
                      disabled={isSubmitting}
                    >
                      <CheckIcon className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={cancelEditing}
                      disabled={isSubmitting}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEditing(item.category, item.estimatedAmount)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(totals.estimated)}
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatCurrency(totals.actual)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-semibold",
                getVarianceColor(totals.variance)
              )}
            >
              {totals.variance >= 0 ? "+" : ""}
              {formatCurrency(totals.variance)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
