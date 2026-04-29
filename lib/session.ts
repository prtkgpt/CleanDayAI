import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { business: true },
  });
  if (!user || !user.business) redirect("/login");
  return { user, business: user.business };
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: { business: true },
  });
}
