import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const body = await req.json();
  const rule = await prisma.pricingRule.findFirst({
    where: { id: params.id, businessId: ctx.business.id },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allow = [
    "name",
    "serviceType",
    "basePrice",
    "perBedroom",
    "perBathroom",
    "perSqFt",
    "minPrice",
    "active",
    "notes",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allow) {
    if (k in body) {
      const v = body[k];
      if (["basePrice", "perBedroom", "perBathroom", "minPrice"].includes(k)) {
        data[k] = Number(v) || 0;
      } else if (k === "perSqFt") {
        data[k] = Number(v) || 0;
      } else if (k === "active") {
        data[k] = Boolean(v);
      } else {
        data[k] = v ?? null;
      }
    }
  }

  const updated = await prisma.pricingRule.update({
    where: { id: rule.id },
    data,
  });
  return NextResponse.json(updated);
}
