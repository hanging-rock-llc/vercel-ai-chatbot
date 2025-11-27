/**
 * Email parsing utilities for Profit IQ
 *
 * Handles parsing of inbound emails from various email services:
 * - SendGrid Inbound Parse
 * - Postmark Inbound
 * - Generic RFC 822 format
 */

import { simpleParser, type ParsedMail, type Attachment } from "mailparser";

export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  receivedAt: Date;
  attachments: ParsedAttachment[];
  headers: Record<string, string>;
}

export interface ParsedAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

/**
 * Parse email from SendGrid Inbound Parse webhook
 * SendGrid sends multipart/form-data with fields like:
 * - from, to, subject, text, html, attachments, etc.
 */
export async function parseSendGridEmail(
  formData: FormData
): Promise<ParsedEmail> {
  const from = formData.get("from") as string;
  const to = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const text = formData.get("text") as string;
  const html = formData.get("html") as string;

  // Parse attachments - SendGrid sends attachment info as JSON
  const attachmentInfoStr = formData.get("attachment-info") as string;
  const attachments: ParsedAttachment[] = [];

  if (attachmentInfoStr) {
    try {
      const attachmentInfo = JSON.parse(attachmentInfoStr);
      for (const [key, info] of Object.entries(attachmentInfo)) {
        const file = formData.get(key) as File;
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          attachments.push({
            filename: (info as { filename: string }).filename || file.name,
            contentType:
              (info as { type: string }).type || file.type || "application/octet-stream",
            size: buffer.length,
            content: buffer,
          });
        }
      }
    } catch (_e) {
      console.error("Failed to parse SendGrid attachment info");
    }
  }

  // Also check for numbered attachments (attachment1, attachment2, etc.)
  for (let i = 1; i <= 10; i++) {
    const file = formData.get(`attachment${i}`) as File;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: buffer.length,
        content: buffer,
      });
    }
  }

  return {
    from: from || "",
    to: to || "",
    subject: subject || "(No Subject)",
    body: text || "",
    htmlBody: html || undefined,
    receivedAt: new Date(),
    attachments,
    headers: {},
  };
}

/**
 * Parse email from Postmark Inbound webhook
 * Postmark sends JSON with structured email data
 */
export async function parsePostmarkEmail(data: {
  FromFull?: { Email: string; Name: string };
  From?: string;
  ToFull?: Array<{ Email: string; Name: string }>;
  To?: string;
  Subject?: string;
  TextBody?: string;
  HtmlBody?: string;
  Date?: string;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentLength: number;
  }>;
  Headers?: Array<{ Name: string; Value: string }>;
}): Promise<ParsedEmail> {
  const from = data.FromFull?.Email || data.From || "";
  const to = data.ToFull?.[0]?.Email || data.To || "";
  const subject = data.Subject || "(No Subject)";
  const body = data.TextBody || "";
  const htmlBody = data.HtmlBody;

  const attachments: ParsedAttachment[] = (data.Attachments || []).map(
    (att) => ({
      filename: att.Name,
      contentType: att.ContentType,
      size: att.ContentLength,
      content: Buffer.from(att.Content, "base64"),
    })
  );

  const headers: Record<string, string> = {};
  for (const header of data.Headers || []) {
    headers[header.Name] = header.Value;
  }

  return {
    from,
    to,
    subject,
    body,
    htmlBody,
    receivedAt: data.Date ? new Date(data.Date) : new Date(),
    attachments,
    headers,
  };
}

/**
 * Parse raw RFC 822 email format
 * Used for generic email forwarding or when raw email is available
 */
export async function parseRawEmail(rawEmail: string): Promise<ParsedEmail> {
  const parsed: ParsedMail = await simpleParser(rawEmail);

  const attachments: ParsedAttachment[] = (parsed.attachments || []).map(
    (att: Attachment) => ({
      filename: att.filename || "attachment",
      contentType: att.contentType,
      size: att.size,
      content: att.content,
    })
  );

  const headers: Record<string, string> = {};
  if (parsed.headers) {
    for (const [key, value] of parsed.headers) {
      if (typeof value === "string") {
        headers[key] = value;
      }
    }
  }

  // Extract email address from parsed 'from' field
  let fromEmail = "";
  if (parsed.from?.value && Array.isArray(parsed.from.value)) {
    fromEmail = parsed.from.value[0]?.address || "";
  }

  let toEmail = "";
  if (parsed.to) {
    const toValue = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to;
    if (toValue?.value && Array.isArray(toValue.value)) {
      toEmail = toValue.value[0]?.address || "";
    }
  }

  return {
    from: fromEmail,
    to: toEmail,
    subject: parsed.subject || "(No Subject)",
    body: parsed.text || "",
    htmlBody: parsed.html || undefined,
    receivedAt: parsed.date || new Date(),
    attachments,
    headers,
  };
}

/**
 * Extract relevant financial information from email body
 * Returns key phrases and amounts found in the email
 */
export function extractFinancialContext(body: string): {
  amounts: Array<{ value: number; context: string }>;
  dates: string[];
  references: string[];
} {
  const amounts: Array<{ value: number; context: string }> = [];
  const dates: string[] = [];
  const references: string[] = [];

  // Find currency amounts (e.g., $1,234.56, USD 1234.56)
  const amountRegex =
    /\$[\d,]+\.?\d*|\b(?:USD|CAD|EUR)\s*[\d,]+\.?\d*/gi;
  let match;
  while ((match = amountRegex.exec(body)) !== null) {
    const valueStr = match[0].replace(/[^\d.]/g, "");
    const value = parseFloat(valueStr);
    if (!isNaN(value) && value > 0) {
      // Get surrounding context (50 chars before and after)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(body.length, match.index + match[0].length + 50);
      const context = body.substring(start, end).trim();
      amounts.push({ value, context });
    }
  }

  // Find dates (various formats)
  const dateRegex =
    /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/gi;
  while ((match = dateRegex.exec(body)) !== null) {
    dates.push(match[0]);
  }

  // Find invoice/quote/PO references
  const refRegex =
    /\b(?:Invoice|INV|Quote|QT|PO|Purchase Order|Estimate|EST)[#:\s]*[\w\-]+/gi;
  while ((match = refRegex.exec(body)) !== null) {
    references.push(match[0]);
  }

  return { amounts, dates, references };
}

/**
 * Determine if an attachment is likely a financial document
 */
export function isFinancialDocument(
  filename: string,
  contentType: string
): boolean {
  const financialExtensions = [".pdf", ".xlsx", ".xls", ".csv", ".doc", ".docx"];
  const financialKeywords = [
    "invoice",
    "quote",
    "estimate",
    "receipt",
    "bill",
    "statement",
    "po",
    "purchase",
    "order",
  ];

  const lowerFilename = filename.toLowerCase();

  // Check extension
  const hasFinancialExt = financialExtensions.some((ext) =>
    lowerFilename.endsWith(ext)
  );

  // Check if filename contains financial keywords
  const hasFinancialKeyword = financialKeywords.some((keyword) =>
    lowerFilename.includes(keyword)
  );

  // PDF and spreadsheets are commonly financial documents
  const isCommonDocType =
    contentType.includes("pdf") ||
    contentType.includes("spreadsheet") ||
    contentType.includes("excel");

  return hasFinancialExt || hasFinancialKeyword || isCommonDocType;
}
