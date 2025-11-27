import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, latinName, aliasNames, habitatType, imageUrl, description, isActive } = body;

    const species = await prisma.fishSpecies.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(latinName !== undefined && { latinName }),
        ...(aliasNames !== undefined && { aliasNames }),
        ...(habitatType !== undefined && { habitatType }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: species });
  } catch (error) {
    console.error("更新鱼种失败:", error);
    return NextResponse.json(
      { success: false, error: "更新鱼种失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查是否有关联的渔获记录
    const catchCount = await prisma.catch.count({
      where: { speciesId: id },
    });

    if (catchCount > 0) {
      return NextResponse.json(
        { success: false, error: `该鱼种有 ${catchCount} 条渔获记录，无法删除` },
        { status: 400 }
      );
    }

    await prisma.fishSpecies.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除鱼种失败:", error);
    return NextResponse.json(
      { success: false, error: "删除鱼种失败" },
      { status: 500 }
    );
  }
}
