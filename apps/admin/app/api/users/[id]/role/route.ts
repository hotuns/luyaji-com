import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdminUser();
    const params = await context.params;

    const body = await request.json();
    const { isAdmin } = body as { isAdmin?: boolean };

    if (typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { success: false, error: "参数错误" },
        { status: 400 }
      );
    }

    // 防止把自己从管理员移除，避免锁死后台
    if (!isAdmin && params.id === adminUser.id) {
      return NextResponse.json(
        { success: false, error: "不能取消自己的管理员权限" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isAdmin },
      select: { id: true, isAdmin: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("更新用户角色失败", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
