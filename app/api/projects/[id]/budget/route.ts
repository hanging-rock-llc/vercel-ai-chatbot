import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getProjectBudgetSummary,
  updateBudgetCategory,
} from "@/lib/db/queries-profit-iq";
import { budgetCategoryEnum, type BudgetCategory } from "@/lib/db/schema";

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
    const project = await getProjectById({ id });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const summary = await getProjectBudgetSummary({ projectId: id });
    return Response.json(summary);
  } catch (error) {
    console.error("Failed to fetch budget:", error);
    return Response.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await getProjectById({ id });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { category, estimatedAmount } = body;

    // Validate category
    if (!budgetCategoryEnum.includes(category as BudgetCategory)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    // Validate amount
    const amount = parseFloat(estimatedAmount);
    if (isNaN(amount) || amount < 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    const updated = await updateBudgetCategory({
      projectId: id,
      category: category as BudgetCategory,
      estimatedAmount: amount.toString(),
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Failed to update budget:", error);
    return Response.json({ error: "Failed to update budget" }, { status: 500 });
  }
}
