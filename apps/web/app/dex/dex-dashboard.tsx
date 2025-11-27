"use client";

import { useMemo, useState } from "react";
import { FishDexEntry, FishDexPayload } from "@/lib/dex";
import { cn } from "@workspace/ui/lib/utils";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Fish, Lock } from "lucide-react";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "unlocked", label: "已解锁" },
];

type DexDashboardProps = FishDexPayload;

export function DexDashboard({ summary, species }: DexDashboardProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

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
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="已解锁" value={summary.unlockedSpecies} helper={`共 ${summary.totalSpecies} 种`} />
        <StatCard label="总渔获" value={summary.totalCatch} helper="累计记录" />
        <StatCard label="完成度" value={`${unlockRate}%`} helper="图鉴完成率" />
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4 min-h-[500px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">鱼种图鉴</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {filter === "all" ? "收集进度" : "已解锁鱼种"}
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filter === item.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Fish className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {filter === "unlocked" ? "你还没有解锁任何鱼种，快去钓鱼吧！" : "暂无鱼种数据"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {filteredSpecies.map((species) => (
              <FishCard key={species.id} entry={species} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number | string; helper?: string }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm">
      <CardContent className="py-3 px-2 text-center">
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
        {helper && <p className="text-[10px] text-gray-400 mt-1 scale-90">{helper}</p>}
      </CardContent>
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
            "aspect-[3/4] relative rounded-xl border-2 transition-all cursor-pointer group overflow-hidden",
            isUnlocked
              ? "bg-white border-blue-100 hover:border-blue-300 hover:shadow-md"
              : "bg-gray-50 border-gray-100 hover:border-gray-200"
          )}
        >
          {/* Background Pattern or Effect */}
          <div className={cn(
            "absolute inset-0 opacity-10 pointer-events-none",
            isUnlocked ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gray-200"
          )} />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center p-2">
            {/* Count Badge */}
            <div className="w-full flex justify-end">
              {isUnlocked && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  x{entry.totalCount}
                </span>
              )}
            </div>

            {/* Image Area */}
            <div className="flex-1 flex items-center justify-center w-full relative">
              {isUnlocked ? (
                entry.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={entry.imageUrl} 
                    alt={entry.name} 
                    className="w-16 h-16 object-contain drop-shadow-sm transition-transform group-hover:scale-110" 
                  />
                ) : (
                  <Fish className="w-12 h-12 text-blue-400" />
                )
              ) : (
                <Lock className="w-8 h-8 text-gray-300" />
              )}
            </div>

            {/* Name */}
            <div className="w-full text-center mt-1">
              <p className={cn(
                "text-xs font-medium truncate px-1 py-1 rounded-md",
                isUnlocked ? "text-gray-900 bg-white/50" : "text-gray-400"
              )}>
                {isUnlocked ? entry.name : "???"}
              </p>
            </div>
          </div>
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
              <span className="text-gray-500">未解锁鱼种</span>
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
          <div className="flex justify-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            {isUnlocked ? (
              entry.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.imageUrl} alt={entry.name} className="h-32 object-contain" />
              ) : (
                <Fish className="h-24 w-24 text-blue-200" />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Lock className="h-12 w-12" />
                <span className="text-sm">???</span>
              </div>
            )}
          </div>

          {isUnlocked && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">首次捕获</p>
                <p className="font-medium">{formatDate(entry.firstCaughtAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">最近捕获</p>
                <p className="font-medium">{formatDate(entry.lastCaughtAt)}</p>
              </div>
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
