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
