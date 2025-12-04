"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Share2, Copy, Check, Link2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

export interface ShareConfig {
  /** 分享类型 */
  type: "combo" | "trip" | "dex";
  /** 资源 ID */
  id: string;
  /** 分享标题 */
  title: string;
  /** 分享描述 */
  description?: string;
  /** 封面图片 URL */
  imageUrl?: string;
  /** 自定义分享文案（用户可编辑） */
  defaultText?: string;
}

interface ShareDialogProps {
  config: ShareConfig;
  trigger?: React.ReactNode;
  className?: string;
  /** 受控模式：外部控制 open 状态 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// 生成分享链接
function getShareUrl(config: ShareConfig): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/share/${config.type}/${config.id}`;
}

// 生成默认分享文案
function getDefaultShareText(config: ShareConfig): string {
  const url = getShareUrl(config);
  
  switch (config.type) {
    case "combo":
      return `🎣 我的路亚装备组合「${config.title}」\n${config.description || ""}\n\n👉 点击查看详情：${url}`;
    case "trip":
      return `🐟 我的路亚出击记录「${config.title}」\n${config.description || ""}\n\n👉 点击查看详情：${url}`;
    case "dex":
      return `📚 我的路亚图鉴成就\n${config.description || ""}\n\n👉 点击查看我的图鉴：${url}`;
    default:
      return `来看看我在路亚记的分享：${url}`;
  }
}

export function useShareConfig(type: ShareConfig['type'], data: any): ShareConfig {
  return useMemo(() => {
    if (type === "combo") {
      const rodName = data.rod?.name || "未知鱼竿";
      const reelName = data.reel?.name || "未知渔轮";
      const lineInfo = [
        data.mainLineText ? `主线 ${data.mainLineText}` : "",
        data.leaderLineText ? `子线 ${data.leaderLineText}` : ""
      ].filter(Boolean).join(" / ");
      
      return {
        type,
        id: data.id,
        title: data.name,
        description: `${rodName} + ${reelName}${lineInfo ? `\n${lineInfo}` : ""}`,
        imageUrl: data.photoUrls?.[0],
      };
    }
    
    // Default fallback for other types or direct passing
    return {
      type,
      id: data.id,
      title: data.title || "分享",
      description: data.description,
      imageUrl: data.imageUrl,
      defaultText: data.defaultText,
    };
  }, [type, JSON.stringify(data)]);
}

export function ShareDialog({ config, trigger, className, open: controlledOpen, onOpenChange }: ShareDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareText, setShareText] = useState(() => 
    config.defaultText || getDefaultShareText(config)
  );

  // 当 config 变化时重置文案
  useEffect(() => {
    setShareText(config.defaultText || getDefaultShareText(config));
  }, [config.id, config.title, config.description, config.defaultText]);

  const shareUrl = getShareUrl(config);

  // 复制文案+链接
  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
      // 降级方案
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  // 仅复制链接
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("复制链接失败:", err);
    }
  }, [shareUrl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn("sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 border-0 shadow-2xl", className)}>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white text-center relative flex-shrink-0">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-lg">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold mb-1">分享给好友</DialogTitle>
            <p className="text-slate-300 text-sm max-w-[80%] mx-auto">
              让更多钓友看到你的精彩时刻
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-white overflow-y-auto">
          {/* 预览卡片 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-4 items-start">
            <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
              {config.imageUrl ? (
                <img src={config.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Share2 className="w-8 h-8 opacity-50" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{config.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {config.description || "点击查看详情"}
              </p>
            </div>
          </div>

          {/* 链接区域 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">分享链接</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 truncate font-mono">
                {shareUrl}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyLink}
                className={cn("flex-shrink-0 transition-all", linkCopied && "text-green-600 border-green-200 bg-green-50")}
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* 文案编辑区 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">分享文案</label>
            <Textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              className="min-h-[100px] text-sm resize-none bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          {/* 底部按钮 */}
          <Button 
            className={cn("w-full rounded-xl h-11 font-medium shadow-lg shadow-blue-500/20 transition-all", copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700")}
            onClick={handleCopyText}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" /> 已复制全部内容
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" /> 复制文案和链接
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
