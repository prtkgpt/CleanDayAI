"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm({ business }: { business: Business }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setDone(false);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Business name">
        <Input name="name" defaultValue={business.name} required />
      </Field>
      <Field label="Phone">
        <Input name="phone" defaultValue={business.phone ?? ""} />
      </Field>
      <Field label="Twilio number">
        <Input name="twilioNumber" defaultValue={business.twilioNumber ?? ""} />
      </Field>
      <Field label="Timezone">
        <Input name="timezone" defaultValue={business.timezone} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Service area">
          <Input name="serviceArea" defaultValue={business.serviceArea ?? ""} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="AI greeting">
          <Textarea name="greeting" rows={3} defaultValue={business.greeting ?? ""} />
        </Field>
      </div>
      <div className="md:col-span-2 flex items-center justify-end gap-3">
        {done && <span className="text-sm text-emerald-400">Saved.</span>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
