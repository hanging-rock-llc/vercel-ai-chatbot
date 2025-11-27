import { expect, type Page } from "@playwright/test";

export class ProjectsPage {
  constructor(private page: Page) {}

  // Selectors
  get newProjectButton() {
    return this.page.getByRole("link", { name: /new project/i });
  }

  get projectCards() {
    return this.page.getByTestId("project-card");
  }

  get emptyState() {
    return this.page.getByText(/no projects yet/i);
  }

  // Navigation
  async goto() {
    await this.page.goto("/projects");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoNewProject() {
    await this.page.goto("/projects/new");
    await this.page.waitForLoadState("networkidle");
  }

  // Actions
  async createProject(data: {
    name: string;
    clientName?: string;
    address?: string;
    contractValue?: string;
    startDate?: string;
    endDate?: string;
  }) {
    await this.gotoNewProject();

    await this.page.getByLabel(/project name/i).fill(data.name);

    if (data.clientName) {
      await this.page.getByLabel(/client name/i).fill(data.clientName);
    }

    if (data.address) {
      await this.page.getByLabel(/project address/i).fill(data.address);
    }

    if (data.contractValue) {
      await this.page.getByLabel(/contract value/i).fill(data.contractValue);
    }

    if (data.startDate) {
      await this.page.getByLabel(/start date/i).fill(data.startDate);
    }

    if (data.endDate) {
      await this.page.getByLabel(/end date/i).fill(data.endDate);
    }

    await this.page.getByRole("button", { name: /create project/i }).click();

    // Wait for redirect to project detail page
    await this.page.waitForURL(/\/projects\/[a-f0-9-]+$/);
  }

  async clickProject(name: string) {
    await this.page.getByRole("link", { name }).click();
    await this.page.waitForURL(/\/projects\/[a-f0-9-]+/);
  }

  // Assertions
  async expectProjectInList(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectToastSuccess(message: string | RegExp) {
    await expect(this.page.getByTestId("toast")).toContainText(message);
  }
}

export class ProjectDetailPage {
  constructor(private page: Page) {}

  // Selectors
  get budgetTable() {
    return this.page.locator("table").first();
  }

  get marginIndicator() {
    return this.page.getByTestId("margin-indicator");
  }

  get documentsLink() {
    return this.page.getByRole("link", { name: /documents/i });
  }

  get chatLink() {
    return this.page.getByRole("link", { name: /chat/i });
  }

  // Navigation
  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async gotoDocuments() {
    await this.documentsLink.click();
    await this.page.waitForURL(/\/documents$/);
  }

  async gotoChat() {
    await this.chatLink.click();
    await this.page.waitForURL(/\/chat$/);
  }

  // Budget Actions
  async editBudgetCategory(category: string, amount: string) {
    const row = this.page.locator("tr", { hasText: category });
    await row.getByRole("button").first().click(); // Edit button
    await row.getByRole("textbox").fill(amount);
    await row.getByRole("button", { name: /save|check/i }).click();
  }

  // Assertions
  async expectProjectName(name: string) {
    await expect(this.page.getByRole("heading", { name })).toBeVisible();
  }

  async expectContractValue(value: string) {
    await expect(this.page.getByText(value)).toBeVisible();
  }

  async expectBudgetCategory(category: string, estimated: string, actual: string) {
    const row = this.page.locator("tr", { hasText: category });
    await expect(row).toContainText(estimated);
    await expect(row).toContainText(actual);
  }
}

export class DocumentsPage {
  constructor(private page: Page) {}

  // Selectors
  get uploadZone() {
    return this.page.getByText(/drag and drop/i);
  }

  get fileInput() {
    return this.page.locator('input[type="file"]');
  }

  get documentCards() {
    return this.page.getByTestId("document-card");
  }

  get uploadButton() {
    return this.page.getByRole("button", { name: /upload/i });
  }

  // Navigation
  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/documents`);
    await this.page.waitForLoadState("networkidle");
  }

  // Actions
  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/api/documents/upload") && res.status() === 201
    );
  }

  async extractDocument(fileName: string) {
    const card = this.page.locator("[data-testid='document-card']", {
      hasText: fileName,
    });
    await card.getByRole("button", { name: /extract/i }).click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/extract") && res.ok()
    );
  }

  async clickReview(fileName: string) {
    const card = this.page.locator("[data-testid='document-card']", {
      hasText: fileName,
    });
    await card.getByRole("link", { name: /review/i }).click();
    await this.page.waitForURL(/\/review$/);
  }

  async deleteDocument(fileName: string) {
    const card = this.page.locator("[data-testid='document-card']", {
      hasText: fileName,
    });
    await card.getByRole("button", { name: /more/i }).click();
    await this.page.getByRole("menuitem", { name: /delete/i }).click();
    await this.page.getByRole("button", { name: /delete/i }).click();
  }

  // Assertions
  async expectDocument(fileName: string) {
    await expect(this.page.getByText(fileName)).toBeVisible();
  }

  async expectDocumentStatus(fileName: string, status: string) {
    const card = this.page.locator("[data-testid='document-card']", {
      hasText: fileName,
    });
    await expect(card).toContainText(status);
  }

  async expectEmptyState() {
    await expect(this.page.getByText(/no documents yet/i)).toBeVisible();
  }
}

export class ExtractionReviewPage {
  constructor(private page: Page) {}

  // Selectors
  get vendorNameInput() {
    return this.page.getByLabel(/vendor name/i);
  }

  get documentNumberInput() {
    return this.page.getByLabel(/document #/i);
  }

  get confirmButton() {
    return this.page.getByRole("button", { name: /confirm/i });
  }

  get rejectButton() {
    return this.page.getByRole("button", { name: /reject/i });
  }

  get lineItemsTable() {
    return this.page.locator("table").first();
  }

  // Actions
  async editVendorName(name: string) {
    await this.vendorNameInput.fill(name);
  }

  async editLineItemCategory(description: string, category: string) {
    const row = this.page.locator("tr", { hasText: description });
    await row.getByRole("combobox").click();
    await this.page.getByRole("option", { name: category }).click();
  }

  async deleteLineItem(description: string) {
    const row = this.page.locator("tr", { hasText: description });
    await row.getByRole("button", { name: /delete/i }).click();
  }

  async addLineItem() {
    await this.page.getByRole("button", { name: /add item/i }).click();
  }

  async confirm() {
    await this.confirmButton.click();
    await this.page.waitForURL(/\/projects\/[a-f0-9-]+$/);
  }

  async reject() {
    await this.rejectButton.click();
    await this.page.waitForURL(/\/documents$/);
  }

  // Assertions
  async expectLineItemCount(count: number) {
    await expect(this.lineItemsTable.locator("tbody tr")).toHaveCount(count);
  }

  async expectTotalAmount(amount: string) {
    await expect(this.page.getByText(amount)).toBeVisible();
  }
}

export class ProjectChatPage {
  constructor(private page: Page) {}

  // Selectors
  get messageInput() {
    return this.page.getByPlaceholder(/ask about your project/i);
  }

  get sendButton() {
    return this.page.getByRole("button", { name: /send/i });
  }

  get messages() {
    return this.page.locator("[data-testid='chat-message']");
  }

  // Navigation
  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/chat`);
    await this.page.waitForLoadState("networkidle");
  }

  // Actions
  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    // Wait for response
    await this.page.waitForFunction(
      () => {
        const loader = document.querySelector("[data-testid='chat-loading']");
        return !loader;
      },
      { timeout: 30000 }
    );
  }

  // Assertions
  async expectWelcomeMessage() {
    await expect(this.page.getByText(/I'm your project assistant/i)).toBeVisible();
  }

  async expectResponseContaining(text: string) {
    await expect(this.page.locator(".bg-muted").last()).toContainText(text);
  }
}
