import { prisma } from "@/lib/prisma";

export type ProfileOverview = {
  user: {
    id: string;
    nickname: string | null;
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
  stats: {
    tripCount: number;
    totalCatch: number;
    speciesCount: number;
    comboCount: number;
    rodCount: number;
    reelCount: number;
    gearCount: number;
  };
  recentTrip: {
    id: string;
    title: string | null;
    spotName: string;
    spotLocationName: string | null;
    startTime: Date;
    totalCatchCount: number;
  } | null;
};

/**
 * 聚合用户概览数据：基础资料 + 统计指标 + 最近一次出击
 */
export async function getProfileOverview(userId: string): Promise<ProfileOverview> {
  const [user, tripCount, catchAggregate, speciesGroups, comboCount, rodCount, reelCount, recentTrip] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          phone: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
        },
      }),
      prisma.trip.count({ where: { userId } }),
      prisma.catch.aggregate({
        where: { userId },
        _sum: { count: true },
      }),
      prisma.catch.groupBy({
        by: ["speciesId"],
        where: { userId },
      }),
      prisma.combo.count({ where: { userId } }),
      prisma.rod.count({ where: { userId } }),
      prisma.reel.count({ where: { userId } }),
      prisma.trip.findFirst({
        where: { userId },
        orderBy: { startTime: "desc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          totalCatchCount: true,
          spot: { select: { name: true, locationName: true } },
          catches: { select: { count: true } },
        },
      }),
    ]);

  if (!user) {
    throw new Error("用户不存在");
  }

  const normalizedRecentTrip = recentTrip
    ? {
        id: recentTrip.id,
        title: recentTrip.title,
        spotName: recentTrip.spot?.name || "未设置钓点",
        spotLocationName: recentTrip.spot?.locationName || null,
        startTime: recentTrip.startTime,
        totalCatchCount:
          recentTrip.totalCatchCount ??
          recentTrip.catches.reduce((sum, item) => sum + item.count, 0),
      }
    : null;

  return {
    user,
    stats: {
      tripCount,
      totalCatch: catchAggregate._sum.count ?? 0,
      speciesCount: speciesGroups.length,
      comboCount,
      rodCount,
      reelCount,
      gearCount: rodCount + reelCount,
    },
    recentTrip: normalizedRecentTrip,
  };
}
