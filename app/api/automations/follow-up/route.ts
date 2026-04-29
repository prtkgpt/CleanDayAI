import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";

// Triggered by an external cron / Vercel cron / GitHub Action.
// Sends follow-up SMS to leads in QUOTED status that haven't been contacted in N hours.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const rule = await prisma.automationRule.findFirst({
    where: { businessId, type: "FOLLOW_UP", enabled: true },
  });
  if (!rule) return NextResponse.json({ ok: true, sent: 0, reason: "disabled" });

  const cutoff = new Date(Date.now() - rule.delayHours * 60 * 60 * 1000);
  const candidates = await prisma.lead.findMany({
    where: {
      businessId,
      status: "QUOTED",
      OR: [{ lastContactedAt: { lt: cutoff } }, { lastContactedAt: null }],
    },
    take: 50,
  });

  let sent = 0;
  for (const lead of candidates) {
    const text = rule.template
      .replace(/{{\s*name\s*}}/gi, lead.name ?? "there")
      .replace(/{{\s*price\s*}}/gi, lead.quotedPrice ? `$${lead.quotedPrice}` : "your quote");
    const r = await sendSms({ to: lead.phone, body: text });
    await prisma.message.create({
      data: {
        businessId,
        leadId: lead.id,
        direction: "OUTBOUND",
        sender: "AI",
        body: text,
        twilioSid: r.sid,
        metadata: { automation: "FOLLOW_UP", simulated: r.simulated },
      },
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastContactedAt: new Date() },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
