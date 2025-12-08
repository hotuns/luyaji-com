import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
        spot: {
          locationLat: { not: null },
          locationLng: { not: null },
        },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        totalCatchCount: true,
        fishSpeciesCount: true,
        spot: {
          select: {
            name: true,
            locationName: true,
            locationLat: true,
            locationLng: true,
            visibility: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: trips.map((trip) => ({
        id: trip.id,
        title: trip.title,
        locationName: trip.spot?.name || trip.spot?.locationName || "未关联钓点",
        lat: trip.spot?.locationLat ?? null,
        lng: trip.spot?.locationLng ?? null,
        startTime: trip.startTime.toISOString(),
        totalCatchCount: trip.totalCatchCount || 0,
        fishSpeciesCount: trip.fishSpeciesCount || 0,
      })),
    });
  } catch (error) {
    console.error("获取钓点地图数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取钓点失败，请稍后重试" },
      { status: 500 },
    );
  }
}
