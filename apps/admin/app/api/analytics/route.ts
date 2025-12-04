import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser, AdminAuthError } from "@/lib/admin-auth";

// GET /api/analytics - 获取统计数据
export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
    }
    throw e;
  }

  const searchParams = req.nextUrl.searchParams;
  const range = searchParams.get("range") || "7d"; // 7d | 30d | 90d

  // 计算日期范围
  const now = new Date();
  const startDate = new Date();
  switch (range) {
    case "30d":
      startDate.setDate(now.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }
  startDate.setHours(0, 0, 0, 0);

  try {
    // 并行获取各项数据
    const [
      // 总 PV
      totalPV,
      // 总 UV
      totalUVResult,
      // 总用户数
      totalUsers,
      // 新增用户数
      newUsers,
      // 今日 PV
      todayPV,
      // 今日 UV
      todayUVResult,
      // 今日活跃用户
      todayActiveUsers,
      // 按天统计的 PV/UV
      dailyPVStats,
      // 设备分布
      deviceStats,
      // 浏览器分布
      browserStats,
      // 热门页面
      topPages,
      // 总出击数
      totalTrips,
      // 总渔获数
      totalCatches,
      // 总组合数
      totalCombos,
    ] = await Promise.all([
      // 总 PV
      prisma.pageView.count({
        where: { createdAt: { gte: startDate } },
      }),
      // 总 UV
      prisma.pageView.groupBy({
        by: ["visitorId"],
        where: { createdAt: { gte: startDate } },
      }),
      // 总用户数
      prisma.user.count(),
      // 新增用户数
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      // 今日 PV
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
      // 今日 UV
      prisma.pageView.groupBy({
        by: ["visitorId"],
        where: {
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
      // 今日活跃用户
      prisma.userActivity.count({
        where: {
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      }),
      // 按天统计
      prisma.$queryRaw<{ date: string; pv: bigint; uv: bigint }[]>`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as pv,
          COUNT(DISTINCT visitorId) as uv
        FROM page_views
        WHERE createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
      // 设备分布
      prisma.pageView.groupBy({
        by: ["device"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      // 浏览器分布
      prisma.pageView.groupBy({
        by: ["browser"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      // 热门页面
      prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      // 总出击数
      prisma.trip.count({
        where: { createdAt: { gte: startDate } },
      }),
      // 总渔获数
      prisma.catch.count({
        where: { createdAt: { gte: startDate } },
      }),
      // 总组合数
      prisma.combo.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    // 计算留存率（简化版：7日留存）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const retentionData = await prisma.$queryRaw<{ retention_rate: number }[]>`
      SELECT 
        ROUND(
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM user_activities ua2 
              WHERE ua2.userId = ua1.userId 
              AND ua2.date >= ${sevenDaysAgo}
            ) THEN ua1.userId 
          END) * 100.0 / NULLIF(COUNT(DISTINCT ua1.userId), 0), 
          2
        ) as retention_rate
      FROM user_activities ua1
      WHERE ua1.date >= ${startDate} AND ua1.date < ${sevenDaysAgo}
    `;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPV,
          totalUV: totalUVResult.length,
          totalUsers,
          newUsers,
          todayPV,
          todayUV: todayUVResult.length,
          todayActiveUsers,
          retentionRate: retentionData[0]?.retention_rate || 0,
        },
        business: {
          totalTrips,
          totalCatches,
          totalCombos,
        },
        charts: {
          daily: dailyPVStats.map((d) => ({
            date: d.date,
            pv: Number(d.pv),
            uv: Number(d.uv),
          })),
          devices: deviceStats.map((d) => ({
            name: d.device || "未知",
            value: d._count,
          })),
          browsers: browserStats.map((b) => ({
            name: b.browser || "未知",
            value: b._count,
          })),
          topPages: topPages.map((p) => ({
            path: p.path,
            views: p._count,
          })),
        },
      },
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
