import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { generateAiReply, detectEscalation } from "@/lib/ai-reply";

// Twilio posts SMS as application/x-www-form-urlencoded.
// This endpoint:
//   1. Finds (or creates) a Lead by phone for the matching Business.
//   2. Stores the inbound message.
//   3. If auto-reply is enabled, generates an AI response and sends via Twilio.
export async function POST(req: Request) {
  const formData = await req.formData();
  const from = String(formData.get("From") ?? "").trim();
  const to = String(formData.get("To") ?? "").trim();
  const body = String(formData.get("Body") ?? "").trim();
  const twilioSid = (formData.get("MessageSid") as string) || undefined;

  if (!from || !body) {
    return NextResponse.json({ error: "Missing From/Body" }, { status: 400 });
  }

  // Find business by Twilio number
  const business = await prisma.business.findFirst({
    where: to ? { twilioNumber: to } : {},
  });
  if (!business) {
    return NextResponse.json({ error: "No business configured for this Twilio number" }, { status: 404 });
  }

  // Find or create lead
  let lead = await prisma.lead.findFirst({
    where: { businessId: business.id, phone: from },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!lead) {
    const created = await prisma.lead.create({
      data: {
        businessId: business.id,
        phone: from,
        source: "SMS",
        status: "NEW",
      },
    });
    lead = { ...created, messages: [] };
  }

  // Store inbound message
  await prisma.message.create({
    data: {
      businessId: business.id,
      leadId: lead.id,
      direction: "INBOUND",
      sender: "CUSTOMER",
      body,
      twilioSid,
    },
  });

  // Check for auto-reply automation
  const autoReply = await prisma.automationRule.findFirst({
    where: { businessId: business.id, type: "AUTO_REPLY", enabled: true },
  });

  if (!autoReply) {
    return NextResponse.json({ ok: true, autoReply: false });
  }

  const pricingRules = await prisma.pricingRule.findMany({
    where: { businessId: business.id, active: true },
  });

  const refreshedLead = await prisma.lead.findUniqueOrThrow({
    where: { id: lead.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const aiText = await generateAiReply({
    business,
    lead: refreshedLead,
    pricingRules,
    messages: refreshedLead.messages,
    incomingBody: body,
  });

  const sendResult = await sendSms({ to: from, body: aiText, from: business.twilioNumber || undefined });

  await prisma.message.create({
    data: {
      businessId: business.id,
      leadId: lead.id,
      direction: "OUTBOUND",
      sender: "AI",
      body: aiText,
      twilioSid: sendResult.sid,
      metadata: sendResult.simulated ? { simulated: true } : undefined,
    },
  });

  const escalated = detectEscalation(body).escalate;
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: escalated ? "NEEDS_HUMAN" : lead.status === "NEW" ? "AI_CONTACTED" : lead.status,
      needsHuman: escalated || lead.needsHuman,
      escalationReason: escalated
        ? "Customer message contained escalation keywords (refund, damage, complaint, etc.)"
        : lead.escalationReason,
      lastContactedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, autoReply: true });
}
