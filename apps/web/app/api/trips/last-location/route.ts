import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: 获取上一次出击的地点
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ locationName: null });
    }

    const lastTrip = await prisma.trip.findFirst({
      where: { userId: session.user.id },
      orderBy: { startTime: "desc" },
      select: { locationName: true },
    });

    return NextResponse.json({
      locationName: lastTrip?.locationName || null,
    });
  } catch (error) {
    console.error("获取上次地点失败:", error);
    return NextResponse.json({ locationName: null });
  }
}
