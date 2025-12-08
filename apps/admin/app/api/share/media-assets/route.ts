import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const assets = await prisma.shareMediaAsset.findMany({
      orderBy: [
        { category: "asc" },
        { weight: "desc" },
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    console.error("获取分享素材失败:", error);
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
    const category = `${body.category || ""}`.trim();
    const imageUrl = `${body.imageUrl || ""}`.trim();

    if (!category || !imageUrl) {
      return NextResponse.json({ success: false, error: "分类和图片地址不能为空" }, { status: 400 });
    }

    const created = await prisma.shareMediaAsset.create({
      data: {
        category,
        label: body.label ?? null,
        imageUrl,
        linkUrl: body.linkUrl ?? null,
        weight: Number.isFinite(body.weight) ? Number(body.weight) : 1,
        isActive: body.isActive ?? true,
        metadata: body.metadata ?? null,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("创建分享素材失败:", error);
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
