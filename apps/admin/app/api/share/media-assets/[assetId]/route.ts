import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { assetId } = await params;
    const body = await request.json();

    const updated = await prisma.shareMediaAsset.update({
      where: { id: assetId },
      data: {
        category: body.category ?? undefined,
        label: body.label ?? null,
        imageUrl: body.imageUrl ?? undefined,
        linkUrl: body.linkUrl ?? null,
        weight:
          body.weight === undefined
            ? undefined
            : Number.isFinite(body.weight)
              ? Number(body.weight)
              : 1,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        metadata: body.metadata ?? null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("更新分享素材失败:", error);
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { assetId } = await params;
    await prisma.shareMediaAsset.delete({ where: { id: assetId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除分享素材失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
