import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { identifier, password, nickname } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "请输入账号/手机号和密码" },
        { status: 400 }
      );
    }

    const trimmedIdentifier = String(identifier).trim();
    const isPhone = /^1[3-9]\d{9}$/.test(trimmedIdentifier);

    // 检查是否已存在
    const existingUser = await prisma.user.findFirst({
      where: isPhone
        ? { phone: trimmedIdentifier }
        : { nickname: trimmedIdentifier },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "账号已存在" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        phone: isPhone ? trimmedIdentifier : null,
        nickname:
          nickname?.trim() ||
          (isPhone
            ? `用户${trimmedIdentifier.slice(-4)}`
            : trimmedIdentifier),
        passwordHash,
        isAdmin: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: user.id, phone: user.phone, nickname: user.nickname },
    });
  } catch (error) {
    console.error("注册失败", error);
    return NextResponse.json(
      { success: false, message: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
