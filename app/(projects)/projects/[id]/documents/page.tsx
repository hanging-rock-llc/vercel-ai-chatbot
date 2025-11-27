import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getDocumentsByProjectId,
} from "@/lib/db/queries-profit-iq";
import { SidebarToggle } from "@/components/sidebar-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadZone } from "@/components/profit-iq/upload-zone";
import { DocumentsList } from "@/components/profit-iq/documents-list";

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const project = await getProjectById({ id });

  if (!project || project.userId !== session.user.id) {
    notFound();
  }

  const documents = await getDocumentsByProjectId({ projectId: id });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload invoices, quotes, estimates, and receipts. We'll extract
                the data automatically using AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone projectId={id} />
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                {documents.length === 0
                  ? "No documents uploaded yet"
                  : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsList documents={documents} projectId={id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
