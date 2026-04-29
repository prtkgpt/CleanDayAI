import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function getApiUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: { business: true },
  });
}

export async function requireApiUser() {
  const user = await getApiUser();
  if (!user || !user.business) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return { user, business: user.business } as const;
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
