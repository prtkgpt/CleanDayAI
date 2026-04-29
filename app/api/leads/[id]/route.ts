import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, businessId: ctx.business.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const body = await req.json();
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, businessId: ctx.business.id },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allow = [
    "name",
    "phone",
    "email",
    "address",
    "zip",
    "serviceType",
    "bedrooms",
    "bathrooms",
    "squareFeet",
    "frequency",
    "notes",
    "status",
    "quotedPrice",
    "needsHuman",
    "escalationReason",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allow) {
    if (k in body) {
      let v = body[k];
      if (v === "") v = null;
      if (
        ["bedrooms", "bathrooms", "squareFeet", "quotedPrice"].includes(k) &&
        v !== null &&
        v !== undefined
      ) {
        v = Number(v);
      }
      data[k] = v;
    }
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  await prisma.lead.deleteMany({
    where: { id: params.id, businessId: ctx.business.id },
  });
  return NextResponse.json({ ok: true });
}
