import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const nullToUndefined = <T>(val: T | null | undefined): T | undefined =>
  val === null ? undefined : val;

const spotBaseSchema = {
  name: z.string().min(1, "请输入钓点名称").max(60, "名称过长"),
  locationName: z.preprocess(nullToUndefined, z.string().max(120).optional()),
  locationLat: z.preprocess(
    nullToUndefined,
    z.number().min(-90).max(90).optional()
  ),
  locationLng: z.preprocess(
    nullToUndefined,
    z.number().min(-180).max(180).optional()
  ),
  description: z.preprocess(nullToUndefined, z.string().max(600).optional()),
  visibility: z.preprocess(
    nullToUndefined,
    z.enum(["private", "friends", "public"]).optional()
  ),
};

const createSpotSchema = z.object(spotBaseSchema);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const spots = await prisma.fishingSpot.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: spots });
  } catch (error) {
    console.error("获取钓点失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const json = await request.json();
    const payload = createSpotSchema.parse(json);

    ensureSafeText("钓点名称", payload.name);
    if (payload.description) {
      ensureSafeText("钓点描述", payload.description);
    }

    const spot = await prisma.fishingSpot.create({
      data: {
        userId: session.user.id,
        name: payload.name,
        locationName: payload.locationName,
        locationLat: payload.locationLat,
        locationLng: payload.locationLng,
        description: payload.description,
        visibility: payload.visibility ?? "private",
      },
    });

    return NextResponse.json({ success: true, data: spot }, { status: 201 });
  } catch (error) {
    console.error("创建钓点失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "数据验证失败" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("包含敏感内容")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
