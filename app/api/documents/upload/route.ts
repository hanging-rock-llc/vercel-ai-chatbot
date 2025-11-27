import { put } from "@vercel/blob";
import { auth } from "@/app/(auth)/auth";
import { getProjectById, createProjectDocument } from "@/lib/db/queries-profit-iq";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await getProjectById({ id: projectId });
    if (!project || project.userId !== session.user.id) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `documents/${projectId}/${timestamp}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    // Create database record
    const document = await createProjectDocument({
      projectId,
      userId: session.user.id,
      fileName: file.name,
      filePath: blob.url,
      fileSize: file.size,
      mimeType: file.type,
    });

    return Response.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to upload document:", error);
    return Response.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
