import Link from "next/link";
import { CalendarDays, Users, AlertTriangle, DollarSign, Send, Star, Inbox, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LeadStatusBadge, BookingStatusBadge } from "@/components/status-badge";
import { formatCurrency, relativeTime, formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { business } = await requireUser();
  const businessId = business.id;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfWeek = new Date(startOfToday);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    newLeadsToday,
    leadsNeedingAttention,
    bookingsThisWeek,
    revenueAgg,
    followUpsSent,
    reviewsRequested,
    recentLeads,
    upcomingBookings,
  ] = await Promise.all([
    prisma.lead.count({
      where: { businessId, createdAt: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.lead.count({
      where: { businessId, status: { in: ["NEEDS_HUMAN", "QUALIFYING", "QUOTED"] } },
    }),
    prisma.booking.count({
      where: {
        businessId,
        scheduledFor: { gte: startOfWeek, lt: endOfWeek },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
    prisma.booking.aggregate({
      where: {
        businessId,
        scheduledFor: { gte: startOfWeek, lt: endOfWeek },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      _sum: { price: true },
    }),
    prisma.message.count({
      where: {
        businessId,
        direction: "OUTBOUND",
        sender: { in: ["AI", "SYSTEM"] },
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.reviewRequest.count({
      where: {
        businessId,
        status: { in: ["SENT", "CLICKED", "COMPLETED"] },
        sentAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
      },
    }),
    prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.booking.findMany({
      where: {
        businessId,
        scheduledFor: { gte: new Date() },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      orderBy: { scheduledFor: "asc" },
      include: { customer: true },
      take: 5,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${business.name}`}
        description="Here's what's happening today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="New leads today" value={newLeadsToday} icon={Inbox} />
        <StatCard
          label="Leads needing attention"
          value={leadsNeedingAttention}
          icon={AlertTriangle}
          tone={leadsNeedingAttention > 0 ? "warn" : "default"}
        />
        <StatCard label="Bookings this week" value={bookingsThisWeek} icon={CalendarDays} />
        <StatCard
          label="Revenue booked"
          value={formatCurrency(revenueAgg._sum.price ?? 0)}
          hint="Scheduled + confirmed this week"
          icon={DollarSign}
          tone="good"
        />
        <StatCard label="Follow-ups sent today" value={followUpsSent} icon={Send} />
        <StatCard label="Reviews requested (7d)" value={reviewsRequested} icon={Star} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent leads</CardTitle>
              <CardDescription>Newest activity from your inbox.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/leads">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            )}
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between rounded-md border bg-card/50 p-3 transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="text-sm font-medium">
                    {lead.name ?? "Unknown"}{" "}
                    <span className="text-xs text-muted-foreground">
                      {formatPhone(lead.phone)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lead.serviceType ?? "—"} · {relativeTime(lead.createdAt)}
                  </p>
                </div>
                <LeadStatusBadge status={lead.status} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Upcoming bookings</CardTitle>
              <CardDescription>Next scheduled jobs.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bookings">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBookings.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
            )}
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border bg-card/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {b.customer?.name ?? "Customer"}{" "}
                    <span className="text-xs text-muted-foreground">· {b.serviceType}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.scheduledFor.toLocaleString()} · {formatCurrency(b.price)}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
