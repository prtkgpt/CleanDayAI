import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/status-badge";
import { LeadForm } from "@/components/lead-form";
import { MessageThread } from "@/components/message-thread";
import { LeadActions } from "@/components/lead-actions";
import { formatCurrency, formatPhone, relativeTime } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const { business } = await requireUser();
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, businessId: business.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      bookings: { orderBy: { scheduledFor: "asc" } },
    },
  });
  if (!lead) notFound();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href="/leads">
          <ArrowLeft className="size-4" /> Back to leads
        </Link>
      </Button>
      <PageHeader
        title={lead.name ?? "Unnamed lead"}
        description={`Lead created ${relativeTime(lead.createdAt)} · ${lead.source}`}
        action={<LeadStatusBadge status={lead.status} />}
      />

      {lead.needsHuman && (
        <Card className="mb-6 border-red-500/30 bg-red-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Sparkles className="mt-0.5 size-4 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">Escalated to human</p>
              <p className="mt-1 text-xs text-red-200/80">
                {lead.escalationReason ??
                  "AI flagged this conversation for human follow-up."}
              </p>
            </div>
            <LeadActions leadId={lead.id} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageThread leadId={lead.id} initialMessages={lead.messages} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead details</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadForm lead={lead} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                {formatPhone(lead.phone)}
              </div>
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  {lead.email}
                </div>
              )}
              {(lead.address || lead.zip) && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  {[lead.address, lead.zip].filter(Boolean).join(", ")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row k="Service" v={lead.serviceType ?? "—"} />
              <Row k="Bedrooms" v={lead.bedrooms?.toString() ?? "—"} />
              <Row k="Bathrooms" v={lead.bathrooms?.toString() ?? "—"} />
              <Row k="Sq ft" v={lead.squareFeet?.toString() ?? "—"} />
              <Row k="Frequency" v={lead.frequency ?? "—"} />
              <Row k="Quote" v={lead.quotedPrice ? formatCurrency(lead.quotedPrice) : "—"} />
            </CardContent>
          </Card>

          {lead.bookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {lead.bookings.map((b) => (
                  <div key={b.id} className="rounded-md border p-3">
                    <p className="font-medium">{b.serviceType}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.scheduledFor.toLocaleString()} · {formatCurrency(b.price)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
