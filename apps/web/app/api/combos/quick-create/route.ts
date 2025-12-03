import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 快速创建组合的请求验证（支持选择已有或新建）
const quickCreateSchema = z.object({
  name: z.string().min(1).max(50),
  rodName: z.string().optional(),
  rodId: z.string().optional(),
  reelName: z.string().optional(),
  reelId: z.string().optional(),
}).refine((data) => data.rodName || data.rodId, {
  message: "请提供鱼竿名称或ID",
  path: ["rodName"],
}).refine((data) => data.reelName || data.reelId, {
  message: "请提供渔轮名称或ID",
  path: ["reelName"],
});

// POST: 快速创建组合
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

    // 在事务中创建/关联鱼竿、渔轮和组合
    const result = await prisma.$transaction(async (tx) => {
      // 处理鱼竿：如果有ID则使用，否则创建
      let rodId = validatedData.rodId;
      if (!rodId && validatedData.rodName) {
        const rod = await tx.rod.create({
          data: {
            userId,
            name: validatedData.rodName,
            visibility: "private",
            sourceType: "user",
          },
        });
        rodId = rod.id;
      }

      // 处理渔轮：如果有ID则使用，否则创建
      let reelId = validatedData.reelId;
      if (!reelId && validatedData.reelName) {
        const reel = await tx.reel.create({
          data: {
            userId,
            name: validatedData.reelName,
            visibility: "private",
            sourceType: "user",
          },
        });
        reelId = reel.id;
      }

      if (!rodId || !reelId) {
        throw new Error("无法确定鱼竿或渔轮");
      }

      // 创建组合
      const combo = await tx.combo.create({
        data: {
          userId,
          name: validatedData.name,
          rodId: rodId,
          reelId: reelId,
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
