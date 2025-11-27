import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  integer,
  json,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

// =============================================================================
// PROFIT IQ SCHEMA - Construction Project Profitability Tracking
// =============================================================================

// Project status enum values
export const projectStatusEnum = ["active", "completed", "on_hold"] as const;
export type ProjectStatus = (typeof projectStatusEnum)[number];

// Budget category enum values
export const budgetCategoryEnum = [
  "Labor",
  "Materials",
  "Equipment",
  "Subcontractors",
  "Other",
] as const;
export type BudgetCategory = (typeof budgetCategoryEnum)[number];

// Document type enum values
export const documentTypeEnum = [
  "invoice",
  "quote",
  "estimate",
  "change_order",
  "receipt",
  "other",
] as const;
export type ProjectDocumentType = (typeof documentTypeEnum)[number];

// Document status enum values
export const documentStatusEnum = [
  "pending",
  "processing",
  "extracted",
  "confirmed",
  "rejected",
  "failed",
] as const;
export type DocumentStatus = (typeof documentStatusEnum)[number];

// Projects table
export const project = pgTable("Project", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  clientName: text("clientName"),
  address: text("address"),
  status: varchar("status", { enum: projectStatusEnum })
    .notNull()
    .default("active"),
  contractValue: numeric("contractValue", { precision: 12, scale: 2 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Project = InferSelectModel<typeof project>;

// Budget Categories (per project)
export const budgetCategory = pgTable(
  "BudgetCategory",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    projectId: uuid("projectId")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    category: varchar("category", { enum: budgetCategoryEnum }).notNull(),
    estimatedAmount: numeric("estimatedAmount", {
      precision: 12,
      scale: 2,
    }).default("0"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  }
);

export type BudgetCategoryRecord = InferSelectModel<typeof budgetCategory>;

// Project Documents (invoices, quotes, estimates)
export const projectDocument = pgTable("ProjectDocument", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),

  // File info
  fileName: text("fileName").notNull(),
  filePath: text("filePath").notNull(),
  fileSize: integer("fileSize"),
  mimeType: text("mimeType"),

  // Classification
  documentType: varchar("documentType", { enum: documentTypeEnum }),

  // Extraction status
  status: varchar("status", { enum: documentStatusEnum })
    .notNull()
    .default("pending"),
  rawExtraction: jsonb("rawExtraction"),

  // Vendor info (denormalized for quick access)
  vendorName: text("vendorName"),
  documentNumber: text("documentNumber"),
  documentDate: date("documentDate"),
  dueDate: date("dueDate"),
  totalAmount: numeric("totalAmount", { precision: 12, scale: 2 }),

  // Tracking
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type ProjectDocument = InferSelectModel<typeof projectDocument>;

// Line Items (extracted from documents)
export const lineItem = pgTable("LineItem", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  documentId: uuid("documentId")
    .notNull()
    .references(() => projectDocument.id, { onDelete: "cascade" }),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),

  // Item details
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2 }),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),

  // Categorization
  category: varchar("category", { enum: budgetCategoryEnum }),
  costCode: text("costCode"),

  // Metadata
  sortOrder: integer("sortOrder"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type LineItem = InferSelectModel<typeof lineItem>;

// Prompt Executions (for tracking AI usage and iteration)
export const promptExecution = pgTable("PromptExecution", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  promptId: text("promptId").notNull(),
  projectId: uuid("projectId").references(() => project.id, {
    onDelete: "set null",
  }),
  documentId: uuid("documentId").references(() => projectDocument.id, {
    onDelete: "set null",
  }),

  // Metrics
  inputTokens: integer("inputTokens"),
  outputTokens: integer("outputTokens"),
  latencyMs: integer("latencyMs"),

  // Response
  rawResponse: text("rawResponse"),
  parsedResponse: jsonb("parsedResponse"),

  // Provider tracking
  metadata: jsonb("metadata").default({}),

  // Quality
  extractionAccuracy: numeric("extractionAccuracy", { precision: 5, scale: 2 }),
  humanRating: integer("humanRating"),
  humanFeedback: text("humanFeedback"),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type PromptExecution = InferSelectModel<typeof promptExecution>;
