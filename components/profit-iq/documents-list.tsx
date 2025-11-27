"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileTextIcon } from "lucide-react";
import type { ProjectDocument } from "@/lib/db/schema";
import { DocumentCard } from "./document-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DocumentsListProps {
  documents: ProjectDocument[];
  projectId: string;
}

export function DocumentsList({ documents, projectId }: DocumentsListProps) {
  const router = useRouter();
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleExtract = async (documentId: string) => {
    setExtractingId(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Extraction failed");
      }

      toast.success("Document extracted successfully. Ready for review.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to extract document"
      );
    } finally {
      setExtractingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/documents/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted");
      setDeleteId(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <FileTextIcon className="mb-4 size-10 text-muted-foreground" />
        <p className="text-sm font-medium">No documents yet</p>
        <p className="text-sm text-muted-foreground">
          Upload invoices, quotes, or estimates to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onExtract={handleExtract}
            onDelete={(id) => setDeleteId(id)}
            isExtracting={extractingId === doc.id}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this document and all its extracted
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
