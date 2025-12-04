"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import type { ShareConfig } from "./share-dialog";

interface ShareCardData {
  type: ShareConfig["type"];
  title: string;
  description?: string;
  imageUrl?: string;
  authorName?: string;
  authorAvatar?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  qrCodeUrl?: string;
}

// 加载图片
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 绘制圆角矩形
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 绘制圆形图片
function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, radius * 2, radius * 2);
  ctx.restore();
}

// 自动换行绘制文本
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number {
  const chars = text.split("");
  let line = "";
  let lineCount = 0;
  let currentY = y;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i] ?? "";
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
      lineCount++;
      
      if (lineCount >= maxLines - 1 && i < chars.length - 1) {
        // 最后一行，加省略号
        let truncated = line;
        while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated + "...", x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  
  return currentY;
}

// 获取类型图标和颜色
function getTypeStyle(type: ShareConfig["type"]) {
  switch (type) {
    case "trip":
      return { icon: "🎣", color: "#3b82f6", label: "出击记录" };
    case "combo":
      return { icon: "⚙️", color: "#10b981", label: "装备组合" };
    case "dex":
      return { icon: "📚", color: "#8b5cf6", label: "钓鱼图鉴" };
    default:
      return { icon: "🐟", color: "#6366f1", label: "分享" };
  }
}

// 生成分享卡片
export async function generateShareCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
  shareUrl: string
): Promise<string> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const width = 750;
  const height = 1000;
  const padding = 48;
  
  canvas.width = width;
  canvas.height = height;

  const typeStyle = getTypeStyle(data.type);

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#f8fafc");
  gradient.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 顶部装饰条
  ctx.fillStyle = typeStyle.color;
  ctx.fillRect(0, 0, width, 8);

  // 主卡片背景
  const cardX = padding;
  const cardY = 40;
  const cardW = width - padding * 2;
  const cardH = height - 80;
  
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.shadowColor = "transparent";

  let currentY = cardY + padding;

  // 类型标签
  ctx.fillStyle = typeStyle.color + "20";
  roundRect(ctx, cardX + padding, currentY, 120, 36, 18);
  ctx.fill();
  
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = typeStyle.color;
  ctx.textBaseline = "middle";
  ctx.fillText(`${typeStyle.icon} ${typeStyle.label}`, cardX + padding + 16, currentY + 18);
  
  currentY += 60;

  // 封面图片
  if (data.imageUrl) {
    try {
      const coverImg = await loadImage(data.imageUrl);
      const imgX = cardX + padding;
      const imgY = currentY;
      const imgW = cardW - padding * 2;
      const imgH = 280;
      
      ctx.save();
      roundRect(ctx, imgX, imgY, imgW, imgH, 16);
      ctx.clip();
      
      // 保持比例填充
      const scale = Math.max(imgW / coverImg.width, imgH / coverImg.height);
      const sw = imgW / scale;
      const sh = imgH / scale;
      const sx = (coverImg.width - sw) / 2;
      const sy = (coverImg.height - sh) / 2;
      ctx.drawImage(coverImg, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
      ctx.restore();
      
      currentY += imgH + 32;
    } catch {
      // 如果图片加载失败，显示占位
      ctx.fillStyle = "#f1f5f9";
      roundRect(ctx, cardX + padding, currentY, cardW - padding * 2, 200, 16);
      ctx.fill();
      
      ctx.font = "48px sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.textAlign = "center";
      ctx.fillText(typeStyle.icon, width / 2, currentY + 110);
      ctx.textAlign = "left";
      
      currentY += 232;
    }
  } else {
    // 无图片时的占位
    ctx.fillStyle = "#f1f5f9";
    roundRect(ctx, cardX + padding, currentY, cardW - padding * 2, 160, 16);
    ctx.fill();
    
    ctx.font = "64px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.textAlign = "center";
    ctx.fillText(typeStyle.icon, width / 2, currentY + 100);
    ctx.textAlign = "left";
    
    currentY += 192;
  }

  // 标题
  ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "top";
  currentY = wrapText(ctx, data.title, cardX + padding, currentY, cardW - padding * 2, 48, 2);
  
  currentY += 8;

  // 描述
  if (data.description) {
    ctx.font = "20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#64748b";
    currentY = wrapText(ctx, data.description, cardX + padding, currentY, cardW - padding * 2, 32, 3);
    currentY += 16;
  }

  // 统计数据
  if (data.stats && data.stats.length > 0) {
    currentY += 8;
    const statWidth = (cardW - padding * 2) / data.stats.length;
    
    data.stats.forEach((stat, index) => {
      const statX = cardX + padding + statWidth * index;
      
      ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = typeStyle.color;
      ctx.textAlign = "center";
      ctx.fillText(String(stat.value), statX + statWidth / 2, currentY);
      
      ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(stat.label, statX + statWidth / 2, currentY + 40);
    });
    
    ctx.textAlign = "left";
    currentY += 80;
  }

  // 底部分隔线
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + padding, cardH + cardY - 140);
  ctx.lineTo(cardX + cardW - padding, cardH + cardY - 140);
  ctx.stroke();

  // 作者信息
  const authorY = cardH + cardY - 110;
  
  if (data.authorAvatar) {
    try {
      const avatarImg = await loadImage(data.authorAvatar);
      drawCircleImage(ctx, avatarImg, cardX + padding, authorY, 24);
    } catch {
      // 默认头像
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(cardX + padding + 24, authorY + 24, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(cardX + padding + 24, authorY + 24, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.font = "18px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#334155";
  ctx.textBaseline = "middle";
  ctx.fillText(data.authorName || "钓友", cardX + padding + 60, authorY + 24);

  // 品牌和二维码区域
  const brandY = cardH + cardY - 60;
  
  // 路亚记 Logo 文字
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText("路亚记", cardX + padding, brandY + 12);
  
  ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("记录每一次精彩出击", cardX + padding, brandY + 36);

  // 右侧显示链接提示
  ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.textAlign = "right";
  ctx.fillText("扫码或访问链接查看详情", cardX + cardW - padding, brandY + 12);
  
  ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = typeStyle.color;
  ctx.fillText(shareUrl.replace("https://", "").replace("http://", ""), cardX + cardW - padding, brandY + 36);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png", 0.9);
}

// React Hook 用于生成和管理分享图片
export function useShareImage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 确保 canvas 存在
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.style.display = "none";
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }
    
    return () => {
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, []);

  const generate = useCallback(async (data: ShareCardData, shareUrl: string) => {
    if (!canvasRef.current) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const url = await generateShareCard(canvasRef.current, data, shareUrl);
      setImageUrl(url);
      return url;
    } catch (err) {
      console.error("生成分享图片失败:", err);
      setError("生成图片失败，请重试");
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const download = useCallback(() => {
    if (!imageUrl) return;
    
    const link = document.createElement("a");
    link.download = `路亚记分享-${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
  }, [imageUrl]);

  const reset = useCallback(() => {
    setImageUrl(null);
    setError(null);
  }, []);

  return {
    imageUrl,
    generating,
    error,
    generate,
    download,
    reset,
  };
}
