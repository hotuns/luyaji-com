import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: 获取首页统计数据
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 并行获取所有统计数据
    const [tripCount, catchCount, speciesCount, recentTrips, totalSpecies] = await Promise.all([
      prisma.trip.count({ where: { userId } }),
      prisma.catch.aggregate({
        where: { userId },
        _sum: { count: true },
      }),
      prisma.catch.groupBy({
        by: ["speciesId"],
        where: { userId },
      }),
      prisma.trip.findMany({
        where: { userId },
        orderBy: { startTime: "desc" },
        take: 3,
        include: {
          catches: {
            select: {
              count: true,
              speciesName: true,
            },
          },
        },
      }),
      prisma.fishSpecies.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tripCount,
        catchCount: catchCount._sum.count || 0,
        speciesCount: speciesCount.length,
        totalSpecies,
        recentTrips: recentTrips.map((trip) => ({
          id: trip.id,
          title: trip.title,
          locationName: trip.locationName,
          startTime: trip.startTime.toISOString(),
          catches: trip.catches,
        })),
      },
    });
  } catch (error) {
    console.error("获取首页统计失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}
