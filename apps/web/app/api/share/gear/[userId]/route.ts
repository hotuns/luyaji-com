import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type BrandStat = { label: string; count: number };

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : null))
    .filter((item): item is string => Boolean(item));
};

const aggregateBrands = <T,>(items: T[], accessor: (item: T) => string | null | undefined): BrandStat[] => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const label = accessor(item)?.trim();
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
};

const normalizeSceneTags = (
  sceneMetadata: Array<{ metadata?: { label: string | null; value: string | null } | null }> | null | undefined,
  rawSceneTags: unknown,
) => {
  const metadataLabels =
    sceneMetadata
      ?.map((item) => item.metadata?.label || item.metadata?.value || null)
      .filter((item): item is string => Boolean(item)) ?? [];

  const fallbackSceneTags = Array.isArray(rawSceneTags)
    ? rawSceneTags
        .map((tag) => (typeof tag === "string" ? tag : null))
        .filter((tag): tag is string => Boolean(tag))
    : [];

  const metadataLabelSet = new Set(metadataLabels);
  const customSceneTags = fallbackSceneTags.filter((tag) => !metadataLabelSet.has(tag));

  return [...metadataLabels, ...customSceneTags];
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 },
      );
    }

    const [combosRaw, rodsRaw, reelsRaw] = await Promise.all([
      prisma.combo.findMany({
        where: { userId, visibility: "public" },
        orderBy: [
          { likeCount: "desc" },
          { updatedAt: "desc" },
        ],
        include: {
          rod: {
            select: {
              id: true,
              name: true,
              brand: true,
              length: true,
              lengthUnit: true,
              power: true,
              price: true,
            },
          },
          reel: {
            select: {
              id: true,
              name: true,
              brand: true,
              model: true,
              gearRatioText: true,
              price: true,
            },
          },
          sceneMetadata: {
            include: {
              metadata: {
                select: { id: true, label: true, value: true },
              },
            },
          },
        },
      }),
      prisma.rod.findMany({
        where: { userId, visibility: "public" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          brand: true,
          length: true,
          lengthUnit: true,
          power: true,
          lureWeightMin: true,
          lureWeightMax: true,
          lineWeightText: true,
          price: true,
          note: true,
          updatedAt: true,
          _count: { select: { combos: true } },
        },
      }),
      prisma.reel.findMany({
        where: { userId, visibility: "public" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          brand: true,
          model: true,
          gearRatioText: true,
          lineCapacityText: true,
          price: true,
          note: true,
          updatedAt: true,
          _count: { select: { combos: true } },
        },
      }),
    ]);

    const combos = combosRaw.map((combo) => {
      const photoUrls = toStringArray(combo.photoUrls);
      const sceneTags = normalizeSceneTags(combo.sceneMetadata, combo.sceneTags);
      return {
        id: combo.id,
        name: combo.name,
        detailNote: combo.detailNote,
        visibility: combo.visibility,
        likeCount: combo.likeCount,
        mainLineText: combo.mainLineText,
        leaderLineText: combo.leaderLineText,
        hookText: combo.hookText,
        lures: combo.lures,
        sceneTags,
        updatedAt: combo.updatedAt.toISOString(),
        rod: combo.rod
          ? {
              id: combo.rod.id,
              name: combo.rod.name,
              brand: combo.rod.brand,
              length: combo.rod.length,
              lengthUnit: combo.rod.lengthUnit,
              power: combo.rod.power,
              price: combo.rod.price,
            }
          : null,
        reel: combo.reel
          ? {
              id: combo.reel.id,
              name: combo.reel.name,
              brand: combo.reel.brand,
              model: combo.reel.model,
              gearRatioText: combo.reel.gearRatioText,
              price: combo.reel.price,
            }
          : null,
        photoUrls,
      };
    });

    const rods = rodsRaw.map((rod) => ({
      id: rod.id,
      name: rod.name,
      brand: rod.brand,
      length: rod.length,
      lengthUnit: rod.lengthUnit,
      power: rod.power,
      lureWeightMin: rod.lureWeightMin,
      lureWeightMax: rod.lureWeightMax,
      lineWeightText: rod.lineWeightText,
      price: rod.price,
      note: rod.note,
      combosCount: rod._count.combos,
      updatedAt: rod.updatedAt.toISOString(),
    }));

    const reels = reelsRaw.map((reel) => ({
      id: reel.id,
      name: reel.name,
      brand: reel.brand,
      model: reel.model,
      gearRatioText: reel.gearRatioText,
      lineCapacityText: reel.lineCapacityText,
      price: reel.price,
      note: reel.note,
      combosCount: reel._count.combos,
      updatedAt: reel.updatedAt.toISOString(),
    }));

    const rodsValue = rods.reduce((sum, rod) => sum + (rod.price ?? 0), 0);
    const reelsValue = reels.reduce((sum, reel) => sum + (reel.price ?? 0), 0);
    const totalValue = rodsValue + reelsValue;
    const totalPhotos = combos.reduce((sum, combo) => sum + (combo.photoUrls?.length ?? 0), 0);

    const tagSet = new Set<string>();
    combos.forEach((combo) => combo.sceneTags.forEach((tag) => tagSet.add(tag)));

    const timestamps = [
      ...combosRaw.map((item) => item.updatedAt.getTime()),
      ...rodsRaw.map((item) => item.updatedAt.getTime()),
      ...reelsRaw.map((item) => item.updatedAt.getTime()),
    ];
    const lastUpdatedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

    const heroComboWithPhoto = combos.find((combo) => combo.photoUrls.length > 0);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname || "匿名钓友",
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          createdAt: user.createdAt.toISOString(),
        },
        summary: {
          combosCount: combos.length,
          rodsCount: rods.length,
          reelsCount: reels.length,
          totalValue,
          rodsValue,
          reelsValue,
          totalPhotos,
          tagCount: tagSet.size,
          lastUpdatedAt,
          heroImage: heroComboWithPhoto?.photoUrls?.[0] ?? null,
          heroComboName: heroComboWithPhoto?.name ?? combos[0]?.name ?? null,
        },
        combos,
        rods,
        reels,
        highlights: {
          rodBrands: aggregateBrands(rods, (rod) => rod.brand),
          reelBrands: aggregateBrands(reels, (reel) => reel.brand),
          sceneTags: Array.from(tagSet).slice(0, 8),
          featuredCombos: combos.slice(0, 4).map((combo) => ({
            id: combo.id,
            name: combo.name,
            likeCount: combo.likeCount,
            photoUrl: combo.photoUrls[0] ?? null,
          })),
        },
      },
    });
  } catch (error) {
    console.error("获取用户装备分享数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取装备分享数据失败" },
      { status: 500 },
    );
  }
}
