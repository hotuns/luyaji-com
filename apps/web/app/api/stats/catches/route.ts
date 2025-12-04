import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const speciesId = searchParams.get("speciesId");

    if (!speciesId) {
      return NextResponse.json(
        { success: false, error: "缺少必需的查询参数 speciesId" },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    const [aggregates, catches] = await Promise.all([
      prisma.catch.aggregate({
        where: { userId, speciesId },
        _sum: { count: true },
        _min: { caughtAt: true },
        _max: { caughtAt: true },
      }),
      prisma.catch.findMany({
        where: { userId, speciesId },
        orderBy: { caughtAt: "desc" },
        select: {
          id: true,
          tripId: true,
          count: true,
          sizeText: true,
          weightText: true,
          caughtAt: true,
          speciesName: true,
          trip: {
            select: {
              title: true,
              locationName: true,
            },
          },
        },
      }),
    ]);

    const totalCount = aggregates._sum.count ?? 0;
    const firstCaughtAt = aggregates._min.caughtAt ?? null;
    const lastCaughtAt = aggregates._max.caughtAt ?? null;

    const first = catches[0];

    const payload = {
      speciesId,
      speciesName: first?.speciesName ?? "",
      totalCount,
      firstCaughtAt: firstCaughtAt ? firstCaughtAt.toISOString() : null,
      lastCaughtAt: lastCaughtAt ? lastCaughtAt.toISOString() : null,
      catches: catches.map((item) => ({
        id: item.id,
        tripId: item.tripId,
        tripTitle: item.trip?.title ?? null,
        locationName: item.trip?.locationName ?? "未知地点",
        caughtAt: item.caughtAt ? item.caughtAt.toISOString() : null,
        count: item.count,
        sizeText: item.sizeText,
        weightText: item.weightText,
      })),
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("获取渔获统计失败", error);
    return NextResponse.json(
      { success: false, error: "获取渔获统计失败，请稍后重试" },
      { status: 500 },
    );
  }
}
