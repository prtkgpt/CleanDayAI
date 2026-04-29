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
import { formatCurrency, formatPhone } from "@/lib/utils";

export default async function CustomersPage() {
  const { business } = await requireUser();
  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Repeat customers and their lifetime value."
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Lifetime value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No customers yet.
                  </TableCell>
                </TableRow>
              )}
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatPhone(c.phone)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c._count.bookings}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(c.lifetimeValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
