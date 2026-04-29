import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const body = await req.json();
  const rule = await prisma.automationRule.findFirst({
    where: { id: params.id, businessId: ctx.business.id },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if ("enabled" in body) data.enabled = Boolean(body.enabled);
  if ("template" in body) data.template = String(body.template);
  if ("delayHours" in body) data.delayHours = Number(body.delayHours);
  if ("name" in body) data.name = String(body.name);

  const updated = await prisma.automationRule.update({
    where: { id: rule.id },
    data,
  });
  return NextResponse.json(updated);
}
