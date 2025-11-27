import { tool } from "ai";
import { z } from "zod";
import {
  getProjectById,
  getProjectBudgetSummary,
  getProjectTotals,
  getDocumentsByProjectId,
  getLineItemsByProjectId,
} from "@/lib/db/queries-profit-iq";
import type { BudgetCategory } from "./extraction-types";

export function createProjectTools({ projectId }: { projectId: string }) {
  return {
    getProjectStatus: tool({
      description:
        "Get the current status and financial summary of the project including contract value, costs, and margin",
      parameters: z.object({}),
      execute: async () => {
        const [project, totals, summary] = await Promise.all([
          getProjectById({ id: projectId }),
          getProjectTotals({ projectId }),
          getProjectBudgetSummary({ projectId }),
        ]);

        if (!project) {
          return { error: "Project not found" };
        }

        return {
          project: {
            name: project.name,
            clientName: project.clientName,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
          },
          financials: {
            contractValue: totals.contractValue,
            totalEstimated: totals.totalEstimated,
            totalActual: totals.totalActual,
            marginAmount: totals.marginAmount,
            marginPercent: totals.marginPercent,
          },
          budgetByCategory: summary.map((s) => ({
            category: s.category,
            estimated: s.estimatedAmount,
            actual: s.actualAmount,
            variance: s.variance,
            variancePercent:
              s.estimatedAmount > 0
                ? ((s.variance / s.estimatedAmount) * 100).toFixed(1)
                : "N/A",
          })),
        };
      },
    }),

    getBudgetDetails: tool({
      description:
        "Get detailed budget information for a specific category or all categories",
      parameters: z.object({
        category: z
          .enum(["Labor", "Materials", "Equipment", "Subcontractors", "Other"])
          .optional()
          .describe("Optional: specific category to filter by"),
      }),
      execute: async ({ category }) => {
        const summary = await getProjectBudgetSummary({ projectId });

        const filtered = category
          ? summary.filter((s) => s.category === category)
          : summary;

        const totals = filtered.reduce(
          (acc, s) => ({
            estimated: acc.estimated + s.estimatedAmount,
            actual: acc.actual + s.actualAmount,
            variance: acc.variance + s.variance,
          }),
          { estimated: 0, actual: 0, variance: 0 }
        );

        return {
          categories: filtered.map((s) => ({
            category: s.category,
            estimated: s.estimatedAmount,
            actual: s.actualAmount,
            variance: s.variance,
            status:
              s.variance > 0
                ? "under_budget"
                : s.variance < 0
                  ? "over_budget"
                  : "on_budget",
          })),
          totals: {
            totalEstimated: totals.estimated,
            totalActual: totals.actual,
            totalVariance: totals.variance,
          },
        };
      },
    }),

    getDocuments: tool({
      description:
        "Get a list of documents for the project, optionally filtered by vendor name, document type, or status",
      parameters: z.object({
        vendorName: z
          .string()
          .optional()
          .describe("Filter by vendor name (partial match)"),
        documentType: z
          .enum(["invoice", "quote", "estimate", "change_order", "receipt", "other"])
          .optional()
          .describe("Filter by document type"),
        status: z
          .enum(["pending", "processing", "extracted", "confirmed", "rejected", "failed"])
          .optional()
          .describe("Filter by document status"),
      }),
      execute: async ({ vendorName, documentType, status }) => {
        const documents = await getDocumentsByProjectId({ projectId });

        let filtered = documents;

        if (vendorName) {
          const searchTerm = vendorName.toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.vendorName?.toLowerCase().includes(searchTerm)
          );
        }

        if (documentType) {
          filtered = filtered.filter((d) => d.documentType === documentType);
        }

        if (status) {
          filtered = filtered.filter((d) => d.status === status);
        }

        return {
          count: filtered.length,
          documents: filtered.map((d) => ({
            id: d.id,
            fileName: d.fileName,
            vendorName: d.vendorName,
            documentType: d.documentType,
            status: d.status,
            documentDate: d.documentDate,
            totalAmount: d.totalAmount,
          })),
        };
      },
    }),

    getLineItems: tool({
      description:
        "Get line items from confirmed documents, optionally filtered by category",
      parameters: z.object({
        category: z
          .enum(["Labor", "Materials", "Equipment", "Subcontractors", "Other"])
          .optional()
          .describe("Filter by budget category"),
        limit: z
          .number()
          .optional()
          .default(20)
          .describe("Maximum number of items to return"),
      }),
      execute: async ({ category, limit }) => {
        const items = await getLineItemsByProjectId({ projectId });

        let filtered = items;

        if (category) {
          filtered = filtered.filter((i) => i.category === category);
        }

        const limitedItems = filtered.slice(0, limit);

        const totalAmount = filtered.reduce(
          (sum, i) => sum + parseFloat(i.total || "0"),
          0
        );

        return {
          totalCount: filtered.length,
          returnedCount: limitedItems.length,
          totalAmount,
          items: limitedItems.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            total: i.total,
            category: i.category,
          })),
        };
      },
    }),

    getCostBreakdown: tool({
      description:
        "Get a breakdown of costs by vendor or category to understand spending patterns",
      parameters: z.object({
        groupBy: z
          .enum(["vendor", "category"])
          .describe("Group costs by vendor or by category"),
      }),
      execute: async ({ groupBy }) => {
        const documents = await getDocumentsByProjectId({ projectId });
        const confirmedDocs = documents.filter((d) => d.status === "confirmed");

        if (groupBy === "vendor") {
          const byVendor = new Map<string, number>();
          for (const doc of confirmedDocs) {
            const vendor = doc.vendorName || "Unknown";
            const amount = parseFloat(doc.totalAmount || "0");
            byVendor.set(vendor, (byVendor.get(vendor) || 0) + amount);
          }

          const sorted = Array.from(byVendor.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([vendor, amount]) => ({ vendor, amount }));

          return {
            groupedBy: "vendor",
            breakdown: sorted,
            total: sorted.reduce((sum, v) => sum + v.amount, 0),
          };
        } else {
          const summary = await getProjectBudgetSummary({ projectId });
          return {
            groupedBy: "category",
            breakdown: summary.map((s) => ({
              category: s.category,
              estimated: s.estimatedAmount,
              actual: s.actualAmount,
              variance: s.variance,
            })),
            total: summary.reduce((sum, s) => sum + s.actualAmount, 0),
          };
        }
      },
    }),
  };
}
