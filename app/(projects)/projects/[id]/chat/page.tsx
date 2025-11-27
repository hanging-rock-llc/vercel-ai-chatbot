import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { getProjectById } from "@/lib/db/queries-profit-iq";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ProjectChat } from "@/components/profit-iq/project-chat";

export default async function ProjectChatPage({
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Chat</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ProjectChat projectId={project.id} projectName={project.name} />
      </div>
    </div>
  );
}
