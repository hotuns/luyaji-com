import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "./admin-session";
import { prisma } from "./prisma";

export class AdminAuthError extends Error {
  constructor(message = "UNAUTHORIZED") {
    super(message);
  }
}

export async function requireAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = decodeAdminSession(token);

  if (!session) {
    throw new AdminAuthError();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, nickname: true, isAdmin: true },
  });

  if (!user || !user.isAdmin) {
    throw new AdminAuthError();
  }

  return user;
}
