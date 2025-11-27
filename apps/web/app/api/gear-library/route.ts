import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const keyword = searchParams.get("q")?.trim();
  const limitParam = Number(searchParams.get("limit"));
  const take = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : 20;

  if (type !== "rod" && type !== "reel") {
    return NextResponse.json({ success: false, error: "无效的 type 参数" }, { status: 400 });
  }

  if (type === "rod") {
    const rods = await prisma.rod.findMany({
      where: {
        visibility: "public",
        userId: { not: userId },
        ...(keyword
          ? {
              OR: [
                { name: { contains: keyword } },
                { brand: { contains: keyword } },
                { power: { contains: keyword } },
                { note: { contains: keyword } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take,
      include: {
        user: { select: { nickname: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: rods.map((rod) => ({
        id: rod.id,
        name: rod.name,
        brand: rod.brand,
        length: rod.length,
        lengthUnit: rod.lengthUnit,
        power: rod.power,
        lureWeightMin: rod.lureWeightMin,
        lureWeightMax: rod.lureWeightMax,
        lineWeightText: rod.lineWeightText,
        note: rod.note,
        updatedAt: rod.updatedAt,
        ownerName: rod.user?.nickname || maskPhone(rod.user?.phone),
      })),
    });
  }

  const reels = await prisma.reel.findMany({
    where: {
      visibility: "public",
      userId: { not: userId },
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { brand: { contains: keyword } },
              { model: { contains: keyword } },
              { gearRatioText: { contains: keyword } },
              { note: { contains: keyword } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      user: { select: { nickname: true, phone: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: reels.map((reel) => ({
      id: reel.id,
      name: reel.name,
      brand: reel.brand,
      model: reel.model,
      gearRatioText: reel.gearRatioText,
      lineCapacityText: reel.lineCapacityText,
      note: reel.note,
      updatedAt: reel.updatedAt,
      ownerName: reel.user?.nickname || maskPhone(reel.user?.phone),
    })),
  });
}

function maskPhone(phone?: string | null) {
  if (!phone) return "匿名钓友";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
