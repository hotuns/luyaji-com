import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET: 获取鱼种列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const species = await prisma.fishSpecies.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              name: {
                contains: search,
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: species });
  } catch (error) {
    console.error("获取鱼种列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}
