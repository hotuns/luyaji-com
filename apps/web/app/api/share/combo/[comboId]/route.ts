import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 获取公开的组合详情（无需登录）
export async function GET(
  _request: Request,
  context: { params: Promise<{ comboId: string }> }
) {
  try {
    const { comboId } = await context.params;

    const combo = await prisma.combo.findUnique({
      where: { id: comboId },
      include: {
        rod: {
          select: {
            id: true,
            name: true,
            brand: true,
            length: true,
            lengthUnit: true,
            power: true,
            lureWeightMin: true,
            lureWeightMax: true,
            lineWeightText: true,
          },
        },
        reel: {
          select: {
            id: true,
            name: true,
            brand: true,
            model: true,
            gearRatioText: true,
            lineCapacityText: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            catches: true,
          },
        },
      },
    });

    // 不存在或不是公开的组合
    if (!combo || combo.visibility !== "public") {
      return NextResponse.json(
        { success: false, error: "组合不存在或未公开" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: combo.id,
        name: combo.name,
        visibility: combo.visibility,
        mainLineText: combo.mainLineText,
        leaderLineText: combo.leaderLineText,
        hookText: combo.hookText,
        lures: combo.lures,
        sceneTags: combo.sceneTags,
        detailNote: combo.detailNote,
        photoUrls: Array.isArray(combo.photoUrls) ? combo.photoUrls : null,
        likeCount: combo.likeCount ?? 0,
        catchCount: combo._count.catches,
        createdAt: combo.createdAt.toISOString(),
        updatedAt: combo.updatedAt.toISOString(),
        rod: combo.rod,
        reel: combo.reel,
        user: {
          id: combo.user.id,
          nickname: combo.user.nickname || "匿名钓友",
          avatarUrl: combo.user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("获取公开组合详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取组合详情失败" },
      { status: 500 }
    );
  }
}
