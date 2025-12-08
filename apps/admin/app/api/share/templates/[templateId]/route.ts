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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { templateId } = await params;
    const body = await request.json();

    const updated = await prisma.shareTemplate.update({
      where: { id: templateId },
      data: {
        name: body.name ?? undefined,
        type: body.type ?? undefined,
        title: body.title ?? null,
        subtitle: body.subtitle ?? null,
        description: body.description ?? null,
        badgeLabel: body.badgeLabel ?? null,
        backgroundImageUrl: body.backgroundImageUrl ?? null,
        config: toJsonValue(body.config),
        sortOrder:
          body.sortOrder === undefined
            ? undefined
            : Number.isFinite(body.sortOrder)
              ? Number(body.sortOrder)
              : 0,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新分享模板失败:", error);
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { templateId } = await params;
    await prisma.shareTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除分享模板失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
