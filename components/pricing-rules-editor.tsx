"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PricingRule } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export function PricingRulesEditor({ rules }: { rules: PricingRule[] }) {
  const router = useRouter();
  const [list, setList] = useState(rules);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(rule: PricingRule) {
    setSavingId(rule.id);
    await fetch(`/api/pricing-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    setSavingId(null);
    router.refresh();
  }

  function update(id: string, patch: Partial<PricingRule>) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-3">
      {list.map((rule) => (
        <div
          key={rule.id}
          className="grid grid-cols-2 gap-2 rounded-md border bg-card/40 p-3 md:grid-cols-7 md:items-end"
        >
          <Cell label="Name">
            <Input
              value={rule.name}
              onChange={(e) => update(rule.id, { name: e.target.value })}
            />
          </Cell>
          <Cell label="Type">
            <Input
              value={rule.serviceType}
              onChange={(e) => update(rule.id, { serviceType: e.target.value })}
            />
          </Cell>
          <Cell label="Base">
            <Input
              type="number"
              value={rule.basePrice}
              onChange={(e) => update(rule.id, { basePrice: Number(e.target.value) })}
            />
          </Cell>
          <Cell label="/bed">
            <Input
              type="number"
              value={rule.perBedroom}
              onChange={(e) => update(rule.id, { perBedroom: Number(e.target.value) })}
            />
          </Cell>
          <Cell label="/bath">
            <Input
              type="number"
              value={rule.perBathroom}
              onChange={(e) => update(rule.id, { perBathroom: Number(e.target.value) })}
            />
          </Cell>
          <Cell label="/sqft">
            <Input
              type="number"
              step="0.01"
              value={rule.perSqFt}
              onChange={(e) => update(rule.id, { perSqFt: Number(e.target.value) })}
            />
          </Cell>
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={() => save(rule)} disabled={savingId === rule.id}>
              {savingId === rule.id ? "…" : "Save"}
            </Button>
          </div>
          <p className="col-span-full text-xs text-muted-foreground">
            Min {formatCurrency(rule.minPrice)} · {rule.notes ?? ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
