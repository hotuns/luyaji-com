import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 50;

export async function GET(request: Request) {
    console.log("ENV DATABASE_URL:", process.env.DATABASE_URL);

    
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const keyword = searchParams.get("q")?.trim();
  const limitRaw = searchParams.get("limit");
  const pageRaw = searchParams.get("page");

  const limitParam = limitRaw ? Number(limitRaw) : NaN;
  const pageParam = pageRaw ? Number(pageRaw) : 1;

  const take = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
    : MAX_LIMIT;

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const skip = (page - 1) * take;

  if (type !== "rod" && type !== "reel" && type !== "combo") {
    return NextResponse.json({ success: false, error: "无效的 type 参数" }, { status: 400 });
  }

  if (type === "rod") {
    const total = await prisma.rod.count({
      where: {
        visibility: "public",
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
    });

    const rods = await prisma.rod.findMany({
      where: {
        visibility: "public",
        // 不再排除当前用户，方便运营账号检查公共库中所有内容
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
      skip,
      include: {
        user: { select: { nickname: true, phone: true } },
      },
    });

        console.log("gear-library rods count:", rods.length);


    return NextResponse.json({
      success: true,
      total,
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

  if (type === "reel") {
  const total = await prisma.reel.count({
    where: {
      visibility: "public",
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
  });

  const reels = await prisma.reel.findMany({
    where: {
      visibility: "public",
      // 同上，不再排除当前用户
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
    skip,
    include: {
      user: { select: { nickname: true, phone: true } },
    },
  });

  return NextResponse.json({
    success: true,
    total,
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

  // combo 公共库
  const total = await prisma.combo.count({
    where: {
      visibility: "public",
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { mainLineText: { contains: keyword } },
              { leaderLineText: { contains: keyword } },
              { hookText: { contains: keyword } },
              { detailNote: { contains: keyword } },
            ],
          }
        : {}),
    },
  });

  const combos = await prisma.combo.findMany({
    where: {
      visibility: "public",
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { mainLineText: { contains: keyword } },
              { leaderLineText: { contains: keyword } },
              { hookText: { contains: keyword } },
              { detailNote: { contains: keyword } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take,
    skip,
    include: {
      user: { select: { nickname: true, phone: true } },
    },
  });

  return NextResponse.json({
    success: true,
    total,
    data: combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      mainLineText: combo.mainLineText,
      leaderLineText: combo.leaderLineText,
      hookText: combo.hookText,
      detailNote: combo.detailNote,
      photoUrls: (combo.photoUrls as string[] | null) ?? null,
      updatedAt: combo.updatedAt,
      ownerName: combo.user?.nickname || maskPhone(combo.user?.phone),
    })),
  });
}

function maskPhone(phone?: string | null) {
  if (!phone) return "匿名钓友";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
