import { NextResponse } from "next/server";
import { seedAwesomeMaids } from "@/lib/seed";

// One-time-use seeder. Call from your browser after deploy:
//   https://your-app.vercel.app/api/admin/seed?secret=<SEED_SECRET>
//
// Wipes all tenant data and re-creates the Awesome Maids demo.
async function handle(req: Request) {
  const expected = process.env.SEED_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured. Set it in Vercel env vars." },
      { status: 500 }
    );
  }
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ||
    req.headers.get("x-seed-secret") ||
    (req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");

  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedAwesomeMaids();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[seed]", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
