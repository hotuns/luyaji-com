"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { Share2, Copy, Check, Link2, Loader2, Image, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { useShareImage } from "./share-image";

export interface ShareConfig {
  /** 分享类型 */
  type: "combo" | "trip" | "dex" | "gear";
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
  /** 作者昵称 */
  authorName?: string;
  /** 作者头像 */
  authorAvatar?: string;
  /** 统计数据 */
  stats?: { label: string; value: string | number }[];
  /** 额外上下文字段，可在模板中引用 */
  meta?: Record<string, string | number | undefined>;
}

interface ShareDialogProps {
  config: ShareConfig;
  trigger?: React.ReactNode;
  className?: string;
  /** 受控模式：外部控制 open 状态 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// 生成短链接
async function getShortUrl(config: ShareConfig): Promise<string> {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  
  try {
    const res = await fetch("/api/short-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: config.type,
        targetId: config.id,
      }),
    });
    
    const data = await res.json();
    if (data.success && data.data?.code) {
      return `${baseUrl}/s/${data.data.code}`;
    }
  } catch (error) {
    console.error("获取短链接失败:", error);
  }
  
  // 降级到完整链接
  return `${baseUrl}/share/${config.type}/${config.id}`;
}

// 生成默认分享文案（使用占位符，后续替换）
function getDefaultShareText(config: ShareConfig, url: string): string {
  switch (config.type) {
    case "combo":
      return `🎣 我的路亚装备组合「${config.title}」\n${config.description || ""}\n\n👉 点击查看详情：${url}`;
    case "trip":
      return `🐟 我的路亚出击记录「${config.title}」\n${config.description || ""}\n\n👉 点击查看详情：${url}`;
    case "dex":
      return `📚 我的路亚图鉴成就\n${config.description || ""}\n\n👉 点击查看我的图鉴：${url}`;
    case "gear": {
      const totalValue =
        config.meta?.totalValue ??
        config.stats?.find(
          (s) =>
            typeof s.label === "string" &&
            (s.label.includes("价值") ||
              s.label.toLowerCase().includes("value"))
        )?.value;
      const totalValueText = totalValue ? `💸 总价值 ${totalValue}` : "💸 我的装备投入真不少";
      return `🧰 我的装备库更新啦\n${config.description || ""}\n\n${totalValueText}\n👉 点击查看全部装备：${url}`;
    }
    default:
      return `来看看我在路亚记的分享：${url}`;
  }
}

export function useShareConfig(type: ShareConfig['type'], data: Record<string, unknown>): ShareConfig {
  return useMemo(() => {
    if (type === "combo") {
      const rod = data.rod as { name?: string } | undefined;
      const reel = data.reel as { name?: string } | undefined;
      const rodName = rod?.name || "未知鱼竿";
      const reelName = reel?.name || "未知渔轮";
      const lineInfo = [
        data.mainLineText ? `主线 ${data.mainLineText}` : "",
        data.leaderLineText ? `子线 ${data.leaderLineText}` : ""
      ].filter(Boolean).join(" / ");
      
      return {
        type,
        id: data.id as string,
        title: data.name as string,
        description: `${rodName} + ${reelName}${lineInfo ? `\n${lineInfo}` : ""}`,
        imageUrl: (data.photoUrls as string[] | undefined)?.[0],
      };
    }
    
    // Default fallback for other types or direct passing
    return {
      type,
      id: data.id as string,
      title: (data.title as string) || "分享",
      description: data.description as string | undefined,
      imageUrl: data.imageUrl as string | undefined,
      defaultText: data.defaultText as string | undefined,
      authorName: data.authorName as string | undefined,
      authorAvatar: data.authorAvatar as string | undefined,
      stats: data.stats as { label: string; value: string | number }[] | undefined,
    };
  }, [type, data.id, data.name, data.title, data.description, data.imageUrl, data.photoUrls, data.mainLineText, data.leaderLineText, data.rod, data.reel, data.authorName, data.authorAvatar, data.stats]);
}

type ShareTab = "link" | "image";

type ShareTemplatePayload = {
  id: string;
  type: string;
  description: string | null;
};

const applyShareTemplate = (
  template: string,
  context: Record<string, string | undefined>,
) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const normalizedKey = String(key).trim().toLowerCase();
    switch (normalizedKey) {
      case "title":
        return context.title ?? "";
      case "description":
        return context.description ?? "";
      case "author":
      case "authorname":
        return context.authorName ?? "";
      case "url":
        return context.url ?? "";
      default:
        return context[normalizedKey] ?? "";
    }
  });
};

export function ShareDialog({ config, trigger, className, open: controlledOpen, onOpenChange }: ShareDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;
  
  const [activeTab, setActiveTab] = useState<ShareTab>("link");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [shareText, setShareText] = useState<string>("");
  const userEditedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  
  // 分享图片相关
  const shareImage = useShareImage();
  const { data: session } = useSession();
  const resolvedAuthorName = config.authorName || session?.user?.name || "钓友";
  const resolvedAuthorAvatar = config.authorAvatar || (session?.user?.image ?? undefined);

  // 当弹窗打开时获取短链接
  useEffect(() => {
    if (open && !shareUrl) {
      setLoading(true);
      getShortUrl(config).then((url) => {
        setShareUrl(url);
        setShareText(config.defaultText || getDefaultShareText(config, url));
        userEditedRef.current = false;
        setLoading(false);
      });
    }
  }, [open, config, shareUrl]);

  // 当 config 变化时重置
  useEffect(() => {
    setShareUrl("");
    setShareText("");
    setActiveTab("link");
    shareImage.reset();
    userEditedRef.current = false;
  }, [config.id, shareImage.reset]);

  // 当切换到图片 tab 时自动生成图片
  useEffect(() => {
    if (activeTab === "image" && shareUrl && !shareImage.imageUrl && !shareImage.generating) {
        shareImage.generate({
          type: config.type,
          title: config.title,
          description: config.description,
          imageUrl: config.imageUrl,
          authorName: resolvedAuthorName,
          authorAvatar: resolvedAuthorAvatar,
          stats: config.stats,
        }, shareUrl);
    }
  }, [activeTab, shareUrl, config, shareImage, resolvedAuthorName, resolvedAuthorAvatar]);

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

  const templateContext = useMemo(() => {
    const context: Record<string, string | undefined> = {
      title: config.title,
      description: config.description || "",
      authorName: resolvedAuthorName,
      url: shareUrl,
    };

    if (config.meta) {
      Object.entries(config.meta).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        context[key.toLowerCase()] = typeof value === "string" ? value : String(value);
      });
    }

    if (config.stats) {
      config.stats.forEach((stat) => {
        if (!stat.label) return;
        const normalized = `stat_${stat.label}`
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();
        if (!normalized) return;
        context[normalized] = stat.value !== undefined ? String(stat.value) : "";
      });
    }

    return context;
  }, [config.title, config.description, resolvedAuthorName, shareUrl, config.meta, config.stats]);

  useEffect(() => {
    if (!open || !shareUrl || userEditedRef.current) return;
    let cancelled = false;
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/share/templates?type=${config.type}&take=10`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success || cancelled) return;
        const templates: ShareTemplatePayload[] = json.data ?? [];
        if (templates.length === 0) return;
        const picked =
          templates[Math.floor(Math.random() * templates.length)];
        if (!picked?.description || userEditedRef.current) return;
        const applied = applyShareTemplate(picked.description, templateContext);
        if (applied.trim()) {
          setShareText(applied);
        }
      } catch (error) {
        console.error("加载分享模板失败:", error);
      }
    };
    void fetchTemplate();
    return () => {
      cancelled = true;
    };
  }, [config.type, templateContext, open, shareUrl]);

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

        <div className="p-6 space-y-5 bg-white overflow-y-auto">
          {/* 标签页切换 */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("link")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === "link"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Link2 className="w-4 h-4" />
              复制链接
            </button>
            <button
              onClick={() => setActiveTab("image")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === "image"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Image className="w-4 h-4" />
              生成图片
            </button>
          </div>

          {/* 链接分享内容 */}
          {activeTab === "link" && (
            <>
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
                    {loading ? (
                      <span className="text-slate-400 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        生成中...
                      </span>
                    ) : (
                      shareUrl
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleCopyLink}
                    disabled={loading}
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
                  onChange={(e) => {
                    setShareText(e.target.value);
                    userEditedRef.current = true;
                  }}
                  className="min-h-[100px] text-sm resize-none bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={loading}
                />
              </div>

              {/* 复制按钮 */}
              <Button 
                className={cn("w-full rounded-xl h-11 font-medium shadow-lg shadow-blue-500/20 transition-all", copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700")}
                onClick={handleCopyText}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 准备中...
                  </>
                ) : copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" /> 已复制全部内容
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" /> 复制文案和链接
                  </>
                )}
              </Button>
            </>
          )}

          {/* 图片分享内容 */}
          {activeTab === "image" && (
            <>
              {/* 图片预览区 */}
              <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[300px]">
                {shareImage.generating ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">正在生成分享图...</p>
                  </div>
                ) : shareImage.error ? (
                  <div className="text-center">
                    <p className="text-sm text-red-500 mb-3">{shareImage.error}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => shareImage.generate({
                        type: config.type,
                        title: config.title,
                        description: config.description,
                        imageUrl: config.imageUrl,
                        authorName: config.authorName,
                        authorAvatar: config.authorAvatar,
                        stats: config.stats,
                      }, shareUrl)}
                    >
                      重新生成
                    </Button>
                  </div>
                ) : shareImage.imageUrl ? (
                  <img 
                    src={shareImage.imageUrl} 
                    alt="分享图片" 
                    className="max-w-full max-h-[400px] rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Image className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">图片生成中...</p>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 rounded-xl h-11"
                  onClick={() => {
                    if (shareImage.imageUrl) {
                      navigator.clipboard.writeText(shareImage.imageUrl);
                    }
                  }}
                  disabled={!shareImage.imageUrl || shareImage.generating}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制图片
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                  onClick={shareImage.download}
                  disabled={!shareImage.imageUrl || shareImage.generating}
                >
                  <Download className="w-4 h-4 mr-2" />
                  保存图片
                </Button>
              </div>
              
              <p className="text-xs text-slate-400 text-center">
                长按图片可保存到相册，或点击保存按钮下载
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
