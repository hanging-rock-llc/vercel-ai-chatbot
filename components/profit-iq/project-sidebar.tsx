"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import {
  FolderIcon,
  PlusIcon,
  FileTextIcon,
  MessageSquareIcon,
  LayoutDashboardIcon,
  MailIcon,
} from "lucide-react";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Project } from "@/lib/db/schema";

interface ProjectSidebarProps {
  user: User | undefined;
  projects: Project[];
}

export function ProjectSidebar({
  user,
  projects,
}: ProjectSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Extract currentProjectId from pathname
  // Matches: /projects/[id], /projects/[id]/documents, /projects/[id]/chat, etc.
  const projectIdMatch = pathname.match(/^\/projects\/([a-f0-9-]+)/);
  const currentProjectId = projectIdMatch?.[1];

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <Link
              className="flex flex-row items-center gap-2"
              href="/projects"
              onClick={() => setOpenMobile(false)}
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                Profit IQ
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 p-1 md:h-fit md:p-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/projects/new");
                  }}
                  type="button"
                  variant="ghost"
                >
                  <PlusIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="hidden md:block">
                New Project
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/projects"}
                >
                  <Link href="/projects" onClick={() => setOpenMobile(false)}>
                    <LayoutDashboardIcon className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No projects yet
                </div>
              ) : (
                projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentProjectId === project.id}
                    >
                      <Link
                        href={`/projects/${project.id}`}
                        onClick={() => setOpenMobile(false)}
                      >
                        <FolderIcon className="size-4" />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentProjectId && (
          <SidebarGroup>
            <SidebarGroupLabel>Project Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/projects/${currentProjectId}`}
                  >
                    <Link
                      href={`/projects/${currentProjectId}`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <LayoutDashboardIcon className="size-4" />
                      <span>Budget</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/projects/${currentProjectId}/documents`}
                  >
                    <Link
                      href={`/projects/${currentProjectId}/documents`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <FileTextIcon className="size-4" />
                      <span>Documents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/projects/${currentProjectId}/emails`}
                  >
                    <Link
                      href={`/projects/${currentProjectId}/emails`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <MailIcon className="size-4" />
                      <span>Emails</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/projects/${currentProjectId}/chat`}
                  >
                    <Link
                      href={`/projects/${currentProjectId}/chat`}
                      onClick={() => setOpenMobile(false)}
                    >
                      <MessageSquareIcon className="size-4" />
                      <span>Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
