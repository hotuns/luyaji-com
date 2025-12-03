import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();

    const params = await context.params;

    const body = await request.json();
    const {
      title,
      content,
      isActive,
      startsAt,
      endsAt,
      showAsBanner,
    }: {
      title?: string;
      content?: string;
      isActive?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      showAsBanner?: boolean;
    } = body;

    const data: Record<string, unknown> = {};
    if (typeof title === "string") data.title = title.trim();
    if (typeof content === "string") data.content = content.trim();
    if (typeof showAsBanner === "boolean") data.showAsBanner = showAsBanner;
    if (typeof startsAt === "string" || startsAt === null) {
      data.startsAt = startsAt ? new Date(startsAt) : null;
    }
    if (typeof endsAt === "string" || endsAt === null) {
      data.endsAt = endsAt ? new Date(endsAt) : null;
    }
    if (typeof isActive === "boolean") {
      data.isActive = isActive;
      if (isActive) {
        data.publishedAt = new Date();
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "无更新内容" },
        { status: 400 }
      );
    }

    const item = await prisma.announcement.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("更新公告失败", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
