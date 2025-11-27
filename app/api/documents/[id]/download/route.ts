import { auth } from "@/app/(auth)/auth";
import {
  getDocumentByIdWithProject,
  getProjectById,
} from "@/lib/db/queries-profit-iq";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const document = await getDocumentByIdWithProject({ id });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify project ownership
    const project = await getProjectById({ id: document.projectId });
    if (!project || project.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Redirect to the blob URL
    return Response.redirect(document.filePath, 302);
  } catch (error) {
    console.error("Failed to download document:", error);
    return Response.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}
