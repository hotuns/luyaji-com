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
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const overview = await getProfileOverview(session.user.id);
    return NextResponse.json({ success: true, data: overview });
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

    if (payload.nickname === undefined && payload.avatarUrl === undefined) {
      return NextResponse.json(
        { success: false, error: "请至少提供一个更新字段" },
        { status: 400 }
      );
    }

    const data: { nickname?: string | null; avatarUrl?: string | null } = {};
    if (payload.nickname !== undefined) {
      data.nickname = payload.nickname;
    }
    if (payload.avatarUrl !== undefined) {
      data.avatarUrl = payload.avatarUrl;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

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
