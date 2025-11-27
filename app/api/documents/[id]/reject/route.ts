import { auth } from "@/app/(auth)/auth";
import {
  getDocumentByIdWithProject,
  getProjectById,
  updateDocumentStatus,
  deleteLineItemsByDocumentId,
} from "@/lib/db/queries-profit-iq";

export async function POST(
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

    // Delete any existing line items
    await deleteLineItemsByDocumentId({ documentId: id });

    // Update document status to rejected
    await updateDocumentStatus({
      id,
      status: "rejected",
      rawExtraction: null,
      vendorName: undefined,
      documentNumber: undefined,
      documentDate: undefined,
      dueDate: undefined,
      totalAmount: undefined,
      documentType: undefined,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to reject document:", error);
    return Response.json(
      { error: "Failed to reject document" },
      { status: 500 }
    );
  }
}
