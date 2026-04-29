import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { verifyCron } from "@/lib/cron-auth";

// Vercel cron entry-point. Iterates every business with FOLLOW_UP enabled and
// nudges QUOTED leads that haven't been contacted in `delayHours`.
async function run() {
  const rules = await prisma.automationRule.findMany({
    where: { type: "FOLLOW_UP", enabled: true },
  });

  const results: Record<string, number> = {};

  for (const rule of rules) {
    const cutoff = new Date(Date.now() - rule.delayHours * 60 * 60 * 1000);
    const candidates = await prisma.lead.findMany({
      where: {
        businessId: rule.businessId,
        status: "QUOTED",
        OR: [{ lastContactedAt: { lt: cutoff } }, { lastContactedAt: null }],
      },
      take: 50,
    });

    for (const lead of candidates) {
      const text = rule.template
        .replace(/{{\s*name\s*}}/gi, lead.name ?? "there")
        .replace(/{{\s*price\s*}}/gi, lead.quotedPrice ? `$${lead.quotedPrice}` : "your quote");
      const r = await sendSms({ to: lead.phone, body: text });
      await prisma.message.create({
        data: {
          businessId: rule.businessId,
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
