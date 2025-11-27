"use client";

import { useState } from "react";
import { Copy, Check, Mail, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface EmailForwardingSetupProps {
  projectName: string;
  ingestToken: string;
  baseUrl?: string;
}

export function EmailForwardingSetup({
  projectName,
  ingestToken,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.com",
}: EmailForwardingSetupProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const webhookUrl = `${baseUrl}/api/ingest/email/${ingestToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      toast({
        title: "Failed to copy",
        description: "Please select and copy the URL manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Forwarding Setup
        </CardTitle>
        <CardDescription>
          Forward emails to automatically import invoices, quotes, and other
          documents into {projectName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Your unique webhook URL:
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono break-all">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Setup Options:</h4>

          {/* Option 1: Manual Forwarding */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h5 className="font-medium text-sm mb-2">
              Option 1: Manual Email Forwarding
            </h5>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Forward any email to your personal forwarding service</li>
              <li>Configure your service to POST to the webhook URL above</li>
              <li>Attachments like PDFs will be automatically extracted</li>
            </ol>
          </div>

          {/* Option 2: SendGrid */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h5 className="font-medium text-sm mb-2">
              Option 2: SendGrid Inbound Parse
            </h5>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://app.sendgrid.com/settings/parse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  SendGrid Inbound Parse Settings
                </a>
              </li>
              <li>Add a new host/domain for receiving emails</li>
              <li>Set the Destination URL to the webhook URL above</li>
              <li>
                Forward emails to:{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  {projectName.toLowerCase().replace(/\s+/g, "-")}@parse.yourdomain.com
                </code>
              </li>
            </ol>
          </div>

          {/* Option 3: Postmark */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h5 className="font-medium text-sm mb-2">
              Option 3: Postmark Inbound
            </h5>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://account.postmarkapp.com/servers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Postmark Servers
                </a>
              </li>
              <li>Create or select a server and go to Inbound</li>
              <li>Set the webhook URL to the URL above</li>
              <li>Forward emails to your Postmark inbound address</li>
            </ol>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>What happens when you forward an email?</AlertTitle>
          <AlertDescription className="text-sm">
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                The email content is analyzed for financial information (amounts,
                dates, references)
              </li>
              <li>
                Attached PDFs and documents are stored and queued for extraction
              </li>
              <li>
                Extracted data flows into your project budget automatically
              </li>
              <li>
                You can review and confirm extracted amounts before they affect
                your actuals
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
