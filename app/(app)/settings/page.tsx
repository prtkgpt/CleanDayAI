import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";
import { PricingRulesEditor } from "@/components/pricing-rules-editor";

export default async function SettingsPage() {
  const { business } = await requireUser();
  const pricingRules = await prisma.pricingRule.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Settings" description="Business profile, pricing, and integrations." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>What customers see and how the AI introduces you.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm business={business} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing rules</CardTitle>
            <CardDescription>
              The AI uses these to generate quotes — base + per bedroom + per bathroom + per sq ft.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PricingRulesEditor rules={pricingRules} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>SMS via Twilio. AI replies via OpenAI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Twilio number" value={business.twilioNumber ?? "Not configured"} />
            <Row label="OpenAI" value={process.env.OPENAI_API_KEY ? "Connected" : "Add OPENAI_API_KEY to .env"} />
            <Row label="Inbound webhook" value="POST /api/twilio/inbound" mono />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
