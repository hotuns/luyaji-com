import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { AdminAuthError, requireAdminUser } from "@/lib/admin-auth";

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const name = (body.name as string | undefined)?.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "请填写鱼竿名称" },
        { status: 400 }
      );
    }

    const rod = await prisma.rod.create({
      data: {
        userId: admin.id,
        name,
        brand: toNullableString(body.brand),
        length: toNullableNumber(body.length),
        lengthUnit: (body.lengthUnit as string) || "m",
        power: toNullableString(body.power),
        lureWeightMin: toNullableNumber(body.lureWeightMin),
        lureWeightMax: toNullableNumber(body.lureWeightMax),
        lineWeightText: toNullableString(body.lineWeightText),
        price: toNullableNumber(body.price),
        note: toNullableString(body.note),
        visibility: "public",
        sourceType: "template",
      },
    });

    return NextResponse.json({ success: true, data: rod });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: "未登录或无权限" },
        { status: 401 }
      );
    }

    console.error("创建鱼竿模板失败:", error);
    return NextResponse.json(
      { success: false, error: "创建鱼竿模板失败" },
      { status: 500 }
    );
  }
}
