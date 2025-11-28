import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = decodeAdminSession(token);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user || !user.isAdmin) {
    redirect("/auth/signin?error=NotAdmin");
  }

  return (
    <AdminShell user={{ name: user.nickname, email: user.phone }}>{children}</AdminShell>
  );
}
