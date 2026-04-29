import OpenAI from "openai";

let openai: OpenAI | null = null;

export function getOpenAI() {
  if (openai) return openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  openai = new OpenAI({ apiKey: key });
  return openai;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
