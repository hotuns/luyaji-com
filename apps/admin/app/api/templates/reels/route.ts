import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { AdminAuthError, requireAdminUser } from "@/lib/admin-auth";

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const name = (body.name as string | undefined)?.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "请填写渔轮名称" },
        { status: 400 }
      );
    }

    const reel = await prisma.reel.create({
      data: {
        userId: admin.id,
        name,
        brand: toNullableString(body.brand),
        model: toNullableString(body.model),
        gearRatioText: toNullableString(body.gearRatioText),
        lineCapacityText: toNullableString(body.lineCapacityText),
        note: toNullableString(body.note),
        visibility: "public",
        sourceType: "template",
      },
    });

    return NextResponse.json({ success: true, data: reel });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: "未登录或无权限" },
        { status: 401 }
      );
    }

    console.error("创建渔轮模板失败:", error);
    return NextResponse.json(
      { success: false, error: "创建渔轮模板失败" },
      { status: 500 }
    );
  }
}
