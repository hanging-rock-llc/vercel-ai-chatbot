import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from "ai";
import { auth } from "@/app/(auth)/auth";
import { getProjectById } from "@/lib/db/queries-profit-iq";
import { myProvider } from "@/lib/ai/providers";
import { createProjectTools } from "@/lib/profit-iq/chat-tools";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a helpful assistant for Profit IQ, a construction project profitability tracking application.

Your role is to help construction contractors and office admins understand their project finances. You have access to tools that let you query:
- Project status and financial summary
- Budget details by category (Labor, Materials, Equipment, Subcontractors, Other)
- Documents (invoices, quotes, estimates)
- Line items and cost breakdowns

When answering questions:
1. Use the available tools to get accurate, up-to-date information
2. Present financial data clearly with proper formatting
3. Highlight any budget overruns or concerns
4. Provide actionable insights when possible
5. Be concise but thorough

Format currency values clearly and use tables or lists to organize information when helpful.`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: projectId } = await params;
    const project = await getProjectById({ id: projectId });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const tools = createProjectTools({ projectId });

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel("chat-model"),
          system: `${SYSTEM_PROMPT}\n\nYou are currently assisting with the project: "${project.name}"${project.clientName ? ` for client ${project.clientName}` : ""}.`,
          messages: convertToModelMessages(messages),
          tools,
          experimental_transform: smoothStream({ chunking: "word" }),
          maxSteps: 5,
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onError: () => {
        return "Sorry, an error occurred while processing your request.";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
