import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  updateProject,
  deleteProject,
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
    const project = await getProjectById({ id });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(project);
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return Response.json({ error: "Failed to fetch project" }, { status: 500 });
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
    const updated = await updateProject({
      id,
      name: body.name,
      clientName: body.clientName,
      address: body.address,
      status: body.status,
      contractValue: body.contractValue,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Failed to update project:", error);
    return Response.json({ error: "Failed to update project" }, { status: 500 });
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
    const project = await getProjectById({ id });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteProject({ id });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return Response.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
