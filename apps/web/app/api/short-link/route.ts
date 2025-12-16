import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 生成短码的字符集（去除容易混淆的字符）
const CHARSET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateShortCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

// POST /api/short-link - 创建短链接
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 验证 targetType
    if (!["trip", "combo", "dex", "gear"].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: "无效的资源类型" },
        { status: 400 }
      );
    }

    // 检查是否已存在该资源的短链接
    const existing = await prisma.shortLink.findFirst({
      where: { targetType, targetId },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { code: existing.code },
      });
    }

    // 生成唯一短码
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateShortCode();
      const exists = await prisma.shortLink.findUnique({ where: { code } });
      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { success: false, error: "生成短码失败，请重试" },
        { status: 500 }
      );
    }

    // 创建短链接
    const shortLink = await prisma.shortLink.create({
      data: {
        code,
        targetType,
        targetId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { code: shortLink.code },
    });
  } catch (error) {
    console.error("创建短链接失败:", error);
    return NextResponse.json(
      { success: false, error: "创建短链接失败" },
      { status: 500 }
    );
  }
}
