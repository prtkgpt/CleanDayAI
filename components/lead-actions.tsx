"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LeadActions({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function clearEscalation() {
    setLoading(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needsHuman: false, status: "QUALIFYING", escalationReason: "" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button onClick={clearEscalation} disabled={loading} size="sm" variant="outline">
      {loading ? "Clearing…" : "Mark resolved"}
    </Button>
  );
}
