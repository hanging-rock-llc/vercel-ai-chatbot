import { del } from "@vercel/blob";
import { auth } from "@/app/(auth)/auth";
import {
  getDocumentByIdWithProject,
  deleteProjectDocument,
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

    return Response.json(document);
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return Response.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete from blob storage
    try {
      await del(document.filePath);
    } catch (blobError) {
      console.error("Failed to delete blob:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database (cascades to line items)
    await deleteProjectDocument({ id });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return Response.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
