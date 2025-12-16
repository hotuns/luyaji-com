"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
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

const CAPTURE_IFRAME_WIDTH = 430;

async function captureSharePageScreenshot(shareUrl: string): Promise<HTMLImageElement> {
  if (!shareUrl) {
    throw new Error("分享链接不存在，无法生成截屏");
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-12000px";
    iframe.style.top = "0";
    iframe.style.width = `${CAPTURE_IFRAME_WIDTH}px`;
    iframe.style.height = "100vh";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.referrerPolicy = "no-referrer";
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    iframe.onload = async () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error("无法访问分享页面内容");

        const ready = await waitForShareReady(doc);
        if (!ready) {
          await new Promise((r) => setTimeout(r, 600));
        }

        const body = doc.body;
        body.style.overflow = "visible";
        const scrollHeight = body.scrollHeight;
        const captureWidth = Math.min(CAPTURE_IFRAME_WIDTH, body.scrollWidth || CAPTURE_IFRAME_WIDTH);

        const dataUrl = await toPng(body, {
          cacheBust: true,
          pixelRatio: 2,
          width: captureWidth,
          height: scrollHeight,
          backgroundColor: "#ffffff",
          style: {
            width: `${captureWidth}px`,
          },
        });

        const image = await loadImage(dataUrl);
        cleanup();
        resolve(image);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = (err) => {
      cleanup();
      reject(err instanceof Error ? err : new Error("分享页面加载失败"));
    };

    iframe.src = shareUrl;
  });
}

async function waitForShareReady(doc: Document, timeout = 5000) {
  const body = doc.body;
  if (!body) return false;
  if (body.getAttribute("data-share-ready") === "true") {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
    };

    const observer = new MutationObserver(() => {
      if (body.getAttribute("data-share-ready") === "true") {
        cleanup();
        resolve(true);
      }
    });
    observer.observe(body, { attributes: true, attributeFilter: ["data-share-ready"] });

    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeout);
  });
}

async function composeLongScreenshot(
  canvas: HTMLCanvasElement,
  screenshot: HTMLImageElement,
  data: ShareCardData,
  shareUrl: string
): Promise<string> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const width = 900;
  const overlayHeight = 280;

  const scale = width / screenshot.width;
  const screenshotHeight = Math.round(screenshot.height * scale);

  canvas.width = width;
  canvas.height = screenshotHeight + overlayHeight;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.drawImage(screenshot, 0, 0, width, screenshotHeight);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, screenshotHeight, width, overlayHeight);

  const textMargin = 48;
  let textY = screenshotHeight + 56;
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  textY = wrapText(ctx, data.title, textMargin, textY, width - textMargin * 2 - 220, 44, 2);
  textY += 24;

  ctx.font = "20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#cbd5f5";
  textY = wrapText(
    ctx,
    data.description || "长按二维码打开路亚记，查看完整装备库详情。",
    textMargin,
    textY,
    width - textMargin * 2 - 220,
    32,
    4
  );
  textY += 24;

  const qrSize = 200;
  const qrX = width - qrSize - textMargin;
  const qrY = screenshotHeight + (overlayHeight - qrSize) / 2;
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 512,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  const qrImg = await loadImage(qrDataUrl);
  drawRoundedRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 24, "#ffffff");
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "right";
  ctx.fillText("长按识别二维码", qrX - 24, qrY + 40);

  ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#cbd5f5";
  ctx.fillText("进入路亚记，查看更多细节", qrX - 24, qrY + 72);

  ctx.textAlign = "left";
  ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  const prettyUrl = shareUrl.replace(/^https?:\/\//, "");
  const truncated = prettyUrl.length > 40 ? `${prettyUrl.slice(0, 40)}…` : prettyUrl;
  ctx.fillText(truncated, textMargin, screenshotHeight + overlayHeight - 30);

  return canvas.toDataURL("image/png", 0.92);
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
    case "gear":
      return { icon: "🧰", color: "#0ea5e9", label: "装备库", gradient: ["#22d3ee", "#0ea5e9"] };
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
async function generateDefaultCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
  shareUrl: string
): Promise<string> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const width = 900;
  const height = 1600;
  const padding = 48;

  canvas.width = width;
  canvas.height = height;

  const typeStyle = getTypeStyle(data.type);

  // 背景
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, "#e2e8f0");
  bgGradient.addColorStop(1, "#f8fafc");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 大卡片
  const cardX = padding;
  const cardY = padding;
  const cardW = width - padding * 2;
  const cardH = height - padding * 2;
  const cardRadius = 42;

  ctx.shadowColor = "rgba(15, 23, 42, 0.15)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 30;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius, "#ffffff");
  ctx.shadowColor = "transparent";

  // 顶部图
  const heroHeight = Math.min(cardH * 0.42, 620);
  ctx.save();
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
      const scale = Math.max(cardW / coverImg.width, heroHeight / coverImg.height);
      const sw = cardW / scale;
      const sh = heroHeight / scale;
      const sx = (coverImg.width - sw) / 2;
      const sy = (coverImg.height - sh) / 2;
      ctx.drawImage(coverImg, sx, sy, sw, sh, cardX, cardY, cardW, heroHeight);

      const overlayGradient = ctx.createLinearGradient(cardX, cardY + heroHeight - 140, cardX, cardY + heroHeight);
      overlayGradient.addColorStop(0, "rgba(2,6,23,0)");
      overlayGradient.addColorStop(1, "rgba(2,6,23,0.75)");
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(cardX, cardY + heroHeight - 140, cardW, 140);
    } catch {
      drawFallbackHero(ctx, cardX, cardY, cardW, heroHeight, typeStyle);
    }
  } else {
    drawFallbackHero(ctx, cardX, cardY, cardW, heroHeight, typeStyle);
  }
  ctx.restore();

  // 顶部标签
  const tagX = cardX + 36;
  const tagY = cardY + 36;
  drawRoundedRect(ctx, tagX, tagY, 140, 44, 22, "rgba(255,255,255,0.9)");
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = typeStyle.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(`${typeStyle.icon} ${typeStyle.label}`, tagX + 70, tagY + 22);
  ctx.textAlign = "left";

  let currentY = cardY + heroHeight + 48;
  const contentX = cardX + 48;
  const contentWidth = cardW - 96;

  // 标题
  ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#0f172a";
  currentY = wrapText(ctx, data.title, contentX, currentY, contentWidth, 58, 2);
  currentY += 16;

  // 描述
  if (data.description) {
    ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#475569";
    currentY = wrapText(ctx, data.description, contentX, currentY, contentWidth, 36, 4);
    currentY += 32;
  }

  // 作者
  const avatarY = currentY;
  if (data.authorAvatar) {
    try {
      const avatarImg = await loadImage(data.authorAvatar);
      drawCircleImage(ctx, avatarImg, contentX, avatarY, 36);
    } catch {
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(contentX + 36, avatarY + 36, 36, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(contentX + 36, avatarY + 36, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(data.authorName || "匿名钓友", contentX + 80, avatarY + 22);
  ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("分享自 路亚记", contentX + 80, avatarY + 48);

  currentY = avatarY + 80;

  // 统计信息
  if (data.stats && data.stats.length > 0) {
    currentY += 16;
    const statRows = [];
    const stats = data.stats.slice(0, 6);
    for (let i = 0; i < stats.length; i += 3) {
      statRows.push(stats.slice(i, i + 3));
    }
    statRows.forEach((row) => {
      const rowHeight = 120;
      drawRoundedRect(ctx, contentX, currentY, contentWidth, rowHeight, 24, "#f8fafc");
      const colWidth = contentWidth / row.length;
      row.forEach((stat, idx) => {
        const centerX = contentX + colWidth * idx + colWidth / 2;
        ctx.textAlign = "center";
        ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = typeStyle.color;
        ctx.fillText(String(stat.value), centerX, currentY + 48);
        ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(stat.label, centerX, currentY + 82);
      });
      ctx.textAlign = "left";
      currentY += rowHeight + 20;
    });
  }

  currentY += 10;

  // 高光提示
  drawRoundedRect(ctx, contentX, currentY, contentWidth, 120, 24, "#fff7ed", "#fed7aa");
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#c2410c";
  ctx.fillText("亮点速览", contentX + 24, currentY + 32);
  ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#9a3412";
  const highlightText =
    data.description && data.description.length > 0
      ? data.description
      : "装备、组合、渔轮一应俱全，欢迎围观我的豪华库房。";
  wrapText(ctx, highlightText, contentX + 24, currentY + 54, contentWidth - 48, 28, 3);
  currentY += 140;

  // 底部二维码区域
  const qrBlockHeight = 260;
  if (currentY + qrBlockHeight > cardY + cardH - 80) {
    currentY = cardY + cardH - qrBlockHeight - 80;
  }
  drawRoundedRect(ctx, contentX, currentY, contentWidth, qrBlockHeight, 28, "#0f172a");

  const qrSize = 180;
  const qrX = contentX + contentWidth - qrSize - 40;
  const qrY = currentY + (qrBlockHeight - qrSize) / 2;

  let qrImageUrl = data.qrCodeUrl;
  if (!qrImageUrl && shareUrl) {
    try {
      qrImageUrl = await QRCode.toDataURL(shareUrl, {
        width: 512,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch (err) {
      console.error("二维码生成失败:", err);
    }
  }

  if (qrImageUrl) {
    try {
      const qrImg = await loadImage(qrImageUrl);
      drawRoundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 20, "#ffffff");
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch (err) {
      console.error("二维码加载失败:", err);
    }
  }

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("长按识别二维码", contentX + 32, currentY + 70);
  ctx.font = "18px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#cbd5f5";
  ctx.fillText("进入路亚记，查看完整装备库详情", contentX + 32, currentY + 110);

  if (shareUrl) {
    const prettyUrl = shareUrl.replace(/^https?:\/\//, "");
    ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#94a3b8";
    const truncated = prettyUrl.length > 36 ? `${prettyUrl.slice(0, 36)}…` : prettyUrl;
    ctx.fillText(truncated, contentX + 32, currentY + qrBlockHeight - 32);
  }

  return canvas.toDataURL("image/png", 0.92);
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
      let resultUrl: string | null = null;

      if (shareUrl) {
        try {
          const screenshotImage = await captureSharePageScreenshot(shareUrl);
          resultUrl = await composeLongScreenshot(canvasRef.current!, screenshotImage, data, shareUrl);
        } catch (longShotError) {
          console.warn("截取长图失败，使用默认卡片:", longShotError);
        }
      }

      if (!resultUrl) {
        resultUrl = await generateDefaultCard(canvasRef.current, data, shareUrl);
      }

      setImageUrl(resultUrl);
      return resultUrl;
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
