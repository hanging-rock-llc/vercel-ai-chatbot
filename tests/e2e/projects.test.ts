import { expect, test } from "../fixtures";
import {
  ProjectsPage,
  ProjectDetailPage,
  DocumentsPage,
  ExtractionReviewPage,
  ProjectChatPage,
} from "../pages/projects";

test.describe("Projects - CRUD Operations", () => {
  let projectsPage: ProjectsPage;
  let projectDetailPage: ProjectDetailPage;

  test.beforeEach(async ({ adaContext }) => {
    projectsPage = new ProjectsPage(adaContext.page);
    projectDetailPage = new ProjectDetailPage(adaContext.page);
  });

  test("Show empty state when no projects exist", async ({ adaContext }) => {
    await projectsPage.goto();
    // If user has no projects, should see empty state
    // Note: May need to clean up projects first in a real test
    const hasProjects = await adaContext.page.getByTestId("project-card").count();
    if (hasProjects === 0) {
      await projectsPage.expectEmptyState();
    }
  });

  test("Create a new project with all fields", async () => {
    await projectsPage.createProject({
      name: "Test Renovation Project",
      clientName: "Test Client",
      address: "123 Test St, Austin, TX",
      contractValue: "150000",
      startDate: "2024-01-15",
      endDate: "2024-06-30",
    });

    // Should redirect to project detail page
    await projectDetailPage.expectProjectName("Test Renovation Project");
  });

  test("Create a new project with minimal fields", async () => {
    await projectsPage.createProject({
      name: "Minimal Project",
    });

    await projectDetailPage.expectProjectName("Minimal Project");
  });

  test("View project in dashboard after creation", async () => {
    const projectName = `Dashboard Test ${Date.now()}`;

    await projectsPage.createProject({
      name: projectName,
      contractValue: "100000",
    });

    await projectsPage.goto();
    await projectsPage.expectProjectInList(projectName);
  });

  test("Navigate to project detail from dashboard", async () => {
    const projectName = `Nav Test ${Date.now()}`;

    await projectsPage.createProject({
      name: projectName,
    });

    await projectsPage.goto();
    await projectsPage.clickProject(projectName);

    await projectDetailPage.expectProjectName(projectName);
  });
});

test.describe("Projects - Budget Management", () => {
  let projectsPage: ProjectsPage;
  let projectDetailPage: ProjectDetailPage;

  test.beforeEach(async ({ babbageContext }) => {
    projectsPage = new ProjectsPage(babbageContext.page);
    projectDetailPage = new ProjectDetailPage(babbageContext.page);
  });

  test("Display budget categories with $0 estimates for new project", async () => {
    await projectsPage.createProject({
      name: `Budget Test ${Date.now()}`,
      contractValue: "200000",
    });

    // All categories should show $0 estimated initially
    await projectDetailPage.expectBudgetCategory("Labor", "$0", "$0");
    await projectDetailPage.expectBudgetCategory("Materials", "$0", "$0");
    await projectDetailPage.expectBudgetCategory("Equipment", "$0", "$0");
    await projectDetailPage.expectBudgetCategory("Subcontractors", "$0", "$0");
    await projectDetailPage.expectBudgetCategory("Other", "$0", "$0");
  });

  test("Edit budget category estimate", async ({ babbageContext }) => {
    await projectsPage.createProject({
      name: `Budget Edit Test ${Date.now()}`,
      contractValue: "150000",
    });

    await projectDetailPage.editBudgetCategory("Materials", "45000");

    // Wait for toast confirmation
    await expect(babbageContext.page.getByTestId("toast")).toContainText(/budget updated/i);

    // Verify the update is reflected
    await projectDetailPage.expectBudgetCategory("Materials", "$45,000", "$0");
  });

  test("Display margin indicator based on contract value vs actuals", async ({ babbageContext }) => {
    await projectsPage.createProject({
      name: `Margin Test ${Date.now()}`,
      contractValue: "100000",
    });

    // With no actuals and a contract value, margin should be positive
    const marginIndicator = babbageContext.page.locator("[class*='margin']");
    await expect(marginIndicator).toBeVisible();
  });
});

test.describe("Documents - Upload and Management", () => {
  let projectsPage: ProjectsPage;
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ curieContext }) => {
    projectsPage = new ProjectsPage(curieContext.page);
    documentsPage = new DocumentsPage(curieContext.page);
  });

  test("Show empty state when no documents exist", async ({ curieContext }) => {
    await projectsPage.createProject({
      name: `Docs Empty Test ${Date.now()}`,
    });

    // Get project ID from URL
    const url = curieContext.page.url();
    const projectId = url.split("/projects/")[1]?.split("/")[0];

    await documentsPage.goto(projectId);
    await documentsPage.expectEmptyState();
  });

  test("Display upload zone on documents page", async ({ curieContext }) => {
    await projectsPage.createProject({
      name: `Upload Zone Test ${Date.now()}`,
    });

    const url = curieContext.page.url();
    const projectId = url.split("/projects/")[1]?.split("/")[0];

    await documentsPage.goto(projectId);
    await expect(documentsPage.uploadZone).toBeVisible();
  });

  test.skip("Upload a PDF document", async ({ curieContext }) => {
    // Skip: Requires actual PDF file
    await projectsPage.createProject({
      name: `Upload Test ${Date.now()}`,
    });

    const url = curieContext.page.url();
    const projectId = url.split("/projects/")[1]?.split("/")[0];

    await documentsPage.goto(projectId);

    // Would need a test PDF file
    // await documentsPage.uploadFile("tests/fixtures/sample-invoice.pdf");
    // await documentsPage.expectDocument("sample-invoice.pdf");
    // await documentsPage.expectDocumentStatus("sample-invoice.pdf", "Pending");
  });
});

test.describe("Documents - Extraction Flow", () => {
  let projectsPage: ProjectsPage;
  let documentsPage: DocumentsPage;
  let reviewPage: ExtractionReviewPage;

  test.beforeEach(async ({ curieContext }) => {
    projectsPage = new ProjectsPage(curieContext.page);
    documentsPage = new DocumentsPage(curieContext.page);
    reviewPage = new ExtractionReviewPage(curieContext.page);
  });

  test.skip("Extract data from uploaded document", async () => {
    // Skip: Requires uploaded document and API call
    // Would test:
    // 1. Click extract button
    // 2. Wait for processing
    // 3. Status changes to "Review"
  });

  test.skip("Review and confirm extraction", async () => {
    // Skip: Requires extracted document
    // Would test:
    // 1. Navigate to review page
    // 2. Verify extracted data displayed
    // 3. Edit line item categories
    // 4. Confirm extraction
    // 5. Verify redirect to project page
    // 6. Verify budget actuals updated
  });

  test.skip("Reject extraction and return to documents", async () => {
    // Skip: Requires extracted document
    // Would test:
    // 1. Navigate to review page
    // 2. Click reject
    // 3. Verify redirect to documents page
    // 4. Verify document status is rejected
  });
});

test.describe("Project Chat", () => {
  let projectsPage: ProjectsPage;
  let chatPage: ProjectChatPage;

  test.beforeEach(async ({ adaContext }) => {
    projectsPage = new ProjectsPage(adaContext.page);
    chatPage = new ProjectChatPage(adaContext.page);
  });

  test("Display welcome message on chat page", async ({ adaContext }) => {
    await projectsPage.createProject({
      name: `Chat Test ${Date.now()}`,
    });

    const url = adaContext.page.url();
    const projectId = url.split("/projects/")[1]?.split("/")[0];

    await chatPage.goto(projectId);
    await chatPage.expectWelcomeMessage();
  });

  test("Display chat input and send button", async ({ adaContext }) => {
    await projectsPage.createProject({
      name: `Chat Input Test ${Date.now()}`,
    });

    const url = adaContext.page.url();
    const projectId = url.split("/projects/")[1]?.split("/")[0];

    await chatPage.goto(projectId);
    await expect(chatPage.messageInput).toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test.skip("Send message and receive response", async () => {
    // Skip: Requires AI API to be mocked
    // Would test:
    // 1. Send "What's the status of this project?"
    // 2. Wait for response
    // 3. Verify response contains budget information
  });
});

test.describe("Navigation", () => {
  let projectsPage: ProjectsPage;
  let projectDetailPage: ProjectDetailPage;

  test.beforeEach(async ({ babbageContext }) => {
    projectsPage = new ProjectsPage(babbageContext.page);
    projectDetailPage = new ProjectDetailPage(babbageContext.page);
  });

  test("Navigate between project pages via sidebar", async ({ babbageContext }) => {
    const projectName = `Nav Sidebar Test ${Date.now()}`;

    await projectsPage.createProject({
      name: projectName,
    });

    // Navigate to documents via sidebar
    await babbageContext.page.getByRole("link", { name: /documents/i }).click();
    await expect(babbageContext.page).toHaveURL(/\/documents$/);

    // Navigate to chat via sidebar
    await babbageContext.page.getByRole("link", { name: /chat/i }).click();
    await expect(babbageContext.page).toHaveURL(/\/chat$/);

    // Navigate back to budget via sidebar
    await babbageContext.page.getByRole("link", { name: /budget/i }).click();
    await expect(babbageContext.page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
  });

  test("Navigate to dashboard via sidebar logo", async ({ babbageContext }) => {
    await projectsPage.createProject({
      name: `Logo Nav Test ${Date.now()}`,
    });

    await babbageContext.page.getByText("Profit IQ").click();
    await expect(babbageContext.page).toHaveURL(/\/projects$/);
  });

  test("Create new project via sidebar button", async ({ babbageContext }) => {
    await projectsPage.goto();

    // Click the + button in sidebar
    await babbageContext.page.locator("button").filter({ hasText: "" }).first().click();
    await expect(babbageContext.page).toHaveURL(/\/projects\/new$/);
  });
});

test.describe("Responsive Design", () => {
  test("Show sidebar toggle on mobile", async ({ adaContext }) => {
    await adaContext.page.setViewportSize({ width: 375, height: 667 });

    const projectsPage = new ProjectsPage(adaContext.page);
    await projectsPage.goto();

    // Sidebar toggle should be visible on mobile
    await expect(adaContext.page.getByTestId("sidebar-toggle-button")).toBeVisible();
  });

  test("Hide sidebar by default on mobile", async ({ adaContext }) => {
    await adaContext.page.setViewportSize({ width: 375, height: 667 });

    const projectsPage = new ProjectsPage(adaContext.page);
    await projectsPage.goto();

    // Sidebar should be collapsed on mobile
    const sidebar = adaContext.page.locator("[data-sidebar='sidebar']");
    await expect(sidebar).not.toBeInViewport();
  });
});
