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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-6 bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
        <p className="text-sm text-white/80">渔获图鉴</p>
        <h1 className="text-3xl font-semibold mt-1">我的鱼种收藏</h1>
        <p className="text-sm text-white/80 mt-2">
          记录每一次相遇，逐步解锁全国常见鱼种
        </p>
      </div>

      <div className="px-4 -mt-6 space-y-6">
        <DexDashboard summary={dexPayload.summary} species={dexPayload.species} />
      </div>
    </div>
  );
}
