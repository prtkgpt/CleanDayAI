import type { PricingRule } from "@prisma/client";

export function quotePrice(
  rule: PricingRule,
  input: { bedrooms?: number | null; bathrooms?: number | null; squareFeet?: number | null }
): number {
  const beds = input.bedrooms ?? 0;
  const baths = input.bathrooms ?? 0;
  const sqft = input.squareFeet ?? 0;
  const raw =
    rule.basePrice +
    rule.perBedroom * beds +
    rule.perBathroom * baths +
    rule.perSqFt * sqft;
  return Math.max(rule.minPrice, Math.round(raw));
}

export function summarizePricingRules(rules: PricingRule[]) {
  return rules
    .filter((r) => r.active)
    .map(
      (r) =>
        `- ${r.name} (${r.serviceType}): base $${r.basePrice}, +$${r.perBedroom}/bed, +$${r.perBathroom}/bath, +$${r.perSqFt}/sqft, min $${r.minPrice}.${r.notes ? ` Notes: ${r.notes}` : ""}`
    )
    .join("\n");
}
