import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

const createSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  scheduledFor: z.string(),
  durationMin: z.coerce.number().int().positive().optional(),
  serviceType: z.string(),
  price: z.coerce.number().int().nonnegative(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const bookings = await prisma.booking.findMany({
    where: { businessId: ctx.business.id },
    orderBy: { scheduledFor: "asc" },
    include: { customer: true, lead: true },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const booking = await prisma.booking.create({
    data: {
      businessId: ctx.business.id,
      leadId: data.leadId || null,
      customerId: data.customerId || null,
      scheduledFor: new Date(data.scheduledFor),
      durationMin: data.durationMin ?? 120,
      serviceType: data.serviceType,
      price: data.price,
      address: data.address || null,
      notes: data.notes || null,
    },
  });
  if (data.leadId) {
    await prisma.lead.update({ where: { id: data.leadId }, data: { status: "BOOKED" } });
  }
  return NextResponse.json(booking);
}
