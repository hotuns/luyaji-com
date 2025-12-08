import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type RouteParams = { params: Promise<{ id: string }> };

const normalizeAliases = (aliases: unknown): string[] =>
  Array.isArray(aliases)
    ? aliases
        .map((alias) => `${alias}`.trim())
        .filter(Boolean)
    : [];

const formatJsonValue = (value: unknown) =>
  value === undefined || value === null ? Prisma.JsonNull : value;

// PATCH /api/metadata/[id] - 更新元数据
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { label, sortOrder, isActive, aliases, extra } = body;

    const item = await prisma.metadata.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(aliases !== undefined && {
          aliases: (() => {
            const normalized = normalizeAliases(aliases);
            return normalized.length ? normalized : Prisma.JsonNull;
          })(),
        }),
        ...(extra !== undefined && { extra: formatJsonValue(extra) }),
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("更新元数据失败:", error);
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/metadata/[id] - 删除元数据
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.metadata.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除元数据失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
