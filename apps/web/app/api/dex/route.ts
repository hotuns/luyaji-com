import { auth } from "@/lib/auth";
import { getFishDex } from "@/lib/dex";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const payload = await getFishDex(session.user.id);
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("获取图鉴数据失败:", error);
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}
