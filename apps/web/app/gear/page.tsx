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
    <div className="space-y-6">
      {/* Header - 匹配 Demo GearView */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">装备库</h2>
      </div>
      
      <GearDashboard initialRods={rodSummaries} initialReels={reelSummaries} initialCombos={comboSummaries} />
    </div>
  );
}
