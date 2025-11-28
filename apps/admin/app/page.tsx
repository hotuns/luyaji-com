import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, decodeAdminSession } from "@/lib/admin-session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = decodeAdminSession(token);

  if (!session) {
    redirect("/auth/signin");
  }

  redirect("/dashboard");
}
