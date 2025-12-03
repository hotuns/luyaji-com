import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const baseRodSchema = {
  name: z.string().min(1, "请输入名称").max(60),
  brand: z.string().max(40).optional(),
  length: z
    .number()
    .positive()
    .max(10, "长度过大")
    .transform((value) => Number(value))
    .optional(),
  lengthUnit: z.enum(["m", "ft"]).optional(),
  power: z.string().max(20).optional(),
  lureWeightMin: z.number().min(0).max(500).optional(),
  lureWeightMax: z.number().min(0).max(500).optional(),
  lineWeightText: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
  visibility: z.enum(["private", "public"]).optional(),
};

const createRodSchema = z.object(baseRodSchema);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const rods = await prisma.rod.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { combos: true } },
      },
    });

    return NextResponse.json({ success: true, data: rods });
  } catch (error) {
    console.error("获取鱼竿失败:", error);
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
    const payload = createRodSchema.parse(json);

    ensureSafeText("鱼竿名称", payload.name);
    if (payload.note) {
      ensureSafeText("鱼竿备注", payload.note);
    }

    const rod = await prisma.rod.create({
      data: {
        userId: session.user.id,
        name: payload.name,
        brand: payload.brand,
        length: payload.length,
        lengthUnit: payload.lengthUnit ?? "m",
        power: payload.power,
        lureWeightMin: payload.lureWeightMin,
        lureWeightMax: payload.lureWeightMax,
        lineWeightText: payload.lineWeightText,
        note: payload.note,
        visibility: payload.visibility ?? "private",
      },
    });

    return NextResponse.json({ success: true, data: rod }, { status: 201 });
  } catch (error) {
    console.error("创建鱼竿失败:", error);
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
