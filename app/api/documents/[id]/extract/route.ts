import { generateText } from "ai";
import { auth } from "@/app/(auth)/auth";
import {
  getDocumentByIdWithProject,
  updateDocumentStatus,
  getProjectById,
  createPromptExecution,
} from "@/lib/db/queries-profit-iq";
import { myProvider } from "@/lib/ai/providers";
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_USER_PROMPT,
} from "@/lib/profit-iq/extraction-prompt";
import {
  extractionResultSchema,
  type ExtractionResult,
} from "@/lib/profit-iq/extraction-types";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

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

    // Update status to processing
    await updateDocumentStatus({ id, status: "processing" });

    try {
      // Fetch the PDF content
      const pdfResponse = await fetch(document.filePath);
      if (!pdfResponse.ok) {
        throw new Error("Failed to fetch PDF");
      }
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      // Call the AI model for extraction
      const result = await generateText({
        model: myProvider.languageModel("extraction-model"),
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "file",
                data: pdfBase64,
                mimeType: "application/pdf",
              },
              {
                type: "text",
                text: EXTRACTION_USER_PROMPT,
              },
            ],
          },
        ],
        maxTokens: 4096,
      });

      const latencyMs = Date.now() - startTime;

      // Parse the JSON response
      let extractionData: ExtractionResult;
      try {
        // Extract JSON from the response (handle potential markdown code blocks)
        let jsonText = result.text.trim();
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.slice(7);
        }
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
          jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        const parsed = JSON.parse(jsonText);
        extractionData = extractionResultSchema.parse(parsed);
      } catch (parseError) {
        console.error("Failed to parse extraction result:", parseError);
        console.error("Raw response:", result.text);

        // Log the failed extraction
        await createPromptExecution({
          promptId: "extraction-v1",
          projectId: document.projectId,
          documentId: document.id,
          inputTokens: result.usage?.promptTokens,
          outputTokens: result.usage?.completionTokens,
          latencyMs,
          rawResponse: result.text,
          metadata: { error: "parse_failed" },
        });

        await updateDocumentStatus({ id, status: "failed" });
        return Response.json(
          { error: "Failed to parse extraction result" },
          { status: 500 }
        );
      }

      // Log successful extraction
      await createPromptExecution({
        promptId: "extraction-v1",
        projectId: document.projectId,
        documentId: document.id,
        inputTokens: result.usage?.promptTokens,
        outputTokens: result.usage?.completionTokens,
        latencyMs,
        rawResponse: result.text,
        parsedResponse: extractionData,
        metadata: {
          confidence: extractionData.confidence,
          documentType: extractionData.document_type,
          lineItemCount: extractionData.line_items.length,
        },
      });

      // Update document with extracted data
      await updateDocumentStatus({
        id,
        status: "extracted",
        rawExtraction: extractionData,
        vendorName: extractionData.vendor.name,
        documentNumber: extractionData.document_info.number,
        documentDate: extractionData.document_info.date,
        dueDate: extractionData.document_info.due_date,
        totalAmount: extractionData.totals.total.toString(),
        documentType: extractionData.document_type,
      });

      return Response.json({
        success: true,
        extraction: extractionData,
      });
    } catch (extractionError) {
      console.error("Extraction failed:", extractionError);
      await updateDocumentStatus({ id, status: "failed" });

      // Log the failed extraction
      await createPromptExecution({
        promptId: "extraction-v1",
        projectId: document.projectId,
        documentId: document.id,
        latencyMs: Date.now() - startTime,
        metadata: {
          error:
            extractionError instanceof Error
              ? extractionError.message
              : "unknown_error",
        },
      });

      return Response.json(
        {
          error:
            extractionError instanceof Error
              ? extractionError.message
              : "Extraction failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to process extraction:", error);
    return Response.json(
      { error: "Failed to process extraction" },
      { status: 500 }
    );
  }
}
