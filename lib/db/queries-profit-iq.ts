import "server-only";

import { and, asc, desc, eq, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { nanoid } from "nanoid";
import { ChatSDKError } from "../errors";
import {
  budgetCategory,
  type BudgetCategoryRecord,
  type BudgetCategory,
  budgetCategoryEnum,
  lineItem,
  type LineItem,
  project,
  type Project,
  projectDocument,
  type ProjectDocument,
  type ProjectStatus,
  type DocumentStatus,
  type ProjectDocumentType,
  promptExecution,
} from "./schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// =============================================================================
// PROJECT QUERIES
// =============================================================================

export async function getProjectsByUserId({
  userId,
}: {
  userId: string;
}): Promise<Project[]> {
  try {
    return await db
      .select()
      .from(project)
      .where(eq(project.userId, userId))
      .orderBy(desc(project.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get projects by user id"
    );
  }
}

export async function getProjectById({
  id,
}: {
  id: string;
}): Promise<Project | null> {
  try {
    const [result] = await db.select().from(project).where(eq(project.id, id));
    return result || null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get project by id");
  }
}

export async function createProject({
  userId,
  name,
  clientName,
  address,
  contractValue,
  startDate,
  endDate,
}: {
  userId: string;
  name: string;
  clientName?: string;
  address?: string;
  contractValue?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Project> {
  try {
    // Generate unique ingest token for email forwarding
    const ingestToken = nanoid(12);

    const [newProject] = await db
      .insert(project)
      .values({
        userId,
        name,
        clientName,
        address,
        contractValue,
        startDate,
        endDate,
        ingestToken,
      })
      .returning();

    // Create default budget categories for the new project
    await db.insert(budgetCategory).values(
      budgetCategoryEnum.map((cat) => ({
        projectId: newProject.id,
        category: cat,
        estimatedAmount: "0",
      }))
    );

    return newProject;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create project");
  }
}

export async function updateProject({
  id,
  name,
  clientName,
  address,
  status,
  contractValue,
  startDate,
  endDate,
}: {
  id: string;
  name?: string;
  clientName?: string;
  address?: string;
  status?: ProjectStatus;
  contractValue?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Project> {
  try {
    const [updated] = await db
      .update(project)
      .set({
        ...(name !== undefined && { name }),
        ...(clientName !== undefined && { clientName }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
        ...(contractValue !== undefined && { contractValue }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        updatedAt: new Date(),
      })
      .where(eq(project.id, id))
      .returning();

    return updated;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update project");
  }
}

export async function deleteProject({ id }: { id: string }): Promise<void> {
  try {
    await db.delete(project).where(eq(project.id, id));
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete project");
  }
}

// =============================================================================
// BUDGET CATEGORY QUERIES
// =============================================================================

export async function getBudgetCategoriesByProjectId({
  projectId,
}: {
  projectId: string;
}): Promise<BudgetCategoryRecord[]> {
  try {
    return await db
      .select()
      .from(budgetCategory)
      .where(eq(budgetCategory.projectId, projectId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get budget categories"
    );
  }
}

export async function updateBudgetCategory({
  projectId,
  category,
  estimatedAmount,
}: {
  projectId: string;
  category: BudgetCategory;
  estimatedAmount: string;
}): Promise<BudgetCategoryRecord> {
  try {
    // Check if category exists
    const [existing] = await db
      .select()
      .from(budgetCategory)
      .where(
        and(
          eq(budgetCategory.projectId, projectId),
          eq(budgetCategory.category, category)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(budgetCategory)
        .set({ estimatedAmount })
        .where(eq(budgetCategory.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(budgetCategory)
        .values({ projectId, category, estimatedAmount })
        .returning();
      return created;
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update budget category"
    );
  }
}

// =============================================================================
// PROJECT DOCUMENT QUERIES
// =============================================================================

export async function getDocumentsByProjectId({
  projectId,
}: {
  projectId: string;
}): Promise<ProjectDocument[]> {
  try {
    return await db
      .select()
      .from(projectDocument)
      .where(eq(projectDocument.projectId, projectId))
      .orderBy(desc(projectDocument.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by project id"
    );
  }
}

export async function getDocumentByIdWithProject({
  id,
}: {
  id: string;
}): Promise<ProjectDocument | null> {
  try {
    const [result] = await db
      .select()
      .from(projectDocument)
      .where(eq(projectDocument.id, id));
    return result || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function createProjectDocument({
  projectId,
  userId,
  fileName,
  filePath,
  fileSize,
  mimeType,
}: {
  projectId: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}): Promise<ProjectDocument> {
  try {
    const [doc] = await db
      .insert(projectDocument)
      .values({
        projectId,
        userId,
        fileName,
        filePath,
        fileSize,
        mimeType,
        status: "pending",
      })
      .returning();

    return doc;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create project document"
    );
  }
}

export async function updateDocumentStatus({
  id,
  status,
  rawExtraction,
  vendorName,
  documentNumber,
  documentDate,
  dueDate,
  totalAmount,
  documentType,
}: {
  id: string;
  status: DocumentStatus;
  rawExtraction?: unknown;
  vendorName?: string;
  documentNumber?: string;
  documentDate?: string;
  dueDate?: string;
  totalAmount?: string;
  documentType?: ProjectDocumentType;
}): Promise<ProjectDocument> {
  try {
    const [updated] = await db
      .update(projectDocument)
      .set({
        status,
        ...(rawExtraction !== undefined && { rawExtraction }),
        ...(vendorName !== undefined && { vendorName }),
        ...(documentNumber !== undefined && { documentNumber }),
        ...(documentDate !== undefined && { documentDate }),
        ...(dueDate !== undefined && { dueDate }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(documentType !== undefined && { documentType }),
        ...(status === "confirmed" && { confirmedAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(eq(projectDocument.id, id))
      .returning();

    return updated;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update document status"
    );
  }
}

export async function deleteProjectDocument({
  id,
}: {
  id: string;
}): Promise<void> {
  try {
    await db.delete(projectDocument).where(eq(projectDocument.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete project document"
    );
  }
}

// =============================================================================
// LINE ITEM QUERIES
// =============================================================================

export async function getLineItemsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<LineItem[]> {
  try {
    return await db
      .select()
      .from(lineItem)
      .where(eq(lineItem.documentId, documentId))
      .orderBy(asc(lineItem.sortOrder));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get line items by document id"
    );
  }
}

export async function getLineItemsByProjectId({
  projectId,
}: {
  projectId: string;
}): Promise<LineItem[]> {
  try {
    return await db
      .select()
      .from(lineItem)
      .where(eq(lineItem.projectId, projectId))
      .orderBy(asc(lineItem.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get line items by project id"
    );
  }
}

export async function createLineItems({
  items,
}: {
  items: Array<{
    documentId: string;
    projectId: string;
    description: string;
    quantity?: string;
    unit?: string;
    unitPrice?: string;
    total: string;
    category?: BudgetCategory;
    costCode?: string;
    sortOrder?: number;
  }>;
}): Promise<LineItem[]> {
  try {
    if (items.length === 0) return [];

    return await db
      .insert(lineItem)
      .values(
        items.map((item) => ({
          documentId: item.documentId,
          projectId: item.projectId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          category: item.category,
          costCode: item.costCode,
          sortOrder: item.sortOrder,
        }))
      )
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create line items");
  }
}

export async function updateLineItem({
  id,
  description,
  quantity,
  unit,
  unitPrice,
  total,
  category,
  costCode,
}: {
  id: string;
  description?: string;
  quantity?: string;
  unit?: string;
  unitPrice?: string;
  total?: string;
  category?: BudgetCategory;
  costCode?: string;
}): Promise<LineItem> {
  try {
    const [updated] = await db
      .update(lineItem)
      .set({
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(total !== undefined && { total }),
        ...(category !== undefined && { category }),
        ...(costCode !== undefined && { costCode }),
      })
      .where(eq(lineItem.id, id))
      .returning();

    return updated;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update line item");
  }
}

export async function deleteLineItemsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<void> {
  try {
    await db.delete(lineItem).where(eq(lineItem.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete line items"
    );
  }
}

// =============================================================================
// BUDGET SUMMARY QUERIES
// =============================================================================

export interface BudgetSummaryItem {
  category: BudgetCategory;
  estimatedAmount: number;
  actualAmount: number;
  variance: number;
}

export async function getProjectBudgetSummary({
  projectId,
}: {
  projectId: string;
}): Promise<BudgetSummaryItem[]> {
  try {
    // Get budget categories
    const categories = await db
      .select()
      .from(budgetCategory)
      .where(eq(budgetCategory.projectId, projectId));

    // Get actual amounts by category from confirmed documents only
    const actualAmounts = await db
      .select({
        category: lineItem.category,
        total: sum(lineItem.total),
      })
      .from(lineItem)
      .innerJoin(
        projectDocument,
        eq(lineItem.documentId, projectDocument.id)
      )
      .where(
        and(
          eq(lineItem.projectId, projectId),
          eq(projectDocument.status, "confirmed")
        )
      )
      .groupBy(lineItem.category);

    const actualsByCategory = new Map(
      actualAmounts.map((a) => [a.category, parseFloat(a.total || "0")])
    );

    return categories.map((cat) => {
      const estimated = parseFloat(cat.estimatedAmount || "0");
      const actual = actualsByCategory.get(cat.category) || 0;
      return {
        category: cat.category as BudgetCategory,
        estimatedAmount: estimated,
        actualAmount: actual,
        variance: estimated - actual,
      };
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get project budget summary"
    );
  }
}

export async function getProjectTotals({
  projectId,
}: {
  projectId: string;
}): Promise<{
  contractValue: number;
  totalEstimated: number;
  totalActual: number;
  marginAmount: number;
  marginPercent: number;
}> {
  try {
    const proj = await getProjectById({ id: projectId });
    const summary = await getProjectBudgetSummary({ projectId });

    const contractValue = parseFloat(proj?.contractValue || "0");
    const totalEstimated = summary.reduce((sum, s) => sum + s.estimatedAmount, 0);
    const totalActual = summary.reduce((sum, s) => sum + s.actualAmount, 0);
    const marginAmount = contractValue - totalActual;
    const marginPercent = contractValue > 0 ? (marginAmount / contractValue) * 100 : 0;

    return {
      contractValue,
      totalEstimated,
      totalActual,
      marginAmount,
      marginPercent,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get project totals"
    );
  }
}

// =============================================================================
// PROMPT EXECUTION QUERIES
// =============================================================================

export async function createPromptExecution({
  promptId,
  projectId,
  documentId,
  inputTokens,
  outputTokens,
  latencyMs,
  rawResponse,
  parsedResponse,
  metadata,
}: {
  promptId: string;
  projectId?: string;
  documentId?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  rawResponse?: string;
  parsedResponse?: unknown;
  metadata?: unknown;
}): Promise<void> {
  try {
    await db.insert(promptExecution).values({
      promptId,
      projectId,
      documentId,
      inputTokens,
      outputTokens,
      latencyMs,
      rawResponse,
      parsedResponse,
      metadata,
    });
  } catch (_error) {
    console.error("Failed to log prompt execution:", _error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// =============================================================================
// EMAIL INGESTION QUERIES
// =============================================================================

export async function getProjectByIngestToken({
  ingestToken,
}: {
  ingestToken: string;
}): Promise<Project | null> {
  try {
    const [result] = await db
      .select()
      .from(project)
      .where(eq(project.ingestToken, ingestToken));
    return result || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get project by ingest token"
    );
  }
}

export async function createEmailDocument({
  projectId,
  userId,
  fileName,
  filePath,
  fileSize,
  mimeType,
  emailFrom,
  emailTo,
  emailSubject,
  emailBody,
  emailReceivedAt,
  parentDocumentId,
}: {
  projectId: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  emailFrom?: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  emailReceivedAt?: Date;
  parentDocumentId?: string;
}): Promise<ProjectDocument> {
  try {
    const [doc] = await db
      .insert(projectDocument)
      .values({
        projectId,
        userId,
        fileName,
        filePath,
        fileSize,
        mimeType,
        documentType: parentDocumentId ? undefined : "email", // Attachments get their own type
        status: "pending",
        emailFrom,
        emailTo,
        emailSubject,
        emailBody,
        emailReceivedAt,
        parentDocumentId,
      })
      .returning();

    return doc;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create email document"
    );
  }
}

export async function getEmailDocumentsByProjectId({
  projectId,
}: {
  projectId: string;
}): Promise<ProjectDocument[]> {
  try {
    return await db
      .select()
      .from(projectDocument)
      .where(
        and(
          eq(projectDocument.projectId, projectId),
          eq(projectDocument.documentType, "email")
        )
      )
      .orderBy(desc(projectDocument.emailReceivedAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get email documents by project id"
    );
  }
}

export async function getAttachmentsByParentDocumentId({
  parentDocumentId,
}: {
  parentDocumentId: string;
}): Promise<ProjectDocument[]> {
  try {
    return await db
      .select()
      .from(projectDocument)
      .where(eq(projectDocument.parentDocumentId, parentDocumentId))
      .orderBy(asc(projectDocument.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get attachments by parent document id"
    );
  }
}
