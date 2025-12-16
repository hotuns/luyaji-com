import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const body = await request.json();
    const newPassword = `${body.newPassword || ""}`.trim();

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: "新密码不能为空" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "新密码至少 6 位" },
        { status: 400 },
      );
    }

    // 允许重置自己密码，以便管理员自助；若不需要可加判断 adminUser.id === id
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("重置用户密码失败:", error);
    return NextResponse.json(
      { success: false, error: "重置失败，请稍后再试" },
      { status: 500 },
    );
  }
}
