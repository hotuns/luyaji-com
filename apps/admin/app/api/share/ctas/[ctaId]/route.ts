import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const isMissingTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ctaId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { ctaId } = await params;
    const body = await request.json();

    const updated = await prisma.shareCta.update({
      where: { id: ctaId },
      data: {
        key: body.key ?? undefined,
        title: body.title ?? undefined,
        description: body.description ?? null,
        buttonText: body.buttonText ?? null,
        linkUrl: body.linkUrl ?? null,
        audience: body.audience ?? undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        startAt: body.startAt ? new Date(body.startAt) : null,
        endAt: body.endAt ? new Date(body.endAt) : null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ success: false, error: "CTA 表不存在" }, { status: 500 });
    }
    console.error("更新 CTA 失败:", error);
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ctaId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { ctaId } = await params;
    await prisma.shareCta.delete({ where: { id: ctaId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ success: false, error: "CTA 表不存在" }, { status: 500 });
    }
    console.error("删除 CTA 失败:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
