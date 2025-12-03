"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FishDexEntry, FishDexPayload } from "@/lib/dex";
import { cn } from "@workspace/ui/lib/utils";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { 
  Fish, 
  Lock, 
  Trophy, 
  Search, 
  Share2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Percent,
  ArrowRight
} from "lucide-react";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "unlocked", label: "已解锁" },
  { key: "locked", label: "未解锁" },
];

export function DexDashboard() {
  const [data, setData] = useState<FishDexPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [searchTerm, setSearchTerm] = useState("");

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
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Fish className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-slate-700 font-medium mb-2">图鉴数据加载失败</p>
        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">可能是网络问题或暂时的服务异常，请稍后再试。</p>
        <Button onClick={() => location.reload()} variant="outline">
          刷新重试
        </Button>
      </div>
    );
  }

  return (
    <DexContent 
      summary={data.summary} 
      species={data.species} 
      filter={filter} 
      setFilter={setFilter}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    />
  );
}

function DexSkeleton() {
  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 顶部统计区骨架 */}
      <div className="bg-slate-900 p-6 md:p-8 rounded-3xl">
        <div className="flex justify-between items-start">
          <div className="space-y-4 w-full">
            <Skeleton className="h-8 w-32 bg-slate-800" />
            <Skeleton className="h-4 w-48 bg-slate-800" />
            <Skeleton className="h-3 w-full max-w-md bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>

      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>

      {/* 鱼种网格骨架 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="aspect-[3/4] border-0 shadow-sm p-4 flex flex-col items-center justify-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 w-full flex flex-col items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </Card>
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

function DexContent({ summary, species, filter, setFilter, searchTerm, setSearchTerm }: DexContentProps) {
  const filteredSpecies = useMemo(() => {
    let result = species;

    // Filter by tab
    if (filter === "unlocked") {
      result = result.filter((item) => item.unlocked);
    } else if (filter === "locked") {
      result = result.filter((item) => !item.unlocked);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.aliasNames.some((alias) => alias.toLowerCase().includes(term))
      );
    }

    return result;
  }, [filter, species, searchTerm]);

  const unlockRate = summary.totalSpecies
    ? Math.round((summary.unlockedSpecies / summary.totalSpecies) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      {/* 顶部统计区 */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">渔获图鉴</h2>
              <p className="text-slate-400 text-sm md:text-base">
                探索未知的鱼种，记录每一次精彩的相遇。
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-emerald-400">{summary.unlockedSpecies}</div>
                <div className="text-xs text-slate-400">已解锁</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-white">{summary.totalSpecies}</div>
                <div className="text-xs text-slate-400">总鱼种</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-blue-400">{unlockRate}%</div>
                <div className="text-xs text-slate-400">完成度</div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>收集进度</span>
              <span>{unlockRate}%</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-1000 ease-out rounded-full" 
                style={{ width: `${unlockRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 筛选与搜索 */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-2 -my-2">
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-100 w-full md:w-auto">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all",
                filter === item.key
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="搜索鱼种名称..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 focus:border-blue-500 rounded-xl"
          />
        </div>
      </div>

      {/* 鱼种列表 */}
      <div className="min-h-[400px]">
        {filteredSpecies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">未找到相关鱼种</h3>
            <p className="text-slate-500 text-sm">
              {searchTerm ? "换个关键词试试看？" : "还没有解锁任何鱼种，快去钓鱼吧！"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredSpecies.map((entry) => (
              <FishCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FishCard({ entry }: { entry: FishDexEntry }) {
  const isUnlocked = entry.unlocked;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card 
          className={cn(
            "group relative overflow-hidden border-0 transition-all duration-300 cursor-pointer hover:-translate-y-1",
            isUnlocked 
              ? "bg-white shadow-sm hover:shadow-xl ring-1 ring-slate-100" 
              : "bg-slate-50 shadow-none opacity-80 hover:opacity-100"
          )}
        >
          {/* 背景装饰 */}
          {isUnlocked && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          )}

          <div className="p-5 flex flex-col items-center text-center relative z-10 h-full">
            {/* 状态角标 */}
            <div className="absolute top-0 left-0 p-3">
              {isUnlocked ? (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 gap-1 px-2">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-[10px]">已解锁</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 gap-1 px-2">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px]">未解锁</span>
                </Badge>
              )}
            </div>

            {/* 鱼图片 */}
            <div className="my-4 w-24 h-24 md:w-28 md:h-28 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
              {entry.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={entry.imageUrl} 
                  alt={entry.name} 
                  className={cn(
                    "w-full h-full object-contain",
                    isUnlocked ? "drop-shadow-md" : "grayscale opacity-60"
                  )}
                />
              ) : (
                <Fish className={cn(
                  "w-16 h-16",
                  isUnlocked ? "text-blue-300" : "text-slate-400 opacity-50"
                )} />
              )}
            </div>

            {/* 信息 */}
            <div className="mt-auto w-full space-y-1">
              <h3 className={cn(
                "font-bold text-base truncate px-2",
                isUnlocked ? "text-slate-800" : "text-slate-400"
              )}>
                {entry.name}
              </h3>
              
              <p className="text-xs text-slate-400 h-4 truncate px-2">
                {entry.aliasNames[0] || ""}
              </p>

              {isUnlocked && (
                <div className="pt-3 mt-2 border-t border-slate-100 w-full flex justify-between items-center text-xs">
                  <span className="text-slate-400">捕获</span>
                  <span className="font-mono font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {entry.totalCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0 border-0 rounded-2xl">
        {/* 弹窗头部背景 */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {entry.name}
                {!isUnlocked && <Lock className="w-5 h-5 text-slate-400" />}
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                {entry.aliasNames.join(" / ") || "暂无别名"}
              </DialogDescription>
            </div>
            {isUnlocked && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0">
                已捕获 {entry.totalCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 bg-white">
          {/* 大图展示 */}
          <div className="flex justify-center py-8 mb-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 relative">
            {entry.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={entry.imageUrl} 
                alt={entry.name} 
                className={cn(
                  "h-40 object-contain",
                  isUnlocked ? "drop-shadow-xl" : "grayscale opacity-60"
                )}
              />
            ) : (
              <Fish size={80} className={isUnlocked ? "text-blue-200" : "text-slate-300"} />
            )}
          </div>

          {isUnlocked ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3 h-3" />
                    首次捕获
                  </div>
                  <div className="font-medium text-slate-900">{formatDate(entry.firstCaughtAt)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3 h-3" />
                    最近捕获
                  </div>
                  <div className="font-medium text-slate-900">{formatDate(entry.lastCaughtAt)}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800" asChild>
                  <Link href={`/stats?speciesId=${encodeURIComponent(entry.id)}`}>
                    查看历史记录
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p>该鱼种尚未解锁。</p>
              <p className="mt-2">多去不同的水域尝试不同的钓法，</p>
              <p>也许就能遇到它！</p>
            </div>
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
