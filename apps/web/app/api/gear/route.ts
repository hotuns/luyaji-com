import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
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
          sceneMetadata: {
            include: {
              metadata: { select: { id: true, label: true, value: true } },
            },
          },
        },
      }),
    ]);

    const rodSummaries = rods.map((rod) => ({
      id: rod.id,
      name: rod.name,
      brand: rod.brand,
      brandMetadataId: rod.brandMetadataId,
      length: rod.length,
      lengthUnit: rod.lengthUnit,
      lengthUnitMetadataId: rod.lengthUnitMetadataId,
      power: rod.power,
      powerMetadataId: rod.powerMetadataId,
      lureWeightMin: rod.lureWeightMin,
      lureWeightMax: rod.lureWeightMax,
      lineWeightText: rod.lineWeightText,
      price: rod.price,
      note: rod.note,
      visibility: rod.visibility as "private" | "public",
      combosCount: rod._count.combos,
    }));

    const reelSummaries = reels.map((reel) => ({
      id: reel.id,
      name: reel.name,
      brand: reel.brand,
      brandMetadataId: reel.brandMetadataId,
      model: reel.model,
      gearRatioText: reel.gearRatioText,
      lineCapacityText: reel.lineCapacityText,
      price: reel.price,
      note: reel.note,
      visibility: reel.visibility as "private" | "public",
      combosCount: reel._count.combos,
    }));

    const comboSummaries = combos.map((combo) => {
      const sceneMetadataIds =
        combo.sceneMetadata?.map((item) => item.metadataId).filter(Boolean) ?? [];
      const metadataLabels =
        combo.sceneMetadata
          ?.map((item) => item.metadata?.label ?? item.metadata?.value ?? null)
          .filter((item): item is string => Boolean(item)) ?? [];
      const fallbackSceneTags = Array.isArray(combo.sceneTags)
        ? (combo.sceneTags as unknown[])
            .map((item) => (typeof item === "string" ? item : null))
            .filter((item): item is string => Boolean(item))
        : [];
      const metadataLabelSet = new Set(metadataLabels);
      const customSceneTags = fallbackSceneTags.filter(
        (tag) => !metadataLabelSet.has(tag)
      );
      const displaySceneTags =
        metadataLabels.length > 0 || customSceneTags.length > 0
          ? [...metadataLabels, ...customSceneTags]
          : fallbackSceneTags;

      return {
        id: combo.id,
        name: combo.name,
        rodId: combo.rodId,
        reelId: combo.reelId,
        mainLineText: combo.mainLineText,
        leaderLineText: combo.leaderLineText,
        hookText: combo.hookText,
        detailNote: combo.detailNote,
        visibility: combo.visibility as "private" | "public",
        sceneTags: displaySceneTags,
        sceneMetadataIds,
        customSceneTags,
        rod: combo.rod,
        reel: combo.reel,
        photoUrls: Array.isArray(combo.photoUrls)
          ? (combo.photoUrls as string[])
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        rods: rodSummaries,
        reels: reelSummaries,
        combos: comboSummaries,
      },
    });
  } catch (error) {
    console.error("获取装备数据失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}
