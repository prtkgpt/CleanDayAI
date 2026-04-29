"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";
import type { Lead } from "@prisma/client";

export function LeadForm({ lead }: { lead?: Lead }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
    const method = lead ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text();
      setError(t || "Failed to save");
      return;
    }
    const data = await res.json();
    router.push(`/leads/${data.id ?? lead?.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Name">
        <Input name="name" defaultValue={lead?.name ?? ""} />
      </Field>
      <Field label="Phone" required>
        <Input name="phone" defaultValue={lead?.phone ?? ""} required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" defaultValue={lead?.email ?? ""} />
      </Field>
      <Field label="Zip">
        <Input name="zip" defaultValue={lead?.zip ?? ""} />
      </Field>
      <Field label="Address">
        <Input name="address" defaultValue={lead?.address ?? ""} />
      </Field>
      <Field label="Service type">
        <Select name="serviceType" defaultValue={lead?.serviceType ?? ""}>
          <option value="">—</option>
          <option value="STANDARD">Standard</option>
          <option value="DEEP">Deep</option>
          <option value="MOVE">Move-in / Move-out</option>
          <option value="AIRBNB">Airbnb turnover</option>
        </Select>
      </Field>
      <Field label="Bedrooms">
        <Input name="bedrooms" type="number" defaultValue={lead?.bedrooms ?? ""} />
      </Field>
      <Field label="Bathrooms">
        <Input name="bathrooms" type="number" defaultValue={lead?.bathrooms ?? ""} />
      </Field>
      <Field label="Square feet">
        <Input name="squareFeet" type="number" defaultValue={lead?.squareFeet ?? ""} />
      </Field>
      <Field label="Frequency">
        <Select name="frequency" defaultValue={lead?.frequency ?? ""}>
          <option value="">—</option>
          <option value="one-time">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={lead?.status ?? "NEW"}>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quoted price (USD)">
        <Input name="quotedPrice" type="number" defaultValue={lead?.quotedPrice ?? ""} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Notes">
          <Textarea name="notes" defaultValue={lead?.notes ?? ""} rows={4} />
        </Field>
      </div>
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : lead ? "Save changes" : "Create lead"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
