import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateReelSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  brand: z.string().max(40).optional(),
  model: z.string().max(40).optional(),
  gearRatioText: z.string().max(30).optional(),
  lineCapacityText: z.string().max(80).optional(),
  note: z.string().max(500).optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reelId: string }> }
) {
  try {
    const { reelId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const json = await request.json();
    const payload = updateReelSchema.parse(json);

    if (payload.name) {
      ensureSafeText("渔轮名称", payload.name);
    }
    if (payload.note) {
      ensureSafeText("渔轮备注", payload.note);
    }

    const existing = await prisma.reel.findFirst({
      where: { id: reelId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "渔轮不存在" }, { status: 404 });
    }

    const reel = await prisma.reel.update({
      where: { id: existing.id },
      data: payload,
    });

    return NextResponse.json({ success: true, data: reel });
  } catch (error) {
    console.error("更新渔轮失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "数据验证失败" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("包含敏感内容")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reelId: string }> }
) {
  try {
    const { reelId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.reel.findFirst({
      where: { id: reelId, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "渔轮不存在" }, { status: 404 });
    }

    const comboCount = await prisma.combo.count({
      where: { userId: session.user.id, reelId: reelId },
    });

    if (comboCount > 0) {
      return NextResponse.json(
        { success: false, error: "该渔轮已在组合中使用，无法删除" },
        { status: 400 }
      );
    }

    await prisma.reel.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除渔轮失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
