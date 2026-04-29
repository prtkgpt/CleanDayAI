import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { verifyCron } from "@/lib/cron-auth";

async function run() {
  const rules = await prisma.automationRule.findMany({
    where: { type: "REVIEW_REQUEST", enabled: true },
  });

  const results: Record<string, number> = {};

  for (const rule of rules) {
    const cutoff = new Date(Date.now() - rule.delayHours * 60 * 60 * 1000);
    const bookings = await prisma.booking.findMany({
      where: {
        businessId: rule.businessId,
        status: "COMPLETED",
        completedAt: { lte: cutoff, gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
      },
      include: { customer: true },
    });

    for (const b of bookings) {
      if (!b.customer) continue;
      const existing = await prisma.reviewRequest.findFirst({
        where: {
          businessId: rule.businessId,
          customerId: b.customer.id,
          status: { in: ["SENT", "COMPLETED", "CLICKED"] },
        },
      });
      if (existing) continue;

      const link = "https://g.page/r/review";
      const text = rule.template
        .replace(/{{\s*name\s*}}/gi, b.customer.name)
        .replace(/{{\s*link\s*}}/gi, link);

      const r = await sendSms({ to: b.customer.phone, body: text });

      await prisma.reviewRequest.create({
        data: {
          businessId: rule.businessId,
          customerId: b.customer.id,
          status: "SENT",
          sentAt: new Date(),
          link,
        },
      });
      await prisma.message.create({
        data: {
          businessId: rule.businessId,
          direction: "OUTBOUND",
          sender: "AI",
          body: text,
          twilioSid: r.sid,
          metadata: { automation: "REVIEW_REQUEST", simulated: r.simulated, bookingId: b.id },
        },
      });
      results[rule.businessId] = (results[rule.businessId] ?? 0) + 1;
    }
  }

  return results;
}

export async function GET(req: Request) {
  const blocked = verifyCron(req);
  if (blocked) return blocked;
  const results = await run();
  return NextResponse.json({ ok: true, sent: results });
}

export async function POST(req: Request) {
  return GET(req);
}
