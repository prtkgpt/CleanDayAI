import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

// Sends review-request SMS for COMPLETED bookings finished in the last 24h
// for which we haven't yet logged a ReviewRequest.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const rule = await prisma.automationRule.findFirst({
    where: { businessId, type: "REVIEW_REQUEST", enabled: true },
  });
  if (!rule) return NextResponse.json({ ok: true, sent: 0, reason: "disabled" });

  const cutoff = new Date(Date.now() - rule.delayHours * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      completedAt: { lte: cutoff, gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
    },
    include: { customer: true },
  });

  let sent = 0;
  for (const b of bookings) {
    if (!b.customer) continue;
    const existing = await prisma.reviewRequest.findFirst({
      where: { businessId, customerId: b.customer.id, status: { in: ["SENT", "COMPLETED", "CLICKED"] } },
    });
    if (existing) continue;

    const link = "https://g.page/r/review";
    const text = rule.template
      .replace(/{{\s*name\s*}}/gi, b.customer.name)
      .replace(/{{\s*link\s*}}/gi, link);

    const r = await sendSms({ to: b.customer.phone, body: text });
    await prisma.reviewRequest.create({
      data: {
        businessId,
        customerId: b.customer.id,
        status: "SENT",
        sentAt: new Date(),
        link,
      },
    });
    await prisma.message.create({
      data: {
        businessId,
        direction: "OUTBOUND",
        sender: "AI",
        body: text,
        twilioSid: r.sid,
        metadata: { automation: "REVIEW_REQUEST", simulated: r.simulated, bookingId: b.id },
      },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
