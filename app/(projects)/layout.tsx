import { cookies } from "next/headers";
import { ProjectSidebar } from "@/components/profit-iq/project-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";
import { getProjectsByUserId } from "@/lib/db/queries-profit-iq";

export const experimental_ppr = true;

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  // Fetch projects for the sidebar
  const projects = session?.user?.id
    ? await getProjectsByUserId({ userId: session.user.id })
    : [];

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <ProjectSidebar user={session?.user} projects={projects} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
