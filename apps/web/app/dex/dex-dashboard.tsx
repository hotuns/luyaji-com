"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FishDexEntry, FishDexPayload } from "@/lib/dex";
import { cn } from "@workspace/ui/lib/utils";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Fish, Lock, Trophy } from "lucide-react";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "unlocked", label: "已解锁" },
];

export function DexDashboard() {
  const [data, setData] = useState<FishDexPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dex", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("获取图鉴数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <DexSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-slate-700 font-medium mb-2">图鉴数据加载失败</p>
        <p className="text-slate-400 text-sm mb-4">可能是网络问题或暂时的服务异常，稍后再试试。</p>
        <button
          className="px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          onClick={() => location.reload()}
        >
          刷新重试
        </button>
      </div>
    );
  }

  return <DexContent summary={data.summary} species={data.species} filter={filter} setFilter={setFilter} />;
}

function DexSkeleton() {
  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 顶部统计区骨架 */}
      <div className="bg-slate-900 p-6 md:p-10 rounded-2xl">
        <Skeleton className="h-8 w-32 bg-slate-700 mb-2" />
        <Skeleton className="h-5 w-48 bg-slate-700 mb-6" />
        <Skeleton className="h-3 w-full bg-slate-700 rounded-full" />
      </div>

      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white border-none shadow-sm p-3 text-center">
            <Skeleton className="h-7 w-12 mx-auto mb-1" />
            <Skeleton className="h-4 w-10 mx-auto" />
          </Card>
        ))}
      </div>

      {/* 鱼种网格骨架 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200">
              <Skeleton className="h-12 w-12 mx-auto mb-3 rounded-full" />
              <Skeleton className="h-4 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type DexContentProps = {
  summary: FishDexPayload["summary"];
  species: FishDexPayload["species"];
  filter: string;
  setFilter: (filter: string) => void;
};

function DexContent({ summary, species, filter, setFilter }: DexContentProps) {

  const filteredSpecies = useMemo(() => {
    if (filter === "unlocked") {
      return species.filter((item) => item.unlocked);
    }
    return species;
  }, [filter, species]);

  const unlockRate = summary.totalSpecies
    ? Math.round((summary.unlockedSpecies / summary.totalSpecies) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 顶部统计区 - 匹配 Demo DexView 的暗色头部 */}
      <div className="bg-slate-900 text-white p-6 md:p-10 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">渔获图鉴</h2>
          <p className="text-slate-400 text-sm md:text-base mb-6">
            收集进度: <span className="text-white font-mono text-xl">{summary.unlockedSpecies}</span>{" "}
            <span className="mx-1">/</span> {summary.totalSpecies}
          </p>
          <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-1000" 
              style={{ width: `${unlockRate}%` }}
            />
          </div>
        </div>
        <Fish className="absolute -right-6 -bottom-6 text-slate-800 opacity-50" size={140} />
        <Fish className="absolute right-32 top-10 text-slate-800 opacity-20 hidden md:block" size={80} />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="已解锁" value={summary.unlockedSpecies} helper={`共 ${summary.totalSpecies} 种`} />
        <StatCard label="总渔获" value={summary.totalCatch} helper="累计记录" />
        <StatCard label="完成度" value={`${unlockRate}%`} helper="图鉴完成率" />
      </div>

      {/* 鱼种图鉴网格 */}
      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4 min-h-[400px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">鱼种图鉴</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filter === "all" ? "收集进度" : "已解锁鱼种"}
            </p>
          </div>
          {/* Custom Tabs like Demo */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  filter === item.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredSpecies.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Fish size={32} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              {filter === "unlocked"
                ? "你还没有解锁任何鱼种，先去完成一两次出击吧～"
                : "暂无鱼种数据，可以在后台添加鱼种基础信息。"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredSpecies.map((entry) => (
              <FishCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number | string; helper?: string }) {
  return (
    <Card className="bg-white border-none shadow-sm p-3 text-center">
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
      {helper && <p className="text-[10px] text-slate-300 mt-1">{helper}</p>}
    </Card>
  );
}

function FishCard({ entry }: { entry: FishDexEntry }) {
  const isUnlocked = entry.unlocked;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            "group relative p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-300 cursor-pointer",
            isUnlocked 
              ? "bg-white border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-md" 
              : "bg-slate-50 border-slate-100 grayscale opacity-60"
          )}
        >
          {/* 图标区域 */}
          <div className="text-4xl md:text-5xl mb-3 filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">
            {isUnlocked ? (
              entry.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={entry.imageUrl} 
                  alt={entry.name} 
                  className="w-12 h-12 md:w-14 md:h-14 object-contain" 
                />
              ) : (
                <Fish size={48} className="text-blue-400" />
              )
            ) : (
              <Trophy size={32} className="text-slate-300" />
            )}
          </div>
          
          {/* 名称 */}
          <div className="font-bold text-slate-800 text-sm">
            {isUnlocked ? entry.name : "???"}
          </div>
          
          {/* 学名 */}
          <div className="text-[10px] text-slate-400 italic mb-2 h-3">
            {isUnlocked ? (entry.aliasNames[0] || "") : ""}
          </div>
          
          {/* 统计信息 */}
          {isUnlocked ? (
            <div className="w-full mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>已捕获</span>
              <span>{entry.totalCount}尾</span>
            </div>
          ) : (
            <div className="mt-auto pt-2 text-[10px] text-slate-400 flex items-center gap-1">
              <Trophy size={10} /> 待解锁
            </div>
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUnlocked ? (
              <>
                <span>{entry.name}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  已捕获 {entry.totalCount} 次
                </Badge>
              </>
            ) : (
              <span className="text-slate-500">未解锁鱼种</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUnlocked ? (
              entry.aliasNames.length > 0 ? `别名：${entry.aliasNames.join(" / ")}` : "暂无别名"
            ) : (
              "捕获该鱼种后解锁详细信息"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex justify-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            {isUnlocked ? (
              entry.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.imageUrl} alt={entry.name} className="h-32 object-contain" />
              ) : (
                <Fish size={96} className="text-blue-200" />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Lock size={48} />
                <span className="text-sm">???</span>
              </div>
            )}
          </div>

          {isUnlocked && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">首次捕获</p>
                  <p className="font-medium text-slate-800">{formatDate(entry.firstCaughtAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">最近捕获</p>
                  <p className="font-medium text-slate-800">{formatDate(entry.lastCaughtAt)}</p>
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <Link
                  href={`/stats?speciesId=${encodeURIComponent(entry.id)}`}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  查看该鱼的历史钓鱼记录
                </Link>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(date: string | null) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
