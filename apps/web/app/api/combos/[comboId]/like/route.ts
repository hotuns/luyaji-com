import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST: 点赞组合
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  try {
    const { comboId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const combo = await prisma.combo.findFirst({
      where: { id: comboId, visibility: "public" },
      select: { id: true },
    });

    if (!combo) {
      return NextResponse.json({ success: false, error: "组合不存在或不可见" }, { status: 404 });
    }

    // 创建点赞记录（如果不存在），并增加计数
    await prisma.$transaction(async (tx) => {
      const existing = await tx.comboLike.findUnique({
        where: {
          comboId_userId: {
            comboId: comboId,
            userId: session.user!.id,
          },
        },
      });

      if (!existing) {
        await tx.comboLike.create({
          data: {
            comboId,
            userId: session.user!.id,
          },
        });

        await tx.combo.update({
          where: { id: comboId },
          data: { likeCount: { increment: 1 } },
        });
      }
    });

    const updated = await prisma.combo.findUnique({
      where: { id: comboId },
      select: { id: true, likeCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        comboId,
        likeCount: updated?.likeCount ?? 0,
        liked: true,
      },
    });
  } catch (error) {
    console.error("点赞组合失败:", error);
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}

// DELETE: 取消点赞组合
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ comboId: string }> },
) {
  try {
    const { comboId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const combo = await prisma.combo.findFirst({
      where: { id: comboId, visibility: "public" },
      select: { id: true },
    });

    if (!combo) {
      return NextResponse.json({ success: false, error: "组合不存在或不可见" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.comboLike.findUnique({
        where: {
          comboId_userId: {
            comboId: comboId,
            userId: session.user!.id,
          },
        },
      });

      if (existing) {
        await tx.comboLike.delete({
          where: { id: existing.id },
        });

        await tx.combo.update({
          where: { id: comboId },
          data: { likeCount: { decrement: 1 } },
        });
      }
    });

    const updated = await prisma.combo.findUnique({
      where: { id: comboId },
      select: { id: true, likeCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        comboId,
        likeCount: updated?.likeCount ?? 0,
        liked: false,
      },
    });
  } catch (error) {
    console.error("取消点赞组合失败:", error);
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}
