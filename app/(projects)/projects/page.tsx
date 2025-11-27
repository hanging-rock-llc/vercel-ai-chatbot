import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusIcon, FolderIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { auth } from "@/app/(auth)/auth";
import { getProjectsByUserId, getProjectTotals } from "@/lib/db/queries-profit-iq";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarToggle } from "@/components/sidebar-toggle";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function getMarginColor(marginPercent: number): string {
  if (marginPercent >= 15) return "text-green-600 dark:text-green-400";
  if (marginPercent >= 5) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

async function ProjectCard({ projectId }: { projectId: string }) {
  const totals = await getProjectTotals({ projectId });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Contract Value</span>
        <span className="font-medium">{formatCurrency(totals.contractValue)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Actual Costs</span>
        <span className="font-medium">{formatCurrency(totals.totalActual)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Margin</span>
        <span className={`font-semibold flex items-center gap-1 ${getMarginColor(totals.marginPercent)}`}>
          {totals.marginPercent >= 0 ? (
            <TrendingUpIcon className="size-4" />
          ) : (
            <TrendingDownIcon className="size-4" />
          )}
          {totals.marginPercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const projects = await getProjectsByUserId({ userId: session.user.id });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Projects</h1>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <PlusIcon className="mr-2 size-4" />
            New Project
          </Button>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        {projects.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <FolderIcon className="size-6 text-muted-foreground" />
              </div>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Get started by creating your first project to track profitability.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/projects/new">
                <Button>
                  <PlusIcon className="mr-2 size-4" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {project.clientName && (
                          <CardDescription>{project.clientName}</CardDescription>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(project.status)}
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProjectCard projectId={project.id} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
