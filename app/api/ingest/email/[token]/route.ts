import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  getProjectByIngestToken,
  createEmailDocument,
} from "@/lib/db/queries-profit-iq";
import {
  parseSendGridEmail,
  parsePostmarkEmail,
  parseRawEmail,
  isFinancialDocument,
  type ParsedEmail,
} from "@/lib/profit-iq/email-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Email ingestion webhook endpoint
 *
 * Accepts emails from various providers:
 * - SendGrid Inbound Parse (multipart/form-data)
 * - Postmark Inbound (application/json)
 * - Raw RFC 822 format (text/plain or application/octet-stream)
 *
 * URL format: /api/ingest/email/[token]
 * Where [token] is the unique ingestToken for a project
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    // Validate project by ingest token
    const project = await getProjectByIngestToken({ ingestToken: token });
    if (!project) {
      return NextResponse.json(
        { error: "Invalid ingest token" },
        { status: 404 }
      );
    }

    // Parse email based on content type
    const contentType = request.headers.get("content-type") || "";
    let parsedEmail: ParsedEmail;

    if (contentType.includes("multipart/form-data")) {
      // SendGrid Inbound Parse format
      const formData = await request.formData();
      parsedEmail = await parseSendGridEmail(formData);
    } else if (contentType.includes("application/json")) {
      // Postmark Inbound format
      const data = await request.json();
      parsedEmail = await parsePostmarkEmail(data);
    } else {
      // Assume raw RFC 822 email
      const rawEmail = await request.text();
      parsedEmail = await parseRawEmail(rawEmail);
    }

    // Store the email body as a file for reference
    const emailFileName = `email-${Date.now()}.eml`;
    const emailContent = `From: ${parsedEmail.from}
To: ${parsedEmail.to}
Subject: ${parsedEmail.subject}
Date: ${parsedEmail.receivedAt.toISOString()}

${parsedEmail.body}`;

    const emailBlob = await put(
      `projects/${project.id}/emails/${emailFileName}`,
      emailContent,
      { access: "public", contentType: "message/rfc822" }
    );

    // Create email document record
    const emailDoc = await createEmailDocument({
      projectId: project.id,
      userId: project.userId,
      fileName: parsedEmail.subject || emailFileName,
      filePath: emailBlob.url,
      fileSize: emailContent.length,
      mimeType: "message/rfc822",
      emailFrom: parsedEmail.from,
      emailTo: parsedEmail.to,
      emailSubject: parsedEmail.subject,
      emailBody: parsedEmail.body,
      emailReceivedAt: parsedEmail.receivedAt,
    });

    // Process attachments
    const attachmentDocs = [];
    for (const attachment of parsedEmail.attachments) {
      // Skip tiny files (likely signatures or icons)
      if (attachment.size < 1000) continue;

      // Prioritize financial documents
      const isFinancial = isFinancialDocument(
        attachment.filename,
        attachment.contentType
      );

      // Store attachment in blob storage
      const attachmentBlob = await put(
        `projects/${project.id}/attachments/${Date.now()}-${attachment.filename}`,
        attachment.content,
        { access: "public", contentType: attachment.contentType }
      );

      // Create document record for attachment
      const attachmentDoc = await createEmailDocument({
        projectId: project.id,
        userId: project.userId,
        fileName: attachment.filename,
        filePath: attachmentBlob.url,
        fileSize: attachment.size,
        mimeType: attachment.contentType,
        parentDocumentId: emailDoc.id,
      });

      attachmentDocs.push({
        id: attachmentDoc.id,
        filename: attachment.filename,
        isFinancial,
        size: attachment.size,
      });
    }

    return NextResponse.json({
      success: true,
      emailId: emailDoc.id,
      projectId: project.id,
      subject: parsedEmail.subject,
      from: parsedEmail.from,
      attachmentsProcessed: attachmentDocs.length,
      attachments: attachmentDocs,
    });
  } catch (error) {
    console.error("Email ingestion error:", error);
    return NextResponse.json(
      {
        error: "Failed to process email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint for email ingestion
 * Email services often ping the endpoint to verify it's alive
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const project = await getProjectByIngestToken({ ingestToken: token });
  if (!project) {
    return NextResponse.json({ error: "Invalid ingest token" }, { status: 404 });
  }

  return NextResponse.json({
    status: "ok",
    project: project.name,
    message: "Email ingestion endpoint is ready",
  });
}

/**
 * HEAD request for verification (some email services use this)
 */
export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const project = await getProjectByIngestToken({ ingestToken: token });
  if (!project) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, { status: 200 });
}
