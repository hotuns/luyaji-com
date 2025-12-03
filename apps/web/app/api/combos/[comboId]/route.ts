import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateComboSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  rodId: z.string().optional(),
  reelId: z.string().optional(),
  mainLineText: z.string().optional(),
  leaderLineText: z.string().optional(),
  hookText: z.string().optional(),
  lures: z.array(z.any()).optional(),
  sceneTags: z.array(z.string()).optional(),
  detailNote: z.string().optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

// 公共：获取单个组合详情（含竿/轮/线/钩信息）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  try {
    const { comboId } = await params;

    const combo = await prisma.combo.findFirst({
      where: {
        id: comboId,
        visibility: "public",
      },
      include: {
        rod: true,
        reel: true,
      },
    });

    if (!combo) {
      return NextResponse.json(
        { success: false, error: "组合不存在或未公开" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: combo.id,
        name: combo.name,
        visibility: combo.visibility,
        detailNote: combo.detailNote,
        mainLineText: combo.mainLineText,
        leaderLineText: combo.leaderLineText,
        hookText: combo.hookText,
        lures: combo.lures,
        sceneTags: combo.sceneTags,
        photoUrls: combo.photoUrls,
        likeCount: combo.likeCount,
        createdAt: combo.createdAt,
        updatedAt: combo.updatedAt,
        rod: {
          id: combo.rod.id,
          name: combo.rod.name,
          brand: combo.rod.brand,
          length: combo.rod.length,
          lengthUnit: combo.rod.lengthUnit,
          power: combo.rod.power,
          lureWeightMin: combo.rod.lureWeightMin,
          lureWeightMax: combo.rod.lureWeightMax,
          lineWeightText: combo.rod.lineWeightText,
          note: combo.rod.note,
        },
        reel: {
          id: combo.reel.id,
          name: combo.reel.name,
          brand: combo.reel.brand,
          model: combo.reel.model,
          gearRatioText: combo.reel.gearRatioText,
          lineCapacityText: combo.reel.lineCapacityText,
          note: combo.reel.note,
        },
      },
    });
  } catch (error) {
    console.error("获取组合详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> }
) {
  try {
    const { comboId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const json = await request.json();
    const payload = updateComboSchema.parse(json);

    const existing = await prisma.combo.findFirst({
      where: { id: comboId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "组合不存在" }, { status: 404 });
    }

    const combo = await prisma.combo.update({
      where: { id: existing.id },
      data: payload,
      include: {
        rod: { select: { id: true, name: true } },
        reel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: combo });
  } catch (error) {
    console.error("更新组合失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "数据验证失败" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> }
) {
  try {
    const { comboId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.combo.findFirst({
      where: { id: comboId, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "组合不存在" }, { status: 404 });
    }

    const tripCount = await prisma.tripCombo.count({
      where: { comboId: existing.id, trip: { userId: session.user.id } },
    });

    if (tripCount > 0) {
      return NextResponse.json(
        { success: false, error: "该组合已有出击记录，无法删除" },
        { status: 400 }
      );
    }

    await prisma.combo.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除组合失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
