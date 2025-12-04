"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// 生成访客 ID（基于浏览器指纹）
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  
  // 先从 localStorage 获取
  const stored = localStorage.getItem("_vid");
  if (stored) return stored;
  
  // 生成新的访客 ID
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fingerprint", 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join("|");
  
  // 简单的 hash 函数
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const visitorId = Math.abs(hash).toString(36) + Date.now().toString(36);
  localStorage.setItem("_vid", visitorId);
  
  return visitorId;
}

// 上报页面访问
async function trackPageView(path: string, visitorId: string) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        visitorId,
        referer: document.referrer || null,
      }),
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.debug("Analytics track failed:", error);
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>("");
  const visitorIdRef = useRef<string>("");

  useEffect(() => {
    // 初始化访客 ID
    visitorIdRef.current = getVisitorId();
  }, []);

  useEffect(() => {
    // 避免重复上报同一页面
    if (pathname === lastPathRef.current) return;
    if (!visitorIdRef.current) return;
    
    lastPathRef.current = pathname;
    
    // 延迟上报，确保页面加载完成
    const timer = setTimeout(() => {
      trackPageView(pathname, visitorIdRef.current);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
