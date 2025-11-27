import { z } from "zod";

export const budgetCategorySchema = z.enum([
  "Labor",
  "Materials",
  "Equipment",
  "Subcontractors",
  "Other",
]);

export const documentTypeSchema = z.enum([
  "invoice",
  "quote",
  "estimate",
  "change_order",
  "receipt",
  "other",
]);

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unit_price: z.number().optional(),
  total: z.number(),
  category: budgetCategorySchema,
});

export const vendorSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const documentInfoSchema = z.object({
  number: z.string().optional(),
  date: z.string(), // YYYY-MM-DD format
  due_date: z.string().optional(),
  po_number: z.string().optional(),
  valid_until: z.string().optional(),
  project_reference: z.string().optional(),
});

export const totalsSchema = z.object({
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number(),
  contingency: z.number().optional(),
});

export const extractionResultSchema = z.object({
  document_type: documentTypeSchema,
  confidence: z.number().min(0).max(1),
  vendor: vendorSchema,
  document_info: documentInfoSchema,
  line_items: z.array(lineItemSchema),
  totals: totalsSchema,
  notes: z.string().optional(),
});

export type BudgetCategory = z.infer<typeof budgetCategorySchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type Vendor = z.infer<typeof vendorSchema>;
export type DocumentInfo = z.infer<typeof documentInfoSchema>;
export type Totals = z.infer<typeof totalsSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

// Email extraction schemas
export const emailSenderInfoSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  is_vendor: z.boolean().default(false),
});

export const emailAmountSchema = z.object({
  value: z.number(),
  context: z.string(),
  category: budgetCategorySchema.nullable().optional(),
  is_quote: z.boolean().default(false),
  is_invoice: z.boolean().default(false),
  is_payment: z.boolean().default(false),
});

export const emailDateSchema = z.object({
  date: z.string(),
  context: z.string(),
});

export const emailDocumentReferenceSchema = z.object({
  type: z.enum(["invoice", "quote", "contract", "change_order", "other"]),
  number: z.string().optional(),
  description: z.string().optional(),
});

export const emailActionItemSchema = z.object({
  action: z.string(),
  deadline: z.string().nullable().optional(),
  financial_impact: z.boolean().default(false),
});

export const emailExtractionResultSchema = z.object({
  summary: z.string(),
  has_financial_content: z.boolean(),
  sender_info: emailSenderInfoSchema.optional(),
  amounts_mentioned: z.array(emailAmountSchema).default([]),
  dates_mentioned: z.array(emailDateSchema).default([]),
  document_references: z.array(emailDocumentReferenceSchema).default([]),
  action_items: z.array(emailActionItemSchema).default([]),
  project_mentions: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type EmailSenderInfo = z.infer<typeof emailSenderInfoSchema>;
export type EmailAmount = z.infer<typeof emailAmountSchema>;
export type EmailDate = z.infer<typeof emailDateSchema>;
export type EmailDocumentReference = z.infer<typeof emailDocumentReferenceSchema>;
export type EmailActionItem = z.infer<typeof emailActionItemSchema>;
export type EmailExtractionResult = z.infer<typeof emailExtractionResultSchema>;
