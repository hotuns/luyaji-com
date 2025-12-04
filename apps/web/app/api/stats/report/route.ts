import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/stats/report - 获取用户钓鱼统计报告
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // all | year | 3months | month

    // 计算时间范围
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    // 并行获取各项统计数据
    const [
      // 基础统计
      tripCount,
      catchAggregate,
      speciesCount,
      
      // 鱼种排行（Top 10）
      topSpecies,
      
      // 地点排行（Top 10）
      topLocations,
      
      // 装备使用统计
      comboUsage,
      
      // 天气分布
      weatherDistribution,
      
      // 按月统计趋势
      monthlyTrends,
      
      // 成功率（有渔获的出击比例）
      successTrips,
      
      // 最佳单次渔获
      bestTrip,
      
      // 最大单条渔获
      biggestCatch,
    ] = await Promise.all([
      // 出击总数
      prisma.trip.count({
        where: { userId, startTime: dateFilter },
      }),
      
      // 渔获聚合
      prisma.catch.aggregate({
        where: { userId, caughtAt: dateFilter },
        _sum: { count: true },
      }),
      
      // 解锁鱼种数
      prisma.catch.groupBy({
        by: ["speciesId"],
        where: { userId, caughtAt: dateFilter },
      }).then(res => res.length),
      
      // 鱼种排行
      prisma.catch.groupBy({
        by: ["speciesId", "speciesName"],
        where: { userId, caughtAt: dateFilter },
        _sum: { count: true },
        orderBy: { _sum: { count: "desc" } },
        take: 10,
      }),
      
      // 地点排行
      prisma.trip.groupBy({
        by: ["locationName"],
        where: { userId, startTime: dateFilter },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      
      // 装备使用统计
      prisma.catch.groupBy({
        by: ["comboId"],
        where: { 
          userId, 
          caughtAt: dateFilter,
          comboId: { not: null },
        },
        _sum: { count: true },
      }).then(async (groups) => {
        const comboIds = groups.map(g => g.comboId!).filter(Boolean);
        if (comboIds.length === 0) return [];
        
        const combos = await prisma.combo.findMany({
          where: { id: { in: comboIds } },
          select: { id: true, name: true },
        });
        
        const comboMap = new Map(combos.map(c => [c.id, c.name]));
        
        return groups
          .map(g => ({
            comboId: g.comboId,
            comboName: comboMap.get(g.comboId!) || "未知组合",
            catchCount: g._sum.count || 0,
          }))
          .sort((a, b) => b.catchCount - a.catchCount)
          .slice(0, 10);
      }),
      
      // 天气分布
      prisma.trip.groupBy({
        by: ["weatherType"],
        where: { 
          userId, 
          startTime: dateFilter,
          weatherType: { not: null },
        },
        _count: { id: true },
      }),
      
      // 按月统计 - 使用 Prisma 查询代替 raw SQL
      (async () => {
        const trips = await prisma.trip.findMany({
          where: { userId, startTime: dateFilter },
          select: {
            id: true,
            startTime: true,
            catches: {
              select: { count: true },
            },
          },
        });
        
        // 按月聚合
        const monthMap = new Map<string, { trips: number; catches: number }>();
        
        for (const trip of trips) {
          const month = trip.startTime.toISOString().slice(0, 7); // YYYY-MM
          const existing = monthMap.get(month) || { trips: 0, catches: 0 };
          existing.trips += 1;
          existing.catches += trip.catches.reduce((sum, c) => sum + c.count, 0);
          monthMap.set(month, existing);
        }
        
        // 转换为数组并排序
        return Array.from(monthMap.entries())
          .map(([month, data]) => ({ month, trips: data.trips, catches: data.catches }))
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, 12);
      })(),
      
      // 成功出击数（有渔获的）
      prisma.trip.count({
        where: {
          userId,
          startTime: dateFilter,
          catches: { some: {} },
        },
      }),
      
      // 最佳单次出击
      prisma.trip.findFirst({
        where: { userId, startTime: dateFilter },
        orderBy: { totalCatchCount: "desc" },
        select: {
          id: true,
          title: true,
          locationName: true,
          startTime: true,
          totalCatchCount: true,
        },
      }),
      
      // 最大单条渔获（按 sizeText 排序，简化处理）
      prisma.catch.findFirst({
        where: { 
          userId, 
          caughtAt: dateFilter,
          sizeText: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          speciesName: true,
          sizeText: true,
          weightText: true,
          caughtAt: true,
          trip: {
            select: { id: true, title: true, locationName: true },
          },
        },
        take: 1,
      }),
    ]);

    // 计算成功率
    const successRate = tripCount > 0 ? Math.round((successTrips / tripCount) * 100) : 0;
    
    // 计算平均每次出击渔获
    const totalCatch = catchAggregate._sum.count || 0;
    const avgCatchPerTrip = tripCount > 0 ? (totalCatch / tripCount).toFixed(1) : "0";

    // 月度趋势已经是正确格式，反转为从早到晚
    const formattedMonthlyTrends = [...monthlyTrends].reverse();

    // 天气映射
    const weatherMap: Record<string, string> = {
      sunny: "晴天",
      cloudy: "多云",
      overcast: "阴天",
      rainy: "雨天",
      windy: "大风",
      foggy: "雾天",
    };

    const payload = {
      period,
      periodLabel: period === "all" ? "全部时间" : 
                   period === "year" ? "今年" : 
                   period === "3months" ? "近3个月" : "本月",
      
      // 概览数据
      overview: {
        tripCount,
        totalCatch,
        speciesCount,
        successRate,
        avgCatchPerTrip,
      },
      
      // 排行榜
      rankings: {
        // 鱼种排行
        topSpecies: topSpecies.map(s => ({
          speciesId: s.speciesId,
          speciesName: s.speciesName,
          count: s._sum.count || 0,
        })),
        
        // 地点排行
        topLocations: topLocations.map(l => ({
          locationName: l.locationName,
          tripCount: l._count.id,
        })),
        
        // 装备排行
        topCombos: comboUsage,
      },
      
      // 天气分布
      weatherDistribution: weatherDistribution.map(w => ({
        weatherType: w.weatherType,
        weatherLabel: weatherMap[w.weatherType || ""] || w.weatherType || "未知",
        tripCount: w._count.id,
      })),
      
      // 月度趋势
      monthlyTrends: formattedMonthlyTrends,
      
      // 亮点
      highlights: {
        bestTrip: bestTrip ? {
          id: bestTrip.id,
          title: bestTrip.title || "未命名出击",
          locationName: bestTrip.locationName,
          startTime: bestTrip.startTime.toISOString(),
          catchCount: bestTrip.totalCatchCount,
        } : null,
        
        biggestCatch: biggestCatch ? {
          speciesName: biggestCatch.speciesName,
          sizeText: biggestCatch.sizeText,
          weightText: biggestCatch.weightText,
          caughtAt: biggestCatch.caughtAt?.toISOString() || null,
          tripId: biggestCatch.trip?.id,
          tripTitle: biggestCatch.trip?.title || "未命名出击",
        } : null,
      },
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("获取统计报告失败:", error);
    return NextResponse.json(
      { success: false, error: "获取统计报告失败，请稍后重试" },
      { status: 500 }
    );
  }
}
