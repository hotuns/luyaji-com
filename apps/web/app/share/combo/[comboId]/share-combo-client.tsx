"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Fish,
  Anchor,
  Layers,
  Heart,
  User,
  Calendar,
  Download,
  Ruler,
  Weight,
  Zap,
  Disc,
} from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface ComboDetail {
  id: string;
  name: string;
  visibility: string;
  mainLineText: string | null;
  leaderLineText: string | null;
  hookText: string | null;
  lures: unknown;
  sceneTags: unknown;
  detailNote: string | null;
  photoUrls: string[] | null;
  likeCount: number;
  catchCount: number;
  createdAt: string;
  updatedAt: string;
  rod: {
    id: string;
    name: string;
    brand: string | null;
    length: number | null;
    lengthUnit: string | null;
    power: string | null;
    lureWeightMin: number | null;
    lureWeightMax: number | null;
    lineWeightText: string | null;
  } | null;
  reel: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    gearRatioText: string | null;
    lineCapacityText: string | null;
  } | null;
  user: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

export default function ShareComboClient({ comboId }: { comboId: string }) {
  const [combo, setCombo] = useState<ComboDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    async function fetchCombo() {
      try {
        const res = await fetch(`/api/share/combo/${comboId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || "获取失败");
          return;
        }
        setCombo(json.data);
      } catch (e) {
        console.error("获取组合详情失败:", e);
        setError("网络异常，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
    fetchCombo();
  }, [comboId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsEmbed(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (!loading && !error && combo) {
      body.setAttribute("data-share-ready", "true");
      return () => body.removeAttribute("data-share-ready");
    }
    return undefined;
  }, [loading, error, combo]);

  if (loading) return <ComboSkeleton />;
  if (error || !combo) return <ErrorState error={error || "未知错误"} />;

  const photoUrls = combo.photoUrls || [];
  const sceneTags = Array.isArray(combo.sceneTags) ? combo.sceneTags : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto"></div>
        {!isEmbed && (
          <Button size="sm" variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur text-slate-800 pointer-events-auto" asChild>
            <Link href="/auth/register">
              <Download className="w-4 h-4 mr-1.5" />
              查看更多
            </Link>
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[320px]">
        {photoUrls.length > 0 ? (
          <img src={photoUrls[0]} alt={combo.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <Layers className="w-20 h-20 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden bg-slate-800">
              {combo.user.avatarUrl ? (
                <img src={combo.user.avatarUrl} alt={combo.user.nickname} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 m-2 text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-white/90">{combo.user.nickname}</p>
              <p className="text-xs text-white/60">分享了装备组合</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-3 leading-tight">{combo.name}</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
              <Heart className="w-3 h-3 mr-1" /> {combo.likeCount}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
              <Fish className="w-3 h-3 mr-1" /> {combo.catchCount} 渔获
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* 装备详情卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 鱼竿部分 */}
          <div className="p-5 relative">
            <div className="absolute top-5 right-5 text-slate-200">
              <Fish className="w-12 h-12 opacity-20" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">ROD</Badge>
              <span className="text-xs text-slate-400">鱼竿</span>
            </div>
            {combo.rod ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{combo.rod.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{combo.rod.brand}</p>
                <div className="grid grid-cols-3 gap-2">
                  <SpecItem icon={<Ruler className="w-3 h-3" />} label="长度" value={`${combo.rod.length}${combo.rod.lengthUnit || 'm'}`} />
                  <SpecItem icon={<Zap className="w-3 h-3" />} label="硬度" value={combo.rod.power || '-'} />
                  <SpecItem icon={<Weight className="w-3 h-3" />} label="饵重" value={`${combo.rod.lureWeightMin || '?'}-${combo.rod.lureWeightMax || '?'}g`} />
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm">未设置</p>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          {/* 渔轮部分 */}
          <div className="p-5 relative bg-slate-50/50">
            <div className="absolute top-5 right-5 text-slate-200">
              <Anchor className="w-12 h-12 opacity-20" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100">REEL</Badge>
              <span className="text-xs text-slate-400">渔轮</span>
            </div>
            {combo.reel ? (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{combo.reel.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{combo.reel.brand}</p>
                <div className="grid grid-cols-2 gap-2">
                  <SpecItem icon={<Disc className="w-3 h-3" />} label="速比" value={combo.reel.gearRatioText || '-'} />
                  <SpecItem icon={<Layers className="w-3 h-3" />} label="型号" value={combo.reel.model || '-'} />
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm">未设置</p>
            )}
          </div>
        </div>

        {/* 线组配置 */}
        {(combo.mainLineText || combo.leaderLineText || combo.hookText) && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">线组配置</h3>
              <div className="space-y-3">
                {combo.mainLineText && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">主线</span>
                    <span className="font-medium text-slate-900">{combo.mainLineText}</span>
                  </div>
                )}
                {combo.leaderLineText && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">子线</span>
                    <span className="font-medium text-slate-900">{combo.leaderLineText}</span>
                  </div>
                )}
                {combo.hookText && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">钩类</span>
                    <span className="font-medium text-slate-900">{combo.hookText}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 场景标签 */}
        {sceneTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sceneTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 px-3 py-1">
                #{String(tag)}
              </Badge>
            ))}
          </div>
        )}

        {/* 详细说明 */}
        {combo.detailNote && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2 text-sm">详细说明</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {combo.detailNote}
            </p>
          </div>
        )}
      </div>

      {/* 底部悬浮引导栏 */}
      {!isEmbed && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
            <div>
              <p className="font-bold text-sm">路亚记 Luyaji</p>
              <p className="text-xs text-slate-300">发现更多强力装备</p>
            </div>
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-medium" asChild>
              <Link href="/auth/register">
                立即体验
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-100/50 rounded-lg p-2">
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-medium text-slate-900 text-sm truncate">{value}</div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Layers className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">无法加载内容</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">{error || "该组合可能已被删除或设为私有"}</p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}

function ComboSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Skeleton className="h-[45vh] w-full" />
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
