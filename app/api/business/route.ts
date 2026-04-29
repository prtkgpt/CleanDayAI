import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function PATCH(req: Request) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;
  const body = await req.json();
  const allow = ["name", "phone", "twilioNumber", "timezone", "serviceArea", "greeting"];
  const data: Record<string, unknown> = {};
  for (const k of allow) if (k in body) data[k] = body[k] || null;
  const updated = await prisma.business.update({
    where: { id: ctx.business.id },
    data,
  });
  return NextResponse.json(updated);
}
