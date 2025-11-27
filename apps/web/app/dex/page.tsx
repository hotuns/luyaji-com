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
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-6 pt-10 pb-16 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">渔获图鉴</h1>
          <p className="text-sm text-emerald-50 mt-2 font-medium opacity-90">
            记录每一次相遇，逐步解锁全国常见鱼种
          </p>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4 relative z-20">
        <DexDashboard summary={dexPayload.summary} species={dexPayload.species} />
      </div>
    </div>
  );
}
