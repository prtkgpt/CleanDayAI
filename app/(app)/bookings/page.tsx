import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils";

export default async function BookingsPage() {
  const { business } = await requireUser();
  const bookings = await prisma.booking.findMany({
    where: { businessId: business.id },
    orderBy: { scheduledFor: "asc" },
    include: { customer: true, lead: true },
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="All scheduled, confirmed, completed, and canceled jobs."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No bookings yet.
                  </TableCell>
                </TableRow>
              )}
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-sm">
                    {b.scheduledFor.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {b.customer?.name ?? b.lead?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{b.serviceType}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {b.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(b.price)}</TableCell>
                  <TableCell>
                    <BookingStatusBadge status={b.status} />
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
