import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getDocumentByIdWithProject,
} from "@/lib/db/queries-profit-iq";
import type { ExtractionResult } from "@/lib/profit-iq/extraction-types";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { ExtractionReview } from "@/components/profit-iq/extraction-review";

export default async function DocumentReviewPage({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, documentId } = await params;

  const [project, document] = await Promise.all([
    getProjectById({ id }),
    getDocumentByIdWithProject({ id: documentId }),
  ]);

  if (!project || project.userId !== session.user.id) {
    notFound();
  }

  if (!document || document.projectId !== id) {
    notFound();
  }

  if (document.status !== "extracted") {
    redirect(`/projects/${id}/documents`);
  }

  const extraction = document.rawExtraction as ExtractionResult;

  if (!extraction) {
    redirect(`/projects/${id}/documents`);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <Link href={`/projects/${id}/documents`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Review Extraction</h1>
          <p className="text-sm text-muted-foreground">{document.fileName}</p>
        </div>
        <a
          href={`/api/documents/${documentId}/download`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm">
            <ExternalLinkIcon className="mr-2 size-4" />
            View PDF
          </Button>
        </a>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-5xl">
          <ExtractionReview document={document} extraction={extraction} />
        </div>
      </main>
    </div>
  );
}
