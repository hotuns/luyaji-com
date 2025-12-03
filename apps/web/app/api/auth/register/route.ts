import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureSafeText } from "@/lib/sensitive-words";

export async function POST(request: Request) {
  try {
    const { identifier, password, nickname } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "请输入手机号和密码" },
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
        {
          success: false,
          message: isPhone ? "该手机号已被注册" : "该昵称已被占用，请更换",
        },
        { status: 400 }
      );
    }

    // 敏感词校验：昵称/用户名
    const finalNickname =
      nickname?.trim() ||
      (isPhone ? `用户${trimmedIdentifier.slice(-4)}` : trimmedIdentifier);

    ensureSafeText("昵称", finalNickname);

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        phone: isPhone ? trimmedIdentifier : null,
        nickname: finalNickname,
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
