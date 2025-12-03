import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const { title, content, isActive, startsAt, endsAt, showAsBanner } = body as {
      title?: string;
      content?: string;
      isActive?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      showAsBanner?: boolean;
    };

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "标题和内容必填" },
        { status: 400 }
      );
    }

    const now = new Date();
    const item = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isActive: isActive ?? true,
        // 若未显式传入 startsAt，则在立即展示场景下默认 now
        startsAt: startsAt ? new Date(startsAt) : isActive ? now : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        showAsBanner: showAsBanner ?? false,
        publishedAt: isActive ? now : null,
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("创建公告失败", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
