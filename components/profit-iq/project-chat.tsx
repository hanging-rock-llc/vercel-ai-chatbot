"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { SendIcon, Loader2Icon, UserIcon, BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ProjectChatProps {
  projectId: string;
  projectName: string;
}

// Simple markdown-like formatting
function formatMessage(content: string): React.ReactNode {
  // Split by double newlines to create paragraphs
  const paragraphs = content.split(/\n\n+/);

  return paragraphs.map((para, i) => {
    // Handle bullet points
    if (para.includes("\n- ")) {
      const lines = para.split("\n");
      return (
        <div key={i} className="mb-2 last:mb-0">
          {lines.map((line, j) => {
            if (line.startsWith("- ")) {
              return (
                <div key={j} className="flex gap-2">
                  <span>•</span>
                  <span>{formatInline(line.slice(2))}</span>
                </div>
              );
            }
            return <span key={j}>{formatInline(line)}</span>;
          })}
        </div>
      );
    }

    return (
      <p key={i} className="mb-2 last:mb-0">
        {formatInline(para)}
      </p>
    );
  });
}

// Handle inline formatting like **bold**
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ProjectChat({ projectId, projectName }: ProjectChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `/api/projects/${projectId}/chat`,
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: `Hi! I'm your project assistant for **${projectName}**. I can help you understand your project finances, budget status, and documents.\n\nTry asking me:\n- "What's the status of this project?"\n- "Am I over budget on materials?"\n- "Show me recent invoices"\n- "Who are my biggest vendors?"`,
        },
      ],
    });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <BotIcon className="size-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "assistant" ? (
                  <div className="text-sm">{formatMessage(message.content)}</div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="size-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <BotIcon className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your project..."
              className="min-h-[44px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
