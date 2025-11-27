import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { GearDashboard, ComboSummary, ReelSummary, RodSummary } from "./gear-dashboard";

export default async function GearPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const [rods, reels, combos] = await Promise.all([
    prisma.rod.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { combos: true } } },
    }),
    prisma.reel.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { combos: true } } },
    }),
    prisma.combo.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        rod: { select: { id: true, name: true } },
        reel: { select: { id: true, name: true } },
      },
    }),
  ]);

  const rodSummaries: RodSummary[] = rods.map((rod) => ({
    id: rod.id,
    name: rod.name,
    brand: rod.brand,
    length: rod.length,
    lengthUnit: rod.lengthUnit,
    power: rod.power,
    lureWeightMin: rod.lureWeightMin,
    lureWeightMax: rod.lureWeightMax,
    lineWeightText: rod.lineWeightText,
    note: rod.note,
    visibility: rod.visibility as "private" | "public",
    combosCount: rod._count.combos,
  }));

  const reelSummaries: ReelSummary[] = reels.map((reel) => ({
    id: reel.id,
    name: reel.name,
    brand: reel.brand,
    model: reel.model,
    gearRatioText: reel.gearRatioText,
    lineCapacityText: reel.lineCapacityText,
    note: reel.note,
    visibility: reel.visibility as "private" | "public",
    combosCount: reel._count.combos,
  }));

  const comboSummaries: ComboSummary[] = combos.map((combo) => ({
    id: combo.id,
    name: combo.name,
    rodId: combo.rodId,
    reelId: combo.reelId,
    mainLineText: combo.mainLineText,
    leaderLineText: combo.leaderLineText,
    hookText: combo.hookText,
    detailNote: combo.detailNote,
    visibility: combo.visibility as "private" | "public",
    sceneTags: Array.isArray(combo.sceneTags) ? (combo.sceneTags as string[]) : null,
    rod: combo.rod,
    reel: combo.reel,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white px-6 pt-10 pb-16 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">装备管理</h1>
          <p className="text-sm text-blue-50 mt-2 font-medium opacity-90">
            统一维护鱼竿、渔轮与组合，支持快速创建与编辑
          </p>
        </div>
      </div>
      
      <div className="px-4 space-y-4 -mt-8 relative z-20">
        <GearDashboard initialRods={rodSummaries} initialReels={reelSummaries} initialCombos={comboSummaries} />
      </div>
    </div>
  );
}
