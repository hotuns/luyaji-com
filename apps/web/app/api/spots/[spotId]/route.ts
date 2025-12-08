import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const nullToUndefined = <T>(val: T | null | undefined): T | undefined =>
  val === null ? undefined : val;

const updateSpotSchema = z.object({
  name: z.preprocess(nullToUndefined, z.string().min(1).max(60).optional()),
  locationName: z.preprocess(nullToUndefined, z.string().max(120).optional()),
  locationLat: z.preprocess(nullToUndefined, z.number().min(-90).max(90).optional()),
  locationLng: z.preprocess(nullToUndefined, z.number().min(-180).max(180).optional()),
  description: z.preprocess(nullToUndefined, z.string().max(600).optional()),
  visibility: z.preprocess(
    nullToUndefined,
    z.enum(["private", "friends", "public"]).optional()
  ),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const { spotId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.fishingSpot.findFirst({
      where: { id: spotId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "钓点不存在" }, { status: 404 });
    }

    const json = await request.json();
    const payload = updateSpotSchema.parse(json);

    if (payload.name) {
      ensureSafeText("钓点名称", payload.name);
    }
    if (payload.description) {
      ensureSafeText("钓点描述", payload.description);
    }

    const updated = await prisma.fishingSpot.update({
      where: { id: existing.id },
      data: {
        name: payload.name ?? existing.name,
        locationName: payload.locationName ?? existing.locationName,
        locationLat: payload.locationLat ?? existing.locationLat,
        locationLng: payload.locationLng ?? existing.locationLng,
        description: payload.description ?? existing.description,
        visibility: payload.visibility ?? existing.visibility,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新钓点失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "数据验证失败" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("包含敏感内容")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const { spotId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.fishingSpot.findFirst({
      where: { id: spotId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "钓点不存在" }, { status: 404 });
    }

    await prisma.fishingSpot.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除钓点失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
