import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 快速创建组合的请求验证（同时创建鱼竿和渔轮）
const quickCreateSchema = z.object({
  name: z.string().min(1).max(50),
  rodName: z.string().min(1).max(50),
  reelName: z.string().min(1).max(50),
});

// POST: 快速创建组合（同时创建鱼竿和渔轮）
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
    const validatedData = quickCreateSchema.parse(body);
    const userId = session.user.id;

    // 在事务中创建鱼竿、渔轮和组合
    const result = await prisma.$transaction(async (tx) => {
      // 创建鱼竿
      const rod = await tx.rod.create({
        data: {
          userId,
          name: validatedData.rodName,
          visibility: "private",
          sourceType: "user",
        },
      });

      // 创建渔轮
      const reel = await tx.reel.create({
        data: {
          userId,
          name: validatedData.reelName,
          visibility: "private",
          sourceType: "user",
        },
      });

      // 创建组合
      const combo = await tx.combo.create({
        data: {
          userId,
          name: validatedData.name,
          rodId: rod.id,
          reelId: reel.id,
          visibility: "private",
          sourceType: "user",
        },
        include: {
          rod: { select: { id: true, name: true } },
          reel: { select: { id: true, name: true } },
        },
      });

      return combo;
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("快速创建组合失败:", error);
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
