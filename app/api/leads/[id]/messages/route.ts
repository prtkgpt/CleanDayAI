import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";
import { sendSms } from "@/lib/twilio";
import { generateAiReply, detectEscalation } from "@/lib/ai-reply";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await requireApiUser();
  if ("error" in ctx) return ctx.error;

  const { body, useAI } = (await req.json()) as { body?: string; useAI?: boolean };

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, businessId: ctx.business.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let outboundBody = (body ?? "").trim();

  if (useAI) {
    const pricingRules = await prisma.pricingRule.findMany({
      where: { businessId: ctx.business.id, active: true },
    });
    const lastInbound = [...lead.messages].reverse().find((m) => m.direction === "INBOUND");
    outboundBody = await generateAiReply({
      business: ctx.business,
      lead,
      pricingRules,
      messages: lead.messages,
      incomingBody: lastInbound?.body ?? "(no recent customer message)",
    });
  }

  if (!outboundBody) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const sendResult = await sendSms({ to: lead.phone, body: outboundBody });

  await prisma.message.create({
    data: {
      businessId: ctx.business.id,
      leadId: lead.id,
      direction: "OUTBOUND",
      sender: useAI ? "AI" : "HUMAN",
      body: outboundBody,
      twilioSid: sendResult.sid,
      metadata: sendResult.simulated ? { simulated: true } : undefined,
    },
  });

  // Update lead status if AI handled
  if (useAI) {
    const escalated = detectEscalation(outboundBody).escalate;
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: escalated ? "NEEDS_HUMAN" : lead.status === "NEW" ? "AI_CONTACTED" : lead.status,
        needsHuman: escalated || lead.needsHuman,
        lastContactedAt: new Date(),
      },
    });
  } else {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastContactedAt: new Date() },
    });
  }

  const messages = await prisma.message.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}
