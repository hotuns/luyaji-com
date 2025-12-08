import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 获取公开的出击记录详情（无需登录）
export async function GET(
  _request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        spot: {
          select: {
            id: true,
            name: true,
            locationName: true,
            locationLat: true,
            locationLng: true,
            visibility: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        tripCombos: {
          include: {
            combo: {
              include: {
                rod: { select: { id: true, name: true, brand: true } },
                reel: { select: { id: true, name: true, brand: true } },
              },
            },
          },
        },
        catches: {
          orderBy: { caughtAt: "desc" },
          include: {
            species: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // 不存在或不是公开的出击记录
    if (!trip || trip.visibility !== "public") {
      return NextResponse.json(
        { success: false, error: "出击记录不存在或未公开" },
        { status: 404 }
      );
    }

    const spotVisible = !trip.spot || trip.spot.visibility === "public";
    const baseSpotName = trip.spot?.name || "未关联钓点";
    const baseLocationName = trip.spot?.locationName || baseSpotName;
    const baseLat = trip.spot?.locationLat ?? null;
    const baseLng = trip.spot?.locationLng ?? null;
    const safeSpotName = spotVisible ? baseSpotName : "神秘钓点";
    const safeLocationName = spotVisible ? baseLocationName : "钓点保密";

    return NextResponse.json({
      success: true,
      data: {
        id: trip.id,
        title: trip.title,
        visibility: trip.visibility,
        startTime: trip.startTime.toISOString(),
        endTime: trip.endTime?.toISOString() || null,
        locationName: safeLocationName,
        locationLat: spotVisible ? baseLat : null,
        locationLng: spotVisible ? baseLng : null,
        note: trip.note,
        weatherType: trip.weatherType,
        weatherTemperatureText: trip.weatherTemperatureText,
        weatherWindText: trip.weatherWindText,
        totalCatchCount: trip.totalCatchCount || 0,
        fishSpeciesCount: trip.fishSpeciesCount || 0,
        createdAt: trip.createdAt.toISOString(),
        spotName: safeSpotName,
        spotVisibility: trip.spot?.visibility || null,
        user: {
          id: trip.user.id,
          nickname: trip.user.nickname || "匿名钓友",
          avatarUrl: trip.user.avatarUrl,
        },
        combos: trip.tripCombos.map((tc) => ({
          id: tc.combo.id,
          name: tc.combo.name,
          note: tc.note,
          rod: tc.combo.rod,
          reel: tc.combo.reel,
          mainLineText: tc.combo.mainLineText,
          leaderLineText: tc.combo.leaderLineText,
          hookText: tc.combo.hookText,
          detailNote: tc.combo.detailNote,
        })),
        catches: trip.catches.map((c) => ({
          id: c.id,
          speciesId: c.speciesId,
          speciesName: c.speciesName,
          speciesImageUrl: c.species?.imageUrl || null,
          count: c.count,
          sizeText: c.sizeText,
          weightText: c.weightText,
          caughtAt: c.caughtAt?.toISOString() || null,
          lureText: c.lureText,
          note: c.note,
          photoUrls: Array.isArray(c.photoUrls) ? c.photoUrls : null,
        })),
      },
    });
  } catch (error) {
    console.error("获取公开出击记录详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取出击记录失败" },
      { status: 500 }
    );
  }
}
