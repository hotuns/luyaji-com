import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const items = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    const banner = await prisma.announcement.findFirst({
      where: {
        isActive: true,
        showAsBanner: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: { items, banner } });
  } catch (error) {
    console.error("获取公告失败", error);
    return NextResponse.json(
      { success: false, error: "获取公告失败" },
      { status: 500 }
    );
  }
}
