"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadIcon, FileIcon, XIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  projectId: string;
  onUploadComplete?: () => void;
}

export function UploadZone({ projectId, onUploadComplete }: UploadZoneProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );

    if (files.length === 0) {
      toast.error("Please drop PDF files only");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
        ? Array.from(e.target.files).filter(
            (file) => file.type === "application/pdf"
          )
        : [];

      if (files.length === 0) {
        toast.error("Please select PDF files only");
        return;
      }

      setSelectedFiles((prev) => [...prev, ...files]);
      e.target.value = "";
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to upload ${file.name}`);
        }
      }

      toast.success(
        selectedFiles.length === 1
          ? "Document uploaded successfully"
          : `${selectedFiles.length} documents uploaded successfully`
      );
      setSelectedFiles([]);
      router.refresh();
      onUploadComplete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload documents"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <UploadIcon className="mb-4 size-10 text-muted-foreground" />
        <p className="mb-2 text-sm font-medium">
          Drag and drop PDF files here, or{" "}
          <label className="cursor-pointer text-primary hover:underline">
            browse
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </p>
        <p className="text-xs text-muted-foreground">
          Upload invoices, quotes, estimates, and receipts
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected Files ({selectedFiles.length})
          </p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3"
              >
                <FileIcon className="size-5 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={uploadFiles} disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 size-4" />
                Upload {selectedFiles.length}{" "}
                {selectedFiles.length === 1 ? "File" : "Files"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
