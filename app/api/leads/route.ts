import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

const createSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  serviceType: z.string().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  squareFeet: z.coerce.number().int().nonnegative().optional().nullable(),
  frequency: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional(),
  quotedPrice: z.coerce.number().int().nonnegative().optional().nullable(),
});

export async function GET() {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const leads = await prisma.lead.findMany({
    where: { businessId: ctx.business.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(leads);
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
  const lead = await prisma.lead.create({
    data: {
      businessId: ctx.business.id,
      name: data.name || null,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      zip: data.zip || null,
      serviceType: data.serviceType || null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      squareFeet: data.squareFeet ?? null,
      frequency: data.frequency || null,
      notes: data.notes || null,
      status: (data.status as any) || "NEW",
      quotedPrice: data.quotedPrice ?? null,
      source: "OTHER",
    },
  });
  return NextResponse.json(lead);
}
