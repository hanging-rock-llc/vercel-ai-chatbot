import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ProjectForm } from "@/components/profit-iq/project-form";

export default async function NewProjectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">New Project</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-2xl">
          <ProjectForm />
        </div>
      </main>
    </div>
  );
}
