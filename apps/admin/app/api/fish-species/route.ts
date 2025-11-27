import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const species = await prisma.fishSpecies.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: species });
  } catch (error) {
    console.error("获取鱼种列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取鱼种列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, latinName, aliasNames, habitatType, imageUrl, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "鱼种名称不能为空" },
        { status: 400 }
      );
    }

    const species = await prisma.fishSpecies.create({
      data: {
        name,
        latinName,
        aliasNames,
        habitatType,
        imageUrl,
        description,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: species });
  } catch (error) {
    console.error("创建鱼种失败:", error);
    return NextResponse.json(
      { success: false, error: "创建鱼种失败" },
      { status: 500 }
    );
  }
}
