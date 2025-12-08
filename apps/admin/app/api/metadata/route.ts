import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const normalizeAliases = (aliases: unknown): string[] =>
  Array.isArray(aliases)
    ? aliases
        .map((alias) => `${alias}`.trim())
        .filter(Boolean)
    : [];

const formatJsonValue = (value: unknown) =>
  value === undefined || value === null ? Prisma.JsonNull : value;

// GET /api/metadata - 获取所有元数据
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const items = await prisma.metadata.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("获取元数据失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

// POST /api/metadata - 新增元数据
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { value, label, sortOrder, isActive, aliases, extra } = body;
    
    // 处理新建分类
    const category = body.category === "__new__" && body.newCategory
      ? body.newCategory
      : body.category;

    if (!category || !value || !label) {
      return NextResponse.json(
        { success: false, error: "缺少必填字段" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await prisma.metadata.findUnique({
      where: { category_value: { category, value } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "该分类下已存在相同的值" },
        { status: 400 }
      );
    }

    const aliasList = normalizeAliases(aliases);
    const item = await prisma.metadata.create({
      data: {
        category,
        value,
        label,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        aliases: aliasList.length ? aliasList : Prisma.JsonNull,
        extra: formatJsonValue(extra),
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("新增元数据失败:", error);
    return NextResponse.json({ success: false, error: "新增失败" }, { status: 500 });
  }
}
