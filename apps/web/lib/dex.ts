import { prisma } from "@/lib/prisma";

export type FishDexEntry = {
  id: string;
  name: string;
  aliasNames: string[];
  habitatType: string | null;
  imageUrl: string | null;
  description: string | null;
  unlocked: boolean;
  totalCount: number;
  firstCaughtAt: string | null;
  lastCaughtAt: string | null;
};

export type FishDexPayload = {
  summary: {
    totalSpecies: number;
    unlockedSpecies: number;
    totalCatch: number;
  };
  species: FishDexEntry[];
};

/**
 * 聚合当前用户的图鉴数据，包括所有鱼种以及解锁情况。
 */
export async function getFishDex(userId: string): Promise<FishDexPayload> {
  const [speciesList, catchGroups] = await Promise.all([
    prisma.fishSpecies.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        aliasNames: true,
        habitatType: true,
        imageUrl: true,
        description: true,
      },
    }),
    prisma.catch.groupBy({
      by: ["speciesId"],
      where: { userId },
      _sum: { count: true },
      _min: { caughtAt: true },
      _max: { caughtAt: true },
    }),
  ]);

  const statsMap = new Map(
    catchGroups.map((group) => [
      group.speciesId,
      {
        totalCount: group._sum.count ?? 0,
        firstCaughtAt: group._min.caughtAt ?? null,
        lastCaughtAt: group._max.caughtAt ?? null,
      },
    ])
  );

  let unlockedSpecies = 0;
  let totalCatch = 0;

  const entries: FishDexEntry[] = speciesList.map((species) => {
    const stats = statsMap.get(species.id);
    if (stats) {
      unlockedSpecies += 1;
      totalCatch += stats.totalCount;
    }
    return {
      id: species.id,
      name: species.name,
      aliasNames: parseAliasNames(species.aliasNames),
      habitatType: species.habitatType,
      imageUrl: species.imageUrl,
      description: species.description,
      unlocked: Boolean(stats),
      totalCount: stats?.totalCount ?? 0,
      firstCaughtAt: stats?.firstCaughtAt ? stats.firstCaughtAt.toISOString() : null,
      lastCaughtAt: stats?.lastCaughtAt ? stats.lastCaughtAt.toISOString() : null,
    };
  });

  return {
    summary: {
      totalSpecies: speciesList.length,
      unlockedSpecies,
      totalCatch,
    },
    species: entries,
  };
}

function parseAliasNames(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      // ignore json parse errors
    }
  }
  return [];
}
