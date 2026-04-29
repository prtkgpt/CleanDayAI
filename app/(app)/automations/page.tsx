import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AutomationToggle } from "@/components/automation-toggle";
import { Sparkles, Send, Star, BellRing } from "lucide-react";

const ICONS = {
  AUTO_REPLY: Sparkles,
  FOLLOW_UP: Send,
  BOOKING_REMINDER: BellRing,
  REVIEW_REQUEST: Star,
};

const TYPE_LABELS: Record<string, string> = {
  AUTO_REPLY: "Auto-reply",
  FOLLOW_UP: "Follow-up",
  BOOKING_REMINDER: "Booking reminder",
  REVIEW_REQUEST: "Review request",
};

export default async function AutomationsPage() {
  const { business } = await requireUser();
  const rules = await prisma.automationRule.findMany({
    where: { businessId: business.id },
    orderBy: { type: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Automations"
        description="Toggle and tune AI-powered conversations and follow-ups."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rules.map((rule) => {
          const Icon = ICONS[rule.type as keyof typeof ICONS] ?? Sparkles;
          return (
            <Card key={rule.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-secondary p-2 text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{rule.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {TYPE_LABELS[rule.type]}
                      {rule.delayHours > 0 && ` · sends after ${rule.delayHours}h`}
                    </CardDescription>
                  </div>
                </div>
                <AutomationToggle id={rule.id} enabled={rule.enabled} />
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {rule.template}
                </pre>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
