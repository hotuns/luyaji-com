import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getFishDex } from "@/lib/dex";

import { DexDashboard } from "./dex-dashboard";

export default async function DexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const dexPayload = await getFishDex(session.user.id);

  return (
    <DexDashboard summary={dexPayload.summary} species={dexPayload.species} />
  );
}
