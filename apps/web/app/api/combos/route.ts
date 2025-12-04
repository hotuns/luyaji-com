import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 预处理：将 null 转换为 undefined
const nullToUndefined = <T>(val: T | null | undefined): T | undefined => 
  val === null ? undefined : val;

// GET: 获取用户的装备组合列表
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const combos = await prisma.combo.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        rod: { select: { id: true, name: true } },
        reel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: combos });
  } catch (error) {
    console.error("获取组合列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

// 创建组合的请求验证
const createComboSchema = z.object({
  name: z.string().min(1).max(50),
  rodId: z.string(),
  reelId: z.string(),
  mainLineText: z.preprocess(nullToUndefined, z.string().optional()),
  leaderLineText: z.preprocess(nullToUndefined, z.string().optional()),
  hookText: z.preprocess(nullToUndefined, z.string().optional()),
  lures: z.preprocess(nullToUndefined, z.array(z.any()).optional()),
  sceneTags: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
  detailNote: z.preprocess(nullToUndefined, z.string().optional()),
  visibility: z.preprocess(nullToUndefined, z.enum(["private", "public"]).optional()),
  photoUrls: z.preprocess(nullToUndefined, z.array(z.string()).optional()),
});

// POST: 创建新组合
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createComboSchema.parse(body);

    // 敏感词校验：组合名称、说明
    ensureSafeText("组合名称", validatedData.name);
    if (validatedData.detailNote) {
      ensureSafeText("组合说明", validatedData.detailNote);
    }

    const combo = await prisma.combo.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        rodId: validatedData.rodId,
        reelId: validatedData.reelId,
        mainLineText: validatedData.mainLineText,
        leaderLineText: validatedData.leaderLineText,
        hookText: validatedData.hookText,
        lures: validatedData.lures,
        sceneTags: validatedData.sceneTags,
        detailNote: validatedData.detailNote,
        visibility: validatedData.visibility || "private",
        photoUrls: validatedData.photoUrls,
      },
      include: {
        rod: { select: { id: true, name: true } },
        reel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: combo },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建组合失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "数据验证失败" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "创建失败" },
      { status: 500 }
    );
  }
}
