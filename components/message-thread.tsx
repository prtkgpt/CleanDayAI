"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, relativeTime } from "@/lib/utils";
import type { Message } from "@prisma/client";

export function MessageThread({
  leadId,
  initialMessages,
}: {
  leadId: string;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!body.trim() && !aiMode) return;
    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim(), useAI: aiMode }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
    setBody("");
    setAiMode(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col">
      <div className="max-h-[480px] space-y-3 overflow-y-auto pr-2">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-4 space-y-2 rounded-lg border bg-card/40 p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            aiMode
              ? "AI will draft and send a reply based on the conversation…"
              : "Send a manual SMS as a human…"
          }
          rows={3}
          disabled={aiMode}
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={aiMode}
              onChange={(e) => setAiMode(e.target.checked)}
              className="size-3.5"
            />
            <Sparkles className="size-3.5" /> Let AI draft & send a reply
          </label>
          <Button onClick={send} disabled={loading || (!body.trim() && !aiMode)} size="sm">
            <Send className="size-3.5" />
            {loading ? "Sending…" : aiMode ? "Send AI reply" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  const isInbound = message.direction === "INBOUND";
  const senderLabel = {
    CUSTOMER: "Customer",
    AI: "AI",
    HUMAN: "You",
    SYSTEM: "System",
  }[message.sender];
  const Icon = message.sender === "AI" ? Bot : message.sender === "HUMAN" ? User : null;

  return (
    <div className={cn("flex", isInbound ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isInbound
            ? "bg-secondary text-secondary-foreground"
            : message.sender === "AI"
            ? "bg-violet-500/15 text-violet-100 border border-violet-500/30"
            : message.sender === "SYSTEM"
            ? "bg-muted text-muted-foreground italic text-xs"
            : "bg-primary text-primary-foreground"
        )}
      >
        <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-70">
          {Icon && <Icon className="size-3" />}
          {senderLabel} · {relativeTime(message.createdAt)}
        </div>
        <p className="whitespace-pre-wrap">{message.body}</p>
      </div>
    </div>
  );
}
