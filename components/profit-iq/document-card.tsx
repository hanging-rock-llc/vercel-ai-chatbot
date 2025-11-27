"use client";

import Link from "next/link";
import {
  FileTextIcon,
  MoreVerticalIcon,
  TrashIcon,
  EyeIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  Loader2Icon,
} from "lucide-react";
import type { ProjectDocument } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: string | number | null): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const statusConfig: Record<string, StatusConfig> = {
  pending: {
    label: "Pending",
    icon: ClockIcon,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  },
  processing: {
    label: "Processing",
    icon: Loader2Icon,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  extracted: {
    label: "Review",
    icon: EyeIcon,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircleIcon,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircleIcon,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  failed: {
    label: "Failed",
    icon: AlertCircleIcon,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
};

const documentTypeLabels: Record<string, string> = {
  invoice: "Invoice",
  quote: "Quote",
  estimate: "Estimate",
  change_order: "Change Order",
  receipt: "Receipt",
  other: "Other",
};

interface DocumentCardProps {
  document: ProjectDocument;
  onExtract?: (id: string) => void;
  onDelete?: (id: string) => void;
  isExtracting?: boolean;
}

export function DocumentCard({
  document,
  onExtract,
  onDelete,
  isExtracting,
}: DocumentCardProps) {
  const status = statusConfig[document.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const showExtractButton = document.status === "pending" || document.status === "failed";
  const showReviewButton = document.status === "extracted";

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
        <FileTextIcon className="size-5 text-red-600 dark:text-red-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{document.fileName}</p>
          {document.documentType && (
            <Badge variant="outline" className="text-xs">
              {documentTypeLabels[document.documentType] || document.documentType}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {document.vendorName && <span>{document.vendorName}</span>}
          {document.documentDate && (
            <span>{formatDate(document.documentDate)}</span>
          )}
          {document.totalAmount && (
            <span className="font-medium text-foreground">
              {formatCurrency(document.totalAmount)}
            </span>
          )}
        </div>
      </div>

      <Badge
        variant="secondary"
        className={cn("flex items-center gap-1", status.color)}
      >
        <StatusIcon
          className={cn(
            "size-3",
            document.status === "processing" && "animate-spin"
          )}
        />
        {status.label}
      </Badge>

      <div className="flex items-center gap-2">
        {showExtractButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExtract?.(document.id)}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 size-4" />
            )}
            Extract
          </Button>
        )}

        {showReviewButton && (
          <Link href={`/projects/${document.projectId}/documents/${document.id}/review`}>
            <Button size="sm">
              <EyeIcon className="mr-2 size-4" />
              Review
            </Button>
          </Link>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8">
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href={`/api/documents/${document.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <EyeIcon className="mr-2 size-4" />
                View PDF
              </a>
            </DropdownMenuItem>
            {showExtractButton && (
              <DropdownMenuItem onClick={() => onExtract?.(document.id)}>
                <RefreshCwIcon className="mr-2 size-4" />
                Extract Data
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete?.(document.id)}
              className="text-red-600"
            >
              <TrashIcon className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
