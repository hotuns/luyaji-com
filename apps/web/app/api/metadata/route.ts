import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * GET /api/metadata?category=rod_brand
 * 获取指定分类的元数据列表
 * 
 * 常用分类：
 * - rod_brand: 鱼竿品牌
 * - reel_brand: 渔轮品牌
 * - scene_tag: 场景标签
 * - fish_category: 鱼种分类
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { success: false, error: "缺少 category 参数" },
      { status: 400 }
    );
  }

  try {
    const items = await prisma.metadata.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { label: "asc" },
      ],
      select: {
        id: true,
        value: true,
        label: true,
        extra: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("获取元数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取元数据失败" },
      { status: 500 }
    );
  }
}
