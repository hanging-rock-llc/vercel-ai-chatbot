import { auth } from "@/app/(auth)/auth";
import {
  getDocumentByIdWithProject,
  getProjectById,
  updateDocumentStatus,
  createLineItems,
  deleteLineItemsByDocumentId,
} from "@/lib/db/queries-profit-iq";
import type { BudgetCategory } from "@/lib/db/schema";

export async function POST(
  request: Request,
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

    if (document.status !== "extracted") {
      return Response.json(
        { error: "Document must be in extracted status" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      documentType,
      vendorName,
      documentNumber,
      documentDate,
      dueDate,
      totalAmount,
      lineItems,
    } = body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return Response.json(
        { error: "At least one line item is required" },
        { status: 400 }
      );
    }

    // Delete any existing line items (in case of re-confirmation)
    await deleteLineItemsByDocumentId({ documentId: id });

    // Create new line items
    await createLineItems({
      items: lineItems.map(
        (item: {
          description: string;
          quantity?: string;
          unit?: string;
          unitPrice?: string;
          total: string;
          category?: BudgetCategory;
          sortOrder?: number;
        }) => ({
          documentId: id,
          projectId: document.projectId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          category: item.category,
          sortOrder: item.sortOrder,
        })
      ),
    });

    // Update document status to confirmed
    await updateDocumentStatus({
      id,
      status: "confirmed",
      vendorName,
      documentNumber,
      documentDate,
      dueDate,
      totalAmount,
      documentType,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to confirm document:", error);
    return Response.json(
      { error: "Failed to confirm document" },
      { status: 500 }
    );
  }
}
