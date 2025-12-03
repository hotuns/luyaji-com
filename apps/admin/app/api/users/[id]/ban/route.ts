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
    const { isBanned } = body as { isBanned?: boolean };

    if (typeof isBanned !== "boolean") {
      return NextResponse.json(
        { success: false, error: "参数错误" },
        { status: 400 }
      );
    }

    // 防止管理员误封自己
    if (isBanned && params.id === adminUser.id) {
      return NextResponse.json(
        { success: false, error: "不能封禁自己" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isBanned },
      select: { id: true, isBanned: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("更新用户封禁状态失败", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
