import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  client = twilio(sid, token);
  return client;
}

export async function sendSms(opts: {
  to: string;
  body: string;
  from?: string;
}): Promise<{ sid?: string; simulated: boolean }> {
  const c = getClient();
  const from = opts.from || process.env.TWILIO_PHONE_NUMBER;
  if (!c || !from) {
    console.log(`[twilio:simulated] -> ${opts.to}: ${opts.body}`);
    return { simulated: true };
  }
  const msg = await c.messages.create({ to: opts.to, from, body: opts.body });
  return { sid: msg.sid, simulated: false };
}
