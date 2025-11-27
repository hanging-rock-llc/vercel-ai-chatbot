"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckIcon,
  XIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  Loader2Icon,
} from "lucide-react";
import type { ProjectDocument } from "@/lib/db/schema";
import type {
  ExtractionResult,
  LineItem,
  BudgetCategory,
} from "@/lib/profit-iq/extraction-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES: BudgetCategory[] = [
  "Labor",
  "Materials",
  "Equipment",
  "Subcontractors",
  "Other",
];

const DOCUMENT_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "quote", label: "Quote" },
  { value: "estimate", label: "Estimate" },
  { value: "change_order", label: "Change Order" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface ExtractionReviewProps {
  document: ProjectDocument;
  extraction: ExtractionResult;
}

export function ExtractionReview({
  document,
  extraction,
}: ExtractionReviewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Editable state
  const [documentType, setDocumentType] = useState(extraction.document_type);
  const [vendorName, setVendorName] = useState(extraction.vendor.name);
  const [documentNumber, setDocumentNumber] = useState(
    extraction.document_info.number || ""
  );
  const [documentDate, setDocumentDate] = useState(
    extraction.document_info.date
  );
  const [dueDate, setDueDate] = useState(
    extraction.document_info.due_date || ""
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(extraction.line_items);

  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              // Recalculate total if quantity or unit_price changes
              ...(field === "quantity" || field === "unit_price"
                ? {
                    total:
                      (field === "quantity" ? value : item.quantity || 1) *
                      (field === "unit_price" ? value : item.unit_price || 0),
                  }
                : {}),
            }
          : item
      )
    );
  };

  const deleteLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: "New item",
        quantity: 1,
        unit: "each",
        unit_price: 0,
        total: 0,
        category: "Other",
      },
    ]);
    setEditingItemId(lineItems.length);
  };

  const handleConfirm = async () => {
    if (lineItems.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          vendorName,
          documentNumber,
          documentDate,
          dueDate,
          totalAmount: totalAmount.toString(),
          lineItems: lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity?.toString(),
            unit: item.unit,
            unitPrice: item.unit_price?.toString(),
            total: item.total.toString(),
            category: item.category,
            sortOrder: index,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to confirm extraction");
      }

      toast.success("Document confirmed successfully");
      router.push(`/projects/${document.projectId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to confirm extraction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reject extraction");
      }

      toast.success("Extraction rejected. You can re-extract or delete this document.");
      router.push(`/projects/${document.projectId}/documents`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to reject extraction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confidence Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={cn(
            extraction.confidence >= 0.8
              ? "bg-green-100 text-green-800"
              : extraction.confidence >= 0.6
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          )}
        >
          {Math.round(extraction.confidence * 100)}% Confidence
        </Badge>
        <span className="text-sm text-muted-foreground">
          Review and edit the extracted data below
        </span>
      </div>

      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={(v: any) => setDocumentType(v)}>
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document #</Label>
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentDate">Document Date</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 font-semibold">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button size="sm" variant="outline" onClick={addLineItem}>
              <PlusIcon className="mr-2 size-4" />
              Add Item
            </Button>
          </div>
          <CardDescription>
            Click on a row to edit. Each item will be categorized and added to your budget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      "cursor-pointer",
                      editingItemId === index && "bg-muted"
                    )}
                    onClick={() => setEditingItemId(index)}
                  >
                    <TableCell>
                      {editingItemId === index ? (
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(index, "description", e.target.value)
                          }
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm">{item.description}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingItemId === index ? (
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || undefined
                            )
                          }
                          className="h-8 w-20 text-right"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === index ? (
                        <Input
                          value={item.unit || ""}
                          onChange={(e) =>
                            updateLineItem(index, "unit", e.target.value)
                          }
                          className="h-8 w-20"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        item.unit
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingItemId === index ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price || ""}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "unit_price",
                              parseFloat(e.target.value) || undefined
                            )
                          }
                          className="h-8 w-24 text-right"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : item.unit_price ? (
                        formatCurrency(item.unit_price)
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {editingItemId === index ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.total}
                          onChange={(e) =>
                            updateLineItem(
                              index,
                              "total",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 w-24 text-right"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        formatCurrency(item.total)
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.category}
                        onValueChange={(v: BudgetCategory) =>
                          updateLineItem(index, "category", v)
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-32"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLineItem(index);
                        }}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isSubmitting}
        >
          <XIcon className="mr-2 size-4" />
          Reject
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckIcon className="mr-2 size-4" />
          )}
          Confirm & Add to Budget
        </Button>
      </div>
    </div>
  );
}
