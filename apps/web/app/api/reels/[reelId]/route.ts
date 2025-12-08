import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { applyReelMetadata } from "../helpers";

// 预处理：将 null 转换为 undefined
const nullToUndefined = <T>(val: T | null | undefined): T | undefined => 
  val === null ? undefined : val;

const emptyToNull = (val: unknown) => {
  if (val === undefined || val === null) return null
  if (typeof val === "string" && val.trim().length === 0) return null
  return val
}

const metadataIdSchema = z.preprocess(
  emptyToNull,
  z.union([z.string().uuid(), z.null()]).optional()
);

const updateReelSchema = z.object({
  name: z.preprocess(nullToUndefined, z.string().min(1).max(60).optional()),
  brand: z.preprocess(nullToUndefined, z.string().max(40).optional()),
  brandMetadataId: metadataIdSchema,
  model: z.preprocess(nullToUndefined, z.string().max(40).optional()),
  gearRatioText: z.preprocess(nullToUndefined, z.string().max(30).optional()),
  lineCapacityText: z.preprocess(nullToUndefined, z.string().max(80).optional()),
  price: z.preprocess(nullToUndefined, z.number().min(0).max(999999).optional()),
  note: z.preprocess(nullToUndefined, z.string().max(500).optional()),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
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

    const updateData: Prisma.ReelUncheckedUpdateInput = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.brand !== undefined) updateData.brand = payload.brand;
    if (payload.model !== undefined) updateData.model = payload.model;
    if (payload.gearRatioText !== undefined) updateData.gearRatioText = payload.gearRatioText;
    if (payload.lineCapacityText !== undefined) updateData.lineCapacityText = payload.lineCapacityText;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.note !== undefined) updateData.note = payload.note;
    if (payload.visibility !== undefined) updateData.visibility = payload.visibility;

    const metadataError = await applyReelMetadata(payload, updateData);
    if (metadataError) return metadataError;

    const reel = await prisma.reel.update({
      where: { id: existing.id },
      data: updateData,
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
