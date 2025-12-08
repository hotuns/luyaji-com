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
      return { icon: "🎣", color: "#0ea5e9", label: "出击记录", gradient: ["#0ea5e9", "#0284c7"] };
    case "combo":
      return { icon: "⚔️", color: "#8b5cf6", label: "装备组合", gradient: ["#8b5cf6", "#7c3aed"] };
    case "dex":
      return { icon: "🐡", color: "#f59e0b", label: "渔获图鉴", gradient: ["#f59e0b", "#d97706"] };
    default:
      return { icon: "🌊", color: "#64748b", label: "路亚记", gradient: ["#64748b", "#475569"] };
  }
}

// 绘制圆角矩形（带填充和描边选项）
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string | CanvasGradient,
  stroke?: string
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
  
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
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
  const padding = 40;
  
  canvas.width = width;
  canvas.height = height;

  const typeStyle = getTypeStyle(data.type);

  // 1. 背景
  // 使用柔和的渐变背景
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#f8fafc");
  bgGradient.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 绘制一些装饰性的背景圆
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = typeStyle.color;
  ctx.beginPath();
  ctx.arc(width, 0, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, height, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 主卡片
  const cardX = padding;
  const cardY = padding + 20;
  const cardW = width - padding * 2;
  const cardH = height - padding * 2 - 40;
  const cardRadius = 24;

  // 卡片阴影
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  
  // 卡片背景
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius, "#ffffff");
  ctx.shadowColor = "transparent";

  let currentY = cardY;

  // 3. 顶部图片区域 (Hero Image)
  const heroHeight = Math.min(cardH * 0.55, 520);
  
  ctx.save();
  // 创建顶部圆角的裁剪区域
  ctx.beginPath();
  ctx.moveTo(cardX + cardRadius, cardY);
  ctx.lineTo(cardX + cardW - cardRadius, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardRadius);
  ctx.lineTo(cardX + cardW, cardY + heroHeight);
  ctx.lineTo(cardX, cardY + heroHeight);
  ctx.lineTo(cardX, cardY + cardRadius);
  ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
  ctx.closePath();
  ctx.clip();

  if (data.imageUrl) {
    try {
      const coverImg = await loadImage(data.imageUrl);
      // 保持比例填充 (Object-fit: cover)
      const scale = Math.max(cardW / coverImg.width, heroHeight / coverImg.height);
      const sw = cardW / scale;
      const sh = heroHeight / scale;
      const sx = (coverImg.width - sw) / 2;
      const sy = (coverImg.height - sh) / 2;
      ctx.drawImage(coverImg, sx, sy, sw, sh, cardX, cardY, cardW, heroHeight);
      
      // 图片底部加一个渐变遮罩，让过渡更自然
      const overlayGradient = ctx.createLinearGradient(0, cardY + heroHeight - 100, 0, cardY + heroHeight);
      overlayGradient.addColorStop(0, "rgba(255,255,255,0)");
      overlayGradient.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(cardX, cardY + heroHeight - 100, cardW, 100);
      
    } catch {
      // 图片加载失败回退
      drawFallbackHero(ctx, cardX, cardY, cardW, heroHeight, typeStyle);
    }
  } else {
    // 无图片时的样式
    drawFallbackHero(ctx, cardX, cardY, cardW, heroHeight, typeStyle);
  }
  ctx.restore();

  // 4. 类型标签 (悬浮在图片左上角)
  const tagX = cardX + 24;
  const tagY = cardY + 24;
  const tagH = 36;
  const tagW = 110;
  
  ctx.shadowColor = "rgba(0,0,0,0.1)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 18, "#ffffff");
  ctx.shadowColor = "transparent";
  
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = typeStyle.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(`${typeStyle.icon} ${typeStyle.label}`, tagX + tagW / 2, tagY + tagH / 2 + 1);
  ctx.textAlign = "left"; // Reset

  currentY += heroHeight + 32;

  // 5. 内容区域
  const contentPadding = 40;
  const contentWidth = cardW - contentPadding * 2;
  const contentX = cardX + contentPadding;

  // 标题
  ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#1e293b";
  ctx.textBaseline = "top";
  // 标题最多2行
  currentY = wrapText(ctx, data.title, contentX, currentY, contentWidth, 52, 2);
  
  currentY += 16;

  // 描述
  if (data.description) {
    ctx.font = "22px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#64748b";
    // 描述最多3行
    currentY = wrapText(ctx, data.description, contentX, currentY, contentWidth, 34, 3);
    currentY += 32;
  } else {
    currentY += 16;
  }

  // 6. 统计数据 (如果有)
  if (data.stats && data.stats.length > 0) {
    const statBoxHeight = 90;
    const statBoxY = currentY;
    
    // 绘制统计数据背景容器
    drawRoundedRect(ctx, contentX, statBoxY, contentWidth, statBoxHeight, 16, "#f8fafc", "#e2e8f0");
    
    const statCount = Math.min(data.stats.length, 3); // 最多显示3个数据
    const statWidth = contentWidth / statCount;
    
    data.stats.slice(0, 3).forEach((stat, index) => {
      const statX = contentX + statWidth * index;
      const centerX = statX + statWidth / 2;
      const centerY = statBoxY + statBoxHeight / 2;
      
      // 分隔线
      if (index > 0) {
        ctx.beginPath();
        ctx.moveTo(statX, statBoxY + 20);
        ctx.lineTo(statX, statBoxY + statBoxHeight - 20);
        ctx.strokeStyle = "#e2e8f0";
        ctx.stroke();
      }

      // 数值
      ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = typeStyle.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(stat.value), centerX, centerY - 12);
      
      // 标签
      ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(stat.label, centerX, centerY + 16);
    });
    
    ctx.textAlign = "left"; // Reset
    currentY += statBoxHeight + 40;
  } else {
    currentY += 20;
  }

  // 7. 底部区域 (作者 + 品牌)
  // 将底部固定在卡片底部
  const footerH = 100;
  const footerY = cardY + cardH - footerH;
  
  // 分隔线
  ctx.beginPath();
  ctx.moveTo(contentX, footerY);
  ctx.lineTo(contentX + contentWidth, footerY);
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 2;
  ctx.stroke();

  const footerContentY = footerY + 30;

  // 作者信息 (左侧)
  if (data.authorAvatar) {
    try {
      const avatarImg = await loadImage(data.authorAvatar);
      drawCircleImage(ctx, avatarImg, contentX, footerContentY, 24);
    } catch {
      // 默认头像
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(contentX + 24, footerContentY + 24, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(contentX + 24, footerContentY + 24, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#334155";
  ctx.textBaseline = "middle";
  ctx.fillText(data.authorName || "钓友", contentX + 60, footerContentY + 14);
  
  ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("发布于 路亚记", contentX + 60, footerContentY + 36);

  // 品牌/链接 (右侧)
  // 真正的二维码
  const qrSize = 64;
  const qrX = contentX + contentWidth - qrSize;
  const qrY = footerContentY - 8;
  
  // 绘制二维码背景
  drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 8, "#ffffff", "#e2e8f0");

  const qrImageUrl =
    data.qrCodeUrl ??
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(shareUrl)}`;
  let qrImg: HTMLImageElement | null = null;
  try {
    qrImg = await loadImage(qrImageUrl);
  } catch (err) {
    console.error("二维码加载失败:", err);
  }

  if (qrImg) {
    ctx.drawImage(qrImg, qrX + 4, qrY + 4, qrSize - 8, qrSize - 8);
  } else {
    // 回退到简单占位
    ctx.fillStyle = "#0f172a";
    for (let i = 0; i < 30; i++) {
      const rx = Math.floor(Math.random() * (qrSize - 16)) + 8;
      const ry = Math.floor(Math.random() * (qrSize - 16)) + 8;
      ctx.fillRect(qrX + rx, qrY + ry, 3, 3);
    }
  }

  // 链接提示
  ctx.textAlign = "right";
  ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = typeStyle.color;
  ctx.fillText("长按识别", qrX - 12, footerContentY + 14);
  
  ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("查看详情", qrX - 12, footerContentY + 34);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png", 0.9);
}

// 绘制无图片时的占位背景
function drawFallbackHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  style: { color: string; icon: string; gradient: string[] }
) {
  // 渐变背景
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, style.gradient[0] ?? "#f8fafc");
  gradient.addColorStop(1, style.gradient[1] ?? "#e2e8f0");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  
  // 装饰图案
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#ffffff";
  
  // 绘制一些波浪或圆圈
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x + w * Math.random(), y + h * Math.random(), 50 + Math.random() * 100, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  
  // 中心大图标
  ctx.font = "120px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(style.icon, x + w / 2, y + h / 2);
  ctx.textAlign = "left"; // Reset
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
