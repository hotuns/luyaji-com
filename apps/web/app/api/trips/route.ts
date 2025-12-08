import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getMetadataRecord } from "@/lib/server/metadata-utils";

// 预处理：将 null 转换为 undefined
const nullToUndefined = <T>(val: T | null | undefined): T | undefined => 
  val === null ? undefined : val;

// 创建出击的请求验证
const createTripSchema = z.object({
  title: z.preprocess(nullToUndefined, z.string().max(50).optional()),
  startTime: z.string(),
  endTime: z.preprocess(nullToUndefined, z.string().optional()),
  spotId: z.string().uuid(),
  note: z.preprocess(nullToUndefined, z.string().optional()),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
  usedComboIds: z.array(z.string()).min(1),
  weather: z.preprocess(
    nullToUndefined,
    z.object({
      type: z.preprocess(nullToUndefined, z.string().optional()),
      metadataId: z.preprocess(
        nullToUndefined,
        z.union([z.string().uuid(), z.null()]).optional()
      ),
      temperatureText: z.preprocess(nullToUndefined, z.string().optional()),
      windText: z.preprocess(nullToUndefined, z.string().optional()),
    }).optional()
  ),
  catches: z.preprocess(
    nullToUndefined,
    z.array(
      z.object({
        speciesId: z.string(),
        count: z.number().min(1),
        sizeText: z.preprocess(nullToUndefined, z.string().optional()),
        comboId: z.preprocess(nullToUndefined, z.string().optional()),
        lureText: z.preprocess(nullToUndefined, z.string().optional()),
        note: z.preprocess(nullToUndefined, z.string().optional()),
        caughtAt: z.preprocess(nullToUndefined, z.string().optional()),
        photoUrls: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
      })
    ).optional()
  ),
});

// GET: 获取出击列表
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const trips = await prisma.trip.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: "desc" },
      include: {
        spot: true,
        catches: true,
        tripCombos: {
          include: { combo: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    console.error("获取出击列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

// POST: 创建新出击
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTripSchema.parse(body);

    // 敏感词校验：出击标题、备注
    if (validatedData.title) {
      ensureSafeText("出击标题", validatedData.title);
    }
    if (validatedData.note) {
      ensureSafeText("出击备注", validatedData.note);
    }

    // 渔获备注（逐条检查）
    if (validatedData.catches) {
      for (const c of validatedData.catches) {
        if (c.note) {
          ensureSafeText("渔获备注", c.note);
        }
      }
    }

    // 创建出击记录
    let weatherTypeValue =
      validatedData.weather?.type?.trim() || undefined;
    let weatherMetadataId: string | null | undefined = undefined;
    if (validatedData.weather?.metadataId) {
      const record = await getMetadataRecord(
        validatedData.weather.metadataId,
        "weather_type"
      );
      if (!record) {
        return NextResponse.json(
          { success: false, error: "所选天气类型已失效，请刷新后重试" },
          { status: 400 }
        );
      }
      weatherMetadataId = record.id;
      weatherTypeValue = record.label || record.value || undefined;
    } else if (validatedData.weather?.metadataId === null) {
      weatherMetadataId = null;
    }

    const spot = await prisma.fishingSpot.findFirst({
      where: { id: validatedData.spotId, userId: session.user.id },
    });
    if (!spot) {
      return NextResponse.json(
        { success: false, error: "钓点已失效，请刷新后重试" },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        note: validatedData.note,
        visibility: validatedData.visibility || "private",
        spotId: spot.id,
        weatherType: weatherTypeValue,
        weatherMetadataId,
        weatherTemperatureText: validatedData.weather?.temperatureText,
        weatherWindText: validatedData.weather?.windText,
        totalCatchCount: validatedData.catches?.reduce((sum, c) => sum + c.count, 0) || 0,
        fishSpeciesCount: new Set(validatedData.catches?.map((c) => c.speciesId)).size,
        // 创建组合关联
        tripCombos: {
          create: validatedData.usedComboIds.map((comboId) => ({
            comboId,
          })),
        },
      },
    });

    // 创建渔获记录
    if (validatedData.catches && validatedData.catches.length > 0) {
      // 获取鱼种名称
      const speciesIds = validatedData.catches.map((c) => c.speciesId);
      const speciesList = await prisma.fishSpecies.findMany({
        where: { id: { in: speciesIds } },
      });
      const speciesMap = new Map(speciesList.map((s) => [s.id, s.name]));

      const userId = session.user.id;
      await prisma.catch.createMany({
        data: validatedData.catches.map((c) => ({
          tripId: trip.id,
          userId: userId,
          speciesId: c.speciesId,
          speciesName: speciesMap.get(c.speciesId) || "未知",
          count: c.count,
          sizeText: c.sizeText,
          caughtAt: c.caughtAt ? new Date(c.caughtAt) : null,
          comboId: c.comboId,
          lureText: c.lureText,
          note: c.note,
          photoUrls: c.photoUrls && c.photoUrls.length > 0 ? c.photoUrls : undefined,
        })),
      });
    }

    return NextResponse.json(
      { success: true, data: { id: trip.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建出击失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "数据验证失败", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "创建失败" },
      { status: 500 }
    );
  }
}
