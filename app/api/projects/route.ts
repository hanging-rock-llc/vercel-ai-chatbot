import { auth } from "@/app/(auth)/auth";
import {
  createProject,
  getProjectsByUserId,
} from "@/lib/db/queries-profit-iq";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getProjectsByUserId({ userId: session.user.id });
    return Response.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, clientName, address, contractValue, startDate, endDate } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await createProject({
      userId: session.user.id,
      name: name.trim(),
      clientName: clientName?.trim() || undefined,
      address: address?.trim() || undefined,
      contractValue: contractValue || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }
}
