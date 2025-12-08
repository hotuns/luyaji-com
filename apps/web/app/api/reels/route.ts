import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { applyReelMetadata } from "./helpers";

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

const createReelSchema = z.object({
  name: z.string().min(1).max(60),
  brand: z.preprocess(nullToUndefined, z.string().max(40).optional()),
  brandMetadataId: metadataIdSchema,
  model: z.preprocess(nullToUndefined, z.string().max(40).optional()),
  gearRatioText: z.preprocess(nullToUndefined, z.string().max(30).optional()),
  lineCapacityText: z.preprocess(nullToUndefined, z.string().max(80).optional()),
  price: z.preprocess(nullToUndefined, z.number().min(0).max(999999).optional()),
  note: z.preprocess(nullToUndefined, z.string().max(500).optional()),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const reels = await prisma.reel.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { combos: true } },
      },
    });

    return NextResponse.json({ success: true, data: reels });
  } catch (error) {
    console.error("获取渔轮失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const json = await request.json();
    const payload = createReelSchema.parse(json);

    ensureSafeText("渔轮名称", payload.name);
    if (payload.note) {
      ensureSafeText("渔轮备注", payload.note);
    }

    const reelData: Prisma.ReelUncheckedCreateInput = {
      userId: session.user.id,
      name: payload.name,
      brand: payload.brand,
      model: payload.model,
      gearRatioText: payload.gearRatioText,
      lineCapacityText: payload.lineCapacityText,
      price: payload.price,
      note: payload.note,
      visibility: payload.visibility ?? "private",
    };

    const metadataError = await applyReelMetadata(payload, reelData);
    if (metadataError) return metadataError;

    const reel = await prisma.reel.create({
      data: reelData,
    });

    return NextResponse.json({ success: true, data: reel }, { status: 201 });
  } catch (error) {
    console.error("创建渔轮失败:", error);
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
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
