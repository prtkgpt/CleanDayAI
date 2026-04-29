import type { Business, Lead, Message, PricingRule } from "@prisma/client";
import { getOpenAI, OPENAI_MODEL } from "./openai";
import { summarizePricingRules } from "./pricing";

export const ESCALATION_KEYWORDS = [
  "refund",
  "lawyer",
  "attorney",
  "broken",
  "damaged",
  "damage",
  "stole",
  "stolen",
  "complaint",
  "angry",
  "unacceptable",
  "terrible",
  "worst",
  "sue",
  "scam",
];

export function detectEscalation(text: string): { escalate: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const kw of ESCALATION_KEYWORDS) {
    if (lower.includes(kw)) {
      return { escalate: true, reason: `Keyword detected: "${kw}"` };
    }
  }
  return { escalate: false };
}

const SYSTEM_PROMPT = `You are an SMS receptionist for a residential cleaning business. Your job is to:
1. Reply quickly, warmly, and professionally — like a real human assistant.
2. Qualify the lead by gathering: name, zip code, bedrooms, bathrooms, approximate square footage, type of clean (standard / deep / move-in-out / Airbnb), and preferred date/time.
3. Once you have enough info, give a price quote using the business's pricing rules. Always express the price as a single dollar amount. Mention that final pricing may adjust on-site if the home needs more work.
4. NEVER confirm a booking on your own. Once the customer agrees to a quote, say you'll have someone confirm a slot shortly OR offer 2-3 specific time options the customer can pick from — but never declare the booking confirmed.
5. Escalate to a human (and say "I'll have the owner reach out shortly") if the customer is angry, mentions damage / breakage / theft, requests a refund, files a complaint, or asks for something outside the cleaning scope.
6. Keep replies under 320 characters. No emojis unless the customer used one first. No markdown.`;

interface BuildPromptArgs {
  business: Business;
  lead: Lead;
  pricingRules: PricingRule[];
  messages: Message[];
  incomingBody: string;
}

export function buildMessages(args: BuildPromptArgs) {
  const { business, lead, pricingRules, messages, incomingBody } = args;

  const context = [
    `Business: ${business.name}`,
    business.serviceArea ? `Service area: ${business.serviceArea}` : null,
    business.greeting ? `Owner's preferred greeting style: ${business.greeting}` : null,
    "",
    "Pricing rules:",
    summarizePricingRules(pricingRules),
    "",
    "Lead so far:",
    `- name: ${lead.name ?? "unknown"}`,
    `- zip: ${lead.zip ?? "unknown"}`,
    `- bedrooms: ${lead.bedrooms ?? "unknown"}`,
    `- bathrooms: ${lead.bathrooms ?? "unknown"}`,
    `- square feet: ${lead.squareFeet ?? "unknown"}`,
    `- service type: ${lead.serviceType ?? "unknown"}`,
    `- frequency: ${lead.frequency ?? "unknown"}`,
    lead.quotedPrice ? `- already quoted: $${lead.quotedPrice}` : null,
    "",
    "Reply with one short SMS message only.",
  ]
    .filter(Boolean)
    .join("\n");

  const history = messages.slice(-10).map((m) => ({
    role: m.direction === "INBOUND" ? ("user" as const) : ("assistant" as const),
    content: m.body,
  }));

  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "system" as const, content: context },
    ...history,
    { role: "user" as const, content: incomingBody },
  ];
}

export async function generateAiReply(args: BuildPromptArgs): Promise<string> {
  const escalation = detectEscalation(args.incomingBody);
  if (escalation.escalate) {
    return "Thanks for reaching out — I'm flagging this for our owner so a real person can follow up with you shortly. We appreciate your patience.";
  }

  const client = getOpenAI();
  if (!client) {
    return fallbackReply(args);
  }

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.5,
      max_tokens: 200,
      messages: buildMessages(args),
    });
    const text = completion.choices[0]?.message?.content?.trim();
    return text || fallbackReply(args);
  } catch (e) {
    console.error("[ai-reply] OpenAI error", e);
    return fallbackReply(args);
  }
}

function fallbackReply(args: BuildPromptArgs): string {
  const missing: string[] = [];
  if (!args.lead.zip) missing.push("zip code");
  if (!args.lead.bedrooms) missing.push("# of bedrooms");
  if (!args.lead.bathrooms) missing.push("# of bathrooms");
  if (!args.lead.serviceType) missing.push("type of clean (standard, deep, move-in/out, Airbnb)");

  if (missing.length) {
    return `Hi! Thanks for reaching out to ${args.business.name}. To put a quote together, could you share your ${missing.slice(0, 2).join(" and ")}?`;
  }
  return `Thanks! One of our team will follow up shortly with a quote for ${args.business.name}.`;
}
