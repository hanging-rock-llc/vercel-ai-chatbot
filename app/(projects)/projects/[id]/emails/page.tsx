import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  getProjectById,
  getEmailDocumentsByProjectId,
  getAttachmentsByParentDocumentId,
} from "@/lib/db/queries-profit-iq";
import { SidebarToggle } from "@/components/sidebar-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmailCard } from "@/components/profit-iq/email-card";
import { EmailForwardingSetup } from "@/components/profit-iq/email-forwarding-setup";
import { Mail, Inbox } from "lucide-react";

export default async function ProjectEmailsPage({
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

  const emails = await getEmailDocumentsByProjectId({ projectId: id });

  // Fetch attachments for each email
  const emailsWithAttachments = await Promise.all(
    emails.map(async (email) => {
      const attachments = await getAttachmentsByParentDocumentId({
        parentDocumentId: email.id,
      });
      return { email, attachments };
    })
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
        <SidebarToggle />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Emails</h1>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Email Forwarding Setup */}
          <EmailForwardingSetup
            projectName={project.name}
            ingestToken={project.ingestToken}
          />

          {/* Emails List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Ingested Emails
              </CardTitle>
              <CardDescription>
                {emails.length === 0
                  ? "No emails ingested yet. Forward emails using the setup above."
                  : `${emails.length} email${emails.length === 1 ? "" : "s"} received`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No emails yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Forward invoices, quotes, and other documents from vendors to
                    automatically import them into this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailsWithAttachments.map(({ email, attachments }) => (
                    <EmailCard
                      key={email.id}
                      email={email}
                      attachments={attachments}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
