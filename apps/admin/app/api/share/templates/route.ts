import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const toJsonValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return Prisma.JsonNull;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value as Prisma.JsonValue;
};

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const templates = await prisma.shareTemplate.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { updatedAt: "desc" },
      ],
    });
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("获取分享模板失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = `${body.name || ""}`.trim();
    const type = `${body.type || "trip"}`.trim();

    if (!name) {
      return NextResponse.json({ success: false, error: "名称不能为空" }, { status: 400 });
    }

    const created = await prisma.shareTemplate.create({
      data: {
        name,
        type,
        title: body.title ?? null,
        subtitle: body.subtitle ?? null,
        description: body.description ?? null,
        badgeLabel: body.badgeLabel ?? null,
        backgroundImageUrl: body.backgroundImageUrl ?? null,
        config: toJsonValue(body.config),
        sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("创建分享模板失败:", error);
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
