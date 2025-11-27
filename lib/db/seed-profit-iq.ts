import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import {
  user,
  project,
  budgetCategory,
  projectDocument,
  lineItem,
  budgetCategoryEnum,
} from "./schema";

// Run with: npx tsx lib/db/seed-profit-iq.ts

async function seed() {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  console.log("Starting Profit IQ seed...");

  // Find or create a demo user
  let demoUser = await db
    .select()
    .from(user)
    .where(eq(user.email, "demo@profitiq.app"))
    .then((rows) => rows[0]);

  if (!demoUser) {
    console.log("Creating demo user...");
    const [newUser] = await db
      .insert(user)
      .values({
        email: "demo@profitiq.app",
        password: null, // Demo user, no password
      })
      .returning();
    demoUser = newUser;
  }

  console.log(`Using user: ${demoUser.email} (${demoUser.id})`);

  // Create sample project: Highland Park Renovation
  console.log("Creating sample project...");
  const [sampleProject] = await db
    .insert(project)
    .values({
      userId: demoUser.id,
      name: "Highland Park Renovation",
      clientName: "Smith Family",
      address: "1234 Highland Ave, Austin, TX 78702",
      status: "active",
      contractValue: "185000.00",
      startDate: "2024-10-15",
      endDate: "2025-02-28",
    })
    .returning();

  console.log(`Created project: ${sampleProject.name} (${sampleProject.id})`);

  // Create budget categories with estimates
  console.log("Creating budget categories...");
  const budgetEstimates: Record<string, string> = {
    Labor: "45000.00",
    Materials: "65000.00",
    Equipment: "8000.00",
    Subcontractors: "55000.00",
    Other: "5000.00",
  };

  for (const category of budgetCategoryEnum) {
    await db.insert(budgetCategory).values({
      projectId: sampleProject.id,
      category,
      estimatedAmount: budgetEstimates[category],
    });
  }

  // Create sample confirmed documents with line items
  console.log("Creating sample documents...");

  // Invoice 1: ABC Electric
  const [doc1] = await db
    .insert(projectDocument)
    .values({
      projectId: sampleProject.id,
      userId: demoUser.id,
      fileName: "ABC-Electric-Invoice-1042.pdf",
      filePath: "https://example.com/placeholder.pdf",
      fileSize: 245000,
      mimeType: "application/pdf",
      documentType: "invoice",
      status: "confirmed",
      vendorName: "ABC Electric",
      documentNumber: "INV-1042",
      documentDate: "2024-11-15",
      dueDate: "2024-12-15",
      totalAmount: "18500.00",
      confirmedAt: new Date(),
    })
    .returning();

  await db.insert(lineItem).values([
    {
      documentId: doc1.id,
      projectId: sampleProject.id,
      description: "Electrical rough-in - main panel upgrade",
      quantity: "1",
      unit: "job",
      unitPrice: "8500.00",
      total: "8500.00",
      category: "Subcontractors",
      sortOrder: 0,
    },
    {
      documentId: doc1.id,
      projectId: sampleProject.id,
      description: "Electrical materials - wire, boxes, breakers",
      quantity: "1",
      unit: "lot",
      unitPrice: "4200.00",
      total: "4200.00",
      category: "Materials",
      sortOrder: 1,
    },
    {
      documentId: doc1.id,
      projectId: sampleProject.id,
      description: "Light fixtures installation",
      quantity: "24",
      unit: "hr",
      unitPrice: "85.00",
      total: "2040.00",
      category: "Labor",
      sortOrder: 2,
    },
    {
      documentId: doc1.id,
      projectId: sampleProject.id,
      description: "Recessed lighting fixtures",
      quantity: "12",
      unit: "each",
      unitPrice: "145.00",
      total: "1740.00",
      category: "Materials",
      sortOrder: 3,
    },
    {
      documentId: doc1.id,
      projectId: sampleProject.id,
      description: "Permit fees",
      quantity: "1",
      unit: "each",
      unitPrice: "2020.00",
      total: "2020.00",
      category: "Other",
      sortOrder: 4,
    },
  ]);

  // Invoice 2: Home Depot Materials
  const [doc2] = await db
    .insert(projectDocument)
    .values({
      projectId: sampleProject.id,
      userId: demoUser.id,
      fileName: "HomeDepot-Receipt-Nov.pdf",
      filePath: "https://example.com/placeholder.pdf",
      fileSize: 180000,
      mimeType: "application/pdf",
      documentType: "receipt",
      status: "confirmed",
      vendorName: "Home Depot",
      documentNumber: "HD-2024-892341",
      documentDate: "2024-11-10",
      totalAmount: "8450.75",
      confirmedAt: new Date(),
    })
    .returning();

  await db.insert(lineItem).values([
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "2x4 Lumber (8ft)",
      quantity: "120",
      unit: "each",
      unitPrice: "5.25",
      total: "630.00",
      category: "Materials",
      sortOrder: 0,
    },
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "Drywall sheets 4x8",
      quantity: "85",
      unit: "each",
      unitPrice: "18.50",
      total: "1572.50",
      category: "Materials",
      sortOrder: 1,
    },
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "Insulation batts R-19",
      quantity: "24",
      unit: "pack",
      unitPrice: "42.00",
      total: "1008.00",
      category: "Materials",
      sortOrder: 2,
    },
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "Screws, nails, fasteners",
      quantity: "1",
      unit: "lot",
      unitPrice: "845.25",
      total: "845.25",
      category: "Materials",
      sortOrder: 3,
    },
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "Paint and primer",
      quantity: "15",
      unit: "gal",
      unitPrice: "52.00",
      total: "780.00",
      category: "Materials",
      sortOrder: 4,
    },
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "Plumbing supplies",
      quantity: "1",
      unit: "lot",
      unitPrice: "1250.00",
      total: "1250.00",
      category: "Materials",
      sortOrder: 5,
    },
    {
      documentId: doc2.id,
      projectId: sampleProject.id,
      description: "Flooring underlayment",
      quantity: "650",
      unit: "sqft",
      unitPrice: "3.64",
      total: "2365.00",
      category: "Materials",
      sortOrder: 6,
    },
  ]);

  // Invoice 3: Rivera Plumbing
  const [doc3] = await db
    .insert(projectDocument)
    .values({
      projectId: sampleProject.id,
      userId: demoUser.id,
      fileName: "Rivera-Plumbing-Invoice-2024-112.pdf",
      filePath: "https://example.com/placeholder.pdf",
      fileSize: 156000,
      mimeType: "application/pdf",
      documentType: "invoice",
      status: "confirmed",
      vendorName: "Rivera Plumbing",
      documentNumber: "RP-2024-112",
      documentDate: "2024-11-18",
      dueDate: "2024-12-18",
      totalAmount: "12750.00",
      confirmedAt: new Date(),
    })
    .returning();

  await db.insert(lineItem).values([
    {
      documentId: doc3.id,
      projectId: sampleProject.id,
      description: "Bathroom rough-in - master bath",
      quantity: "1",
      unit: "job",
      unitPrice: "4500.00",
      total: "4500.00",
      category: "Subcontractors",
      sortOrder: 0,
    },
    {
      documentId: doc3.id,
      projectId: sampleProject.id,
      description: "Kitchen sink and disposal install",
      quantity: "1",
      unit: "job",
      unitPrice: "1850.00",
      total: "1850.00",
      category: "Subcontractors",
      sortOrder: 1,
    },
    {
      documentId: doc3.id,
      projectId: sampleProject.id,
      description: "Water heater replacement (50 gal)",
      quantity: "1",
      unit: "each",
      unitPrice: "4200.00",
      total: "4200.00",
      category: "Subcontractors",
      sortOrder: 2,
    },
    {
      documentId: doc3.id,
      projectId: sampleProject.id,
      description: "Gas line extension",
      quantity: "1",
      unit: "job",
      unitPrice: "2200.00",
      total: "2200.00",
      category: "Subcontractors",
      sortOrder: 3,
    },
  ]);

  // Invoice 4: Labor - Johnson Crew
  const [doc4] = await db
    .insert(projectDocument)
    .values({
      projectId: sampleProject.id,
      userId: demoUser.id,
      fileName: "Johnson-Crew-Week-46.pdf",
      filePath: "https://example.com/placeholder.pdf",
      fileSize: 98000,
      mimeType: "application/pdf",
      documentType: "invoice",
      status: "confirmed",
      vendorName: "Johnson Construction Crew",
      documentNumber: "JCC-2024-W46",
      documentDate: "2024-11-22",
      totalAmount: "9840.00",
      confirmedAt: new Date(),
    })
    .returning();

  await db.insert(lineItem).values([
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "Framing labor - week 46",
      quantity: "96",
      unit: "hr",
      unitPrice: "55.00",
      total: "5280.00",
      category: "Labor",
      sortOrder: 0,
    },
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "Drywall hanging and mudding",
      quantity: "48",
      unit: "hr",
      unitPrice: "52.00",
      total: "2496.00",
      category: "Labor",
      sortOrder: 1,
    },
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "General cleanup and debris removal",
      quantity: "16",
      unit: "hr",
      unitPrice: "35.00",
      total: "560.00",
      category: "Labor",
      sortOrder: 2,
    },
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "Equipment rental - scaffolding",
      quantity: "1",
      unit: "week",
      unitPrice: "450.00",
      total: "450.00",
      category: "Equipment",
      sortOrder: 3,
    },
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "Dumpster rental",
      quantity: "1",
      unit: "week",
      unitPrice: "425.00",
      total: "425.00",
      category: "Equipment",
      sortOrder: 4,
    },
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "Tool rental - framing nailer",
      quantity: "5",
      unit: "day",
      unitPrice: "65.80",
      total: "329.00",
      category: "Equipment",
      sortOrder: 5,
    },
    {
      documentId: doc4.id,
      projectId: sampleProject.id,
      description: "Porta-potty service",
      quantity: "1",
      unit: "month",
      unitPrice: "300.00",
      total: "300.00",
      category: "Other",
      sortOrder: 6,
    },
  ]);

  // Create a pending document (not yet extracted)
  await db.insert(projectDocument).values({
    projectId: sampleProject.id,
    userId: demoUser.id,
    fileName: "HVAC-Quote-Thompson.pdf",
    filePath: "https://example.com/placeholder.pdf",
    fileSize: 210000,
    mimeType: "application/pdf",
    status: "pending",
  });

  console.log("Seed completed successfully!");
  console.log("\nSummary:");
  console.log(`- Project: ${sampleProject.name}`);
  console.log(`- Contract Value: $185,000`);
  console.log(`- Documents created: 5 (4 confirmed, 1 pending)`);
  console.log(`- Budget estimates set for all 5 categories`);
  console.log(`\nYou can log in with: demo@profitiq.app`);

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
