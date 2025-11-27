"use client";

import { useMemo, useState } from "react";
import { FishDexEntry, FishDexPayload } from "@/lib/dex";
import { cn } from "@workspace/ui/lib/utils";
import { Card, CardContent } from "@workspace/ui/components/card";

const FILTERS = [
  { key: "all", label: "全部图鉴" },
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
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="已解锁" value={summary.unlockedSpecies} helper={`共 ${summary.totalSpecies} 种`} />
        <StatCard label="总渔获" value={summary.totalCatch} helper="累计记录" />
        <StatCard label="完成度" value={`${unlockRate}%`} helper="图鉴完成率" />
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">鱼种图鉴</h2>
            <p className="text-sm text-gray-500">
              {filter === "all" ? "查看全部可记录鱼种" : "只看我钓到过的鱼"}
            </p>
          </div>
          <div className="flex gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border",
                  filter === item.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200"
                )}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filteredSpecies.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {filter === "unlocked" ? "你还没有解锁任何鱼种，快去钓鱼吧！" : "暂无鱼种数据"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
    <Card className="bg-white/80 backdrop-blur-sm border-none shadow">
      <CardContent className="py-4 text-center">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
        {helper && <p className="text-[11px] text-gray-400 mt-1">{helper}</p>}
      </CardContent>
    </Card>
  );
}

function FishCard({ entry }: { entry: FishDexEntry }) {
  const statusText = entry.unlocked
    ? `已解锁 · ${entry.totalCount} 条`
    : "未解锁";
  const statusColor = entry.unlocked ? "text-green-600" : "text-gray-400";

  return (
    <Card className={cn("overflow-hidden", entry.unlocked ? "border-green-100" : "border-gray-100")}
      aria-label={`${entry.name} ${statusText}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
            {entry.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🐟</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{entry.name}</h3>
              <span className={cn("text-xs", statusColor)}>{statusText}</span>
            </div>
            {entry.aliasNames.length > 0 && (
              <p className="text-xs text-gray-500 truncate">别名：{entry.aliasNames.join(" / ")}</p>
            )}
          </div>
        </div>

        {entry.unlocked ? (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 space-y-1">
            <p>
              首次捕获：{formatDate(entry.firstCaughtAt)}
            </p>
            <p>
              最近捕获：{formatDate(entry.lastCaughtAt)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">记录一次渔获即可解锁此鱼种</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(date: string | null) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
