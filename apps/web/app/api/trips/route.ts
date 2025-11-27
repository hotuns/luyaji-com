import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 创建出击的请求验证
const createTripSchema = z.object({
  title: z.string().max(50).optional(),
  startTime: z.string(),
  locationName: z.string().min(1).max(100),
  note: z.string().optional(),
  usedComboIds: z.array(z.string()).min(1),
  weather: z
    .object({
      type: z.string().optional(),
      temperatureText: z.string().optional(),
      windText: z.string().optional(),
    })
    .optional(),
  catches: z
    .array(
      z.object({
        speciesId: z.string(),
        count: z.number().min(1),
        sizeText: z.string().optional(),
        comboId: z.string().optional(),
        lureText: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .optional(),
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

    // 创建出击记录
    const trip = await prisma.trip.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        startTime: new Date(validatedData.startTime),
        locationName: validatedData.locationName,
        note: validatedData.note,
        weatherType: validatedData.weather?.type,
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
          comboId: c.comboId,
          lureText: c.lureText,
          note: c.note,
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
