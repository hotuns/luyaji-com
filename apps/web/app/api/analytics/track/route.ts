import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 解析 User-Agent
function parseUserAgent(ua: string | null) {
  if (!ua) return { device: "unknown", browser: "unknown", os: "unknown" };

  // 设备类型
  let device = "desktop";
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
  }

  // 浏览器
  let browser = "unknown";
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edge|Edg/i.test(ua)) browser = "Edge";
  else if (/MSIE|Trident/i.test(ua)) browser = "IE";
  else if (/MicroMessenger/i.test(ua)) browser = "WeChat";
  else if (/QQ/i.test(ua)) browser = "QQ";

  // 操作系统
  let os = "unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
}

// 获取客户端 IP（脱敏处理）
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : req.headers.get("x-real-ip");
  
  if (!ip) return null;
  
  // IPv4 脱敏：保留前三段
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  }
  
  // IPv6 脱敏：保留前四段
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}:*`;
  }
  
  return null;
}

// POST /api/analytics/track - 记录页面访问
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, visitorId, referer } = body;

    if (!path || !visitorId) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 获取当前用户（可选）
    const session = await auth();
    const userId = session?.user?.id || null;

    // 解析请求信息
    const userAgent = req.headers.get("user-agent");
    const { device, browser, os } = parseUserAgent(userAgent);
    const ip = getClientIp(req);

    // 记录页面访问
    await prisma.pageView.create({
      data: {
        path,
        userId,
        visitorId,
        userAgent,
        referer,
        ip,
        device,
        browser,
        os,
      },
    });

    // 如果是登录用户，更新活跃记录
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.userActivity.upsert({
        where: {
          userId_date: { userId, date: today },
        },
        update: {
          actions: { increment: 1 },
        },
        create: {
          userId,
          date: today,
          actions: 1,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("记录访问失败:", error);
    return NextResponse.json(
      { success: false, error: "记录失败" },
      { status: 500 }
    );
  }
}
