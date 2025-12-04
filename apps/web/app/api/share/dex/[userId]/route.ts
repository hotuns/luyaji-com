import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 获取用户的公开图鉴统计（无需登录）
export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      );
    }

    // 获取所有活跃鱼种
    const allSpecies = await prisma.fishSpecies.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        habitatType: true,
      },
      orderBy: { name: "asc" },
    });

    // 获取用户已解锁的鱼种（有渔获记录的）
    const userCatches = await prisma.catch.groupBy({
      by: ["speciesId"],
      where: { userId },
      _sum: { count: true },
      _min: { caughtAt: true },
    });

    const unlockedMap = new Map(
      userCatches.map((c) => [
        c.speciesId,
        {
          totalCount: c._sum.count || 0,
          firstCaughtAt: c._min.caughtAt,
        },
      ])
    );

    // 构建图鉴数据
    const species = allSpecies.map((s) => {
      const unlockData = unlockedMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        imageUrl: s.imageUrl,
        habitatType: s.habitatType,
        isUnlocked: !!unlockData,
        totalCount: unlockData?.totalCount || 0,
        firstCaughtAt: unlockData?.firstCaughtAt?.toISOString() || null,
      };
    });

    const unlockedCount = species.filter((s) => s.isUnlocked).length;
    const totalCount = species.length;
    const totalCatches = userCatches.reduce((sum, c) => sum + (c._sum.count || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname || "匿名钓友",
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt.toISOString(),
        },
        summary: {
          unlockedCount,
          totalCount,
          completionRate: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
          totalCatches,
        },
        species: species.filter((s) => s.isUnlocked), // 只返回已解锁的鱼种
      },
    });
  } catch (error) {
    console.error("获取用户图鉴失败:", error);
    return NextResponse.json(
      { success: false, error: "获取图鉴失败" },
      { status: 500 }
    );
  }
}
