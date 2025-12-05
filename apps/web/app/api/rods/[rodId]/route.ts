import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 预处理：将 null 转换为 undefined
const nullToUndefined = <T>(val: T | null | undefined): T | undefined => 
  val === null ? undefined : val;

const updateRodSchema = z.object({
  name: z.preprocess(nullToUndefined, z.string().min(1).max(60).optional()),
  brand: z.preprocess(nullToUndefined, z.string().max(40).optional()),
  length: z.preprocess(nullToUndefined, z.number().positive().max(10).optional()),
  lengthUnit: z.preprocess(nullToUndefined, z.enum(["m", "ft"]).optional()),
  power: z.preprocess(nullToUndefined, z.string().max(20).optional()),
  lureWeightMin: z.preprocess(nullToUndefined, z.number().min(0).max(500).optional()),
  lureWeightMax: z.preprocess(nullToUndefined, z.number().min(0).max(500).optional()),
  lineWeightText: z.preprocess(nullToUndefined, z.string().max(60).optional()),
  price: z.preprocess(nullToUndefined, z.number().min(0).max(999999).optional()),
  note: z.preprocess(nullToUndefined, z.string().max(500).optional()),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ rodId: string }> }
) {
  try {
    const { rodId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const json = await request.json();
    const payload = updateRodSchema.parse(json);

    if (payload.name) {
      ensureSafeText("鱼竿名称", payload.name);
    }
    if (payload.note) {
      ensureSafeText("鱼竿备注", payload.note);
    }

    const existing = await prisma.rod.findFirst({
      where: { id: rodId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "鱼竿不存在" }, { status: 404 });
    }

    const rod = await prisma.rod.update({
      where: { id: existing.id },
      data: payload,
    });

    return NextResponse.json({ success: true, data: rod });
  } catch (error) {
    console.error("更新鱼竿失败:", error);
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
  { params }: { params: Promise<{ rodId: string }> }
) {
  try {
    const { rodId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const existing = await prisma.rod.findFirst({
      where: { id: rodId, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "鱼竿不存在" }, { status: 404 });
    }

    const comboCount = await prisma.combo.count({
      where: { userId: session.user.id, rodId: rodId },
    });

    if (comboCount > 0) {
      return NextResponse.json(
        { success: false, error: "该鱼竿已在组合中使用，无法删除" },
        { status: 400 }
      );
    }

    await prisma.rod.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除鱼竿失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
