import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  FileTextIcon,
  MessageSquareIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  SettingsIcon,
} from "lucide-react";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getProjectBudgetSummary,
  getProjectTotals,
  getDocumentsByProjectId,
} from "@/lib/db/queries-profit-iq";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BudgetTableWrapper } from "@/components/profit-iq/budget-table-wrapper";
import { MarginBar, MarginIndicator } from "@/components/profit-iq/margin-indicator";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "completed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const project = await getProjectById({ id });

  if (!project || project.userId !== session.user.id) {
    notFound();
  }

  const [summary, totals, documents] = await Promise.all([
    getProjectBudgetSummary({ projectId: id }),
    getProjectTotals({ projectId: id }),
    getDocumentsByProjectId({ projectId: id }),
  ]);

  const confirmedDocs = documents.filter((d) => d.status === "confirmed");
  const pendingDocs = documents.filter((d) => d.status === "pending" || d.status === "extracted");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${id}/documents`}>
            <Button variant="outline" size="sm">
              <FileTextIcon className="mr-2 size-4" />
              Documents
            </Button>
          </Link>
          <Link href={`/projects/${id}/chat`}>
            <Button variant="outline" size="sm">
              <MessageSquareIcon className="mr-2 size-4" />
              Chat
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Project Info & Margin Summary */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Project Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Project Details</CardTitle>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(project.status)}
                  >
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {project.clientName && (
                  <div className="flex items-center gap-2">
                    <UserIcon className="size-4 text-muted-foreground" />
                    <span>{project.clientName}</span>
                  </div>
                )}
                {project.address && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="size-4 text-muted-foreground" />
                    <span>{project.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <span>
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contract Value</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.contractValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Costs</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.totalActual)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Margin</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.marginAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Margin Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Margin Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <MarginIndicator
                    marginPercent={totals.marginPercent}
                    className="text-2xl px-6 py-2"
                  />
                  <MarginBar marginPercent={totals.marginPercent} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Documents</CardTitle>
                  <Link href={`/projects/${id}/documents`}>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{confirmedDocs.length}</div>
                    <div className="text-sm text-muted-foreground">Confirmed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {pendingDocs.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{documents.length}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link href={`/projects/${id}/documents`}>
                  <Button variant="outline" size="sm">
                    <FileTextIcon className="mr-2 size-4" />
                    Upload Document
                  </Button>
                </Link>
                <Link href={`/projects/${id}/chat`}>
                  <Button variant="outline" size="sm">
                    <MessageSquareIcon className="mr-2 size-4" />
                    Ask Questions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Budget Table */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actuals</CardTitle>
              <CardDescription>
                Click the edit button to update estimated amounts for each category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetTableWrapper projectId={id} initialSummary={summary} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
