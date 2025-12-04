"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Fish,
  User,
  Trophy,
  Calendar,
  Percent,
  CheckCircle2,
  Download,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

interface DexData {
  user: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  summary: {
    unlockedCount: number;
    totalCount: number;
    completionRate: number;
    totalCatches: number;
  };
  species: {
    id: string;
    name: string;
    imageUrl: string | null;
    habitatType: string | null;
    isUnlocked: boolean;
    totalCount: number;
    firstCaughtAt: string | null;
  }[];
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function ShareDexClient({ userId }: { userId: string }) {
  const [data, setData] = useState<DexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDex() {
      try {
        const res = await fetch(`/api/share/dex/${userId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || "获取失败");
          return;
        }
        setData(json.data);
      } catch (e) {
        console.error("获取图鉴失败:", e);
        setError("网络异常，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
    fetchDex();
  }, [userId]);

  if (loading) return <DexSkeleton />;
  if (error || !data) return <ErrorState error={error || "未知错误"} />;

  const { user, summary, species } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto"></div>
        <Button size="sm" variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur text-slate-800 pointer-events-auto" asChild>
          <Link href="/auth/register">
            <Download className="w-4 h-4 mr-1.5" />
            查看更多
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative bg-slate-900 overflow-hidden pb-12 pt-20 px-6">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full border-4 border-white/10 overflow-hidden bg-slate-800 mb-4 shadow-xl">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 m-5 text-slate-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{user.nickname}的图鉴</h1>
          <p className="text-slate-400 text-sm mb-8 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {dateFormatter.format(new Date(user.createdAt))} 加入路亚记
          </p>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <StatItem 
              value={summary.unlockedCount} 
              label="已解锁" 
              sub={`/${summary.totalCount}`}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            />
            <StatItem 
              value={`${summary.completionRate}%`} 
              label="完成度" 
              icon={<Percent className="w-4 h-4 text-blue-400" />}
            />
            <StatItem 
              value={summary.totalCatches} 
              label="总渔获" 
              icon={<Fish className="w-4 h-4 text-amber-400" />}
            />
          </div>
        </div>
      </div>

      {/* 鱼种列表 */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-t-3xl min-h-[500px] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              解锁记录
            </h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {species.length} 种
            </span>
          </div>

          {species.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fish className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500">暂未解锁任何鱼种</p>
              <p className="text-sm text-slate-400 mt-1">快去钓鱼解锁图鉴吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {species.map((fish) => (
                <FishCard key={fish.id} fish={fish} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部悬浮引导栏 */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
          <div>
            <p className="font-bold text-sm">路亚记 Luyaji</p>
            <p className="text-xs text-slate-300">点亮你的专属图鉴</p>
          </div>
          <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-medium" asChild>
            <Link href="/auth/register">
              立即体验
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label, sub, icon }: { value: string | number; label: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/5">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-white font-bold text-lg leading-none mb-1">
        {value}
        {sub && <span className="text-white/50 text-xs font-normal ml-0.5">{sub}</span>}
      </div>
      <div className="text-white/60 text-xs">{label}</div>
    </div>
  );
}

function FishCard({ fish }: { fish: DexData["species"][0] }) {
  return (
    <div className="group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1">
      <div className="aspect-square p-4 flex items-center justify-center bg-white">
        {fish.imageUrl ? (
          <img
            src={fish.imageUrl}
            alt={fish.name}
            className="w-full h-full object-contain transition-transform group-hover:scale-110"
          />
        ) : (
          <Fish className="w-12 h-12 text-slate-200" />
        )}
      </div>
      
      <div className="absolute top-2 right-2">
        <Badge
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 border-0",
            fish.habitatType === "fresh"
              ? "bg-blue-100 text-blue-700"
              : fish.habitatType === "salt"
              ? "bg-cyan-100 text-cyan-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {fish.habitatType === "fresh" ? "淡水" : fish.habitatType === "salt" ? "海水" : "通用"}
        </Badge>
      </div>

      <div className="p-3 border-t border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm truncate text-center">{fish.name}</h3>
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500 font-normal">
            ×{fish.totalCount}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Fish className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">无法加载内容</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">{error || "图鉴不存在"}</p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}

function DexSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 pb-12 pt-20 px-6">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-20 h-20 rounded-full bg-white/10" />
          <Skeleton className="h-8 w-32 bg-white/10" />
          <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-4">
            <Skeleton className="h-20 rounded-2xl bg-white/10" />
            <Skeleton className="h-20 rounded-2xl bg-white/10" />
            <Skeleton className="h-20 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-t-3xl min-h-[500px] p-6 shadow-lg space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
