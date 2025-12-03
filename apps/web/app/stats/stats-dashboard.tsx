"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { MapPin, Fish, CalendarRange, ArrowRight } from "lucide-react";

export type CatchStats = {
  speciesId: string;
  speciesName: string;
  totalCount: number;
  firstCaughtAt: string | null;
  lastCaughtAt: string | null;
  catches: Array<{
    id: string;
    tripId: string;
    tripTitle: string | null;
    locationName: string;
    caughtAt: string | null;
    count: number;
    sizeText: string | null;
    weightText: string | null;
  }>;
};

export function StatsDashboard({ initialSpeciesId }: { initialSpeciesId?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CatchStats | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (initialSpeciesId) params.set("speciesId", initialSpeciesId);
        const res = await fetch(`/api/stats/catches?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "获取数据失败");
        }
        setData(json.data ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取数据失败");
      } finally {
        setLoading(false);
      }
    }

    if (initialSpeciesId) {
      fetchData();
    } else {
      setLoading(false);
      setData(null);
    }
  }, [initialSpeciesId]);

  if (!initialSpeciesId) {
    return (
      <div className="space-y-4 pb-24 md:pb-8">
        <h1 className="text-xl font-bold text-slate-800">数据统计</h1>
        <p className="text-sm text-slate-500">
          可以从图鉴或渔获列表跳转到这里查看某种鱼的历史钓鱼记录。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-24 md:pb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-64" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-none shadow-sm mt-6">
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pb-24 md:pb-8">
        <h1 className="text-xl font-bold text-slate-800">数据统计</h1>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 pb-24 md:pb-8">
        <h1 className="text-xl font-bold text-slate-800">数据统计</h1>
        <p className="text-sm text-slate-500">暂无符合条件的渔获记录。</p>
      </div>
    );
  }

  const firstDate = data.firstCaughtAt ? dayjs(data.firstCaughtAt).format("YYYY-MM-DD") : "--";
  const lastDate = data.lastCaughtAt ? dayjs(data.lastCaughtAt).format("YYYY-MM-DD") : "--";

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Fish className="w-5 h-5 text-blue-600" />
          {data.speciesName} 的历史钓鱼记录
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          从图鉴跳转过来，当前筛选条件为：鱼种 = {data.speciesName}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>累计渔获</span>
              <Fish className="w-3 h-3 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {data.totalCount}
              <span className="ml-1 text-xs text-slate-400">尾</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>首次捕获</span>
              <CalendarRange className="w-3 h-3 text-emerald-500" />
            </div>
            <p className="text-base font-semibold text-slate-800">{firstDate}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>最近捕获</span>
              <CalendarRange className="w-3 h-3 text-amber-500" />
            </div>
            <p className="text-base font-semibold text-slate-800">{lastDate}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">渔获明细</p>
            <p className="text-xs text-slate-400">按时间倒序排列</p>
          </div>
          {data.catches.length === 0 ? (
            <p className="text-sm text-slate-500">暂无渔获记录。</p>
          ) : (
            <div className="space-y-2">
              {data.catches.map((item) => (
                <Link
                  key={item.id}
                  href={`/trips/${item.tripId}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1">
                      <span>{item.tripTitle || item.locationName}</span>
                      <span className="text-[10px] text-slate-400">x{item.count}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.locationName}
                      </span>
                      {item.caughtAt && (
                        <span>{dayjs(item.caughtAt).format("YYYY-MM-DD HH:mm")}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 flex flex-col items-end gap-0.5">
                    {item.sizeText && <span>{item.sizeText}</span>}
                    {item.weightText && <span>{item.weightText}</span>}
                    <span className="flex items-center gap-1 text-blue-600 mt-0.5">
                      查看出击详情
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
