"use client";

import { formatDistanceToNow } from "date-fns";
import { Mail, Paperclip, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectDocument } from "@/lib/db/schema";

interface EmailCardProps {
  email: ProjectDocument;
  attachments?: ProjectDocument[];
  onAttachmentClick?: (attachment: ProjectDocument) => void;
}

export function EmailCard({ email, attachments = [], onAttachmentClick }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAttachments = attachments.length > 0;
  const rawExtraction = email.rawExtraction as {
    summary?: string;
    has_financial_content?: boolean;
    amounts_mentioned?: Array<{ value: number; context: string }>;
  } | null;

  const hasFinancialContent = rawExtraction?.has_financial_content;
  const amounts = rawExtraction?.amounts_mentioned || [];
  const totalAmount = amounts.reduce((sum, a) => sum + a.value, 0);

  return (
    <Card data-testid="email-card" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-lg bg-muted p-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-medium truncate">
                {email.emailSubject || "(No Subject)"}
              </CardTitle>
              <CardDescription className="mt-1 truncate">
                From: {email.emailFrom || "Unknown"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasFinancialContent && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <DollarSign className="h-3 w-3 mr-1" />
                {totalAmount > 0
                  ? `$${totalAmount.toLocaleString()}`
                  : "Financial"}
              </Badge>
            )}
            {hasAttachments && (
              <Badge variant="outline">
                <Paperclip className="h-3 w-3 mr-1" />
                {attachments.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary from extraction */}
        {rawExtraction?.summary && (
          <p className="text-sm text-muted-foreground mb-3">
            {rawExtraction.summary}
          </p>
        )}

        {/* Email body preview */}
        {email.emailBody && (
          <div className="relative">
            <div
              className={cn(
                "text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3 overflow-hidden",
                !isExpanded && "max-h-24"
              )}
            >
              {email.emailBody}
            </div>
            {email.emailBody.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 h-7"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Amounts mentioned */}
        {amounts.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Amounts mentioned:
            </p>
            <div className="flex flex-wrap gap-2">
              {amounts.slice(0, 5).map((amount, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  ${amount.value.toLocaleString()} - {amount.context.slice(0, 30)}
                  {amount.context.length > 30 && "..."}
                </Badge>
              ))}
              {amounts.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{amounts.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Attachments:
            </p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <Button
                  key={att.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAttachmentClick?.(att)}
                >
                  <Paperclip className="h-3 w-3 mr-1" />
                  {att.fileName}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {email.emailReceivedAt
              ? formatDistanceToNow(new Date(email.emailReceivedAt), {
                  addSuffix: true,
                })
              : formatDistanceToNow(new Date(email.createdAt), {
                  addSuffix: true,
                })}
          </span>
          <StatusBadge status={email.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
    processing: { className: "bg-blue-100 text-blue-800", label: "Processing" },
    extracted: { className: "bg-purple-100 text-purple-800", label: "Review" },
    confirmed: { className: "bg-green-100 text-green-800", label: "Confirmed" },
    rejected: { className: "bg-red-100 text-red-800", label: "Rejected" },
    failed: { className: "bg-red-100 text-red-800", label: "Failed" },
  };

  const variant = variants[status] || { className: "bg-gray-100", label: status };

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}
