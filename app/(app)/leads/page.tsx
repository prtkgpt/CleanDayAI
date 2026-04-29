import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatPhone, relativeTime } from "@/lib/utils";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";
import type { LeadStatus } from "@prisma/client";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { business } = await requireUser();
  const statusFilter = LEAD_STATUSES.includes(searchParams.status as LeadStatus)
    ? (searchParams.status as LeadStatus)
    : undefined;

  const leads = await prisma.lead.findMany({
    where: {
      businessId: business.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Leads"
        description="All inbound leads, qualified and unqualified."
        action={
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="size-4" /> New lead
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip href="/leads" label="All" active={!statusFilter} />
        {LEAD_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/leads?status=${s}`}
            label={LEAD_STATUS_LABELS[s]}
            active={statusFilter === s}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No leads match this view.
                  </TableCell>
                </TableRow>
              )}
              {leads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.name ?? "Unknown"}
                    </Link>
                    {lead.zip && (
                      <p className="text-xs text-muted-foreground">zip {lead.zip}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatPhone(lead.phone)}
                  </TableCell>
                  <TableCell className="text-sm">{lead.serviceType ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {lead.quotedPrice ? formatCurrency(lead.quotedPrice) : "—"}
                  </TableCell>
                  <TableCell>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {relativeTime(lead.lastContactedAt ?? lead.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
}
