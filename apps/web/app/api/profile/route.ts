import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfileOverview } from "@/lib/profile";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  nickname: z
    .union([z.string().trim().min(1).max(20), z.null()])
    .optional(),
  avatarUrl: z
    .union([z.string().trim().url().max(500), z.null()])
    .optional(),
  bio: z
    .union([z.string().trim().max(200), z.null()])
    .optional(),
  phone: z
    .union([
      z
        .string()
        .trim()
        .regex(/^1\d{10}$/, "请输入有效的11位手机号码"),
      z.null(),
    ])
    .optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const overview = await getProfileOverview(session.user.id);
    
    // 序列化 Date 对象
    const serialized = {
      user: {
        ...overview.user,
        createdAt: overview.user.createdAt.toISOString(),
      },
      stats: overview.stats,
      recentTrip: overview.recentTrip
        ? {
            ...overview.recentTrip,
            startTime: overview.recentTrip.startTime.toISOString(),
          }
        : null,
    };
    
    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    console.error("获取个人信息失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const payload = updateProfileSchema.parse(body);

    if (
      payload.nickname === undefined &&
      payload.avatarUrl === undefined &&
      payload.bio === undefined &&
      payload.phone === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "请至少提供一个更新字段" },
        { status: 400 }
      );
    }

    const data: {
      nickname?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
      phone?: string | null;
    } = {};
    if (payload.nickname !== undefined) {
      data.nickname = payload.nickname;
    }
    if (payload.avatarUrl !== undefined) {
      data.avatarUrl = payload.avatarUrl;
    }
    if (payload.bio !== undefined) {
      data.bio = payload.bio;
    }

    if (payload.phone !== undefined) {
      data.phone = payload.phone;
    }

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data,
      });
    } catch (err: unknown) {
      // 昵称和手机号都有唯一索引，冲突时返回友好提示
      const message = (err as { code?: string; meta?: { target?: string[] } }).code;
      if (message === "P2002") {
        return NextResponse.json(
          { success: false, error: "昵称或手机号已被占用，请更换后重试" },
          { status: 400 },
        );
      }
      throw err;
    }

    const overview = await getProfileOverview(session.user.id);
    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    console.error("更新个人信息失败:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || "数据校验失败" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}
