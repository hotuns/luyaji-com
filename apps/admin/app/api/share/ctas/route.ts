import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const isMissingTableError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const ctas = await prisma.shareCta.findMany({
      orderBy: [
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json({ success: true, data: ctas });
  } catch (error) {
    if (isMissingTableError(error)) {
      console.warn("[admin/share/ctas] table missing, returning empty list");
      return NextResponse.json({ success: true, data: [] });
    }
    console.error("获取 CTA 配置失败:", error);
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
    const key = `${body.key || ""}`.trim();
    const title = `${body.title || ""}`.trim();

    if (!key || !title) {
      return NextResponse.json({ success: false, error: "Key 和标题不能为空" }, { status: 400 });
    }

    const created = await prisma.shareCta.create({
      data: {
        key,
        title,
        description: body.description ?? null,
        buttonText: body.buttonText ?? null,
        linkUrl: body.linkUrl ?? null,
        audience: body.audience || "all",
        isActive: body.isActive ?? true,
        startAt: body.startAt ? new Date(body.startAt) : null,
        endAt: body.endAt ? new Date(body.endAt) : null,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ success: false, error: "CTA 表不存在" }, { status: 500 });
    }
    console.error("创建 CTA 失败:", error);
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
