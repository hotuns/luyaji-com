"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { 
  Fish, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Trophy, 
  Target, 
  Cloud, 
  Zap,
  ArrowRight,
  ChevronRight,
  BarChart3,
} from "lucide-react";

type Period = "all" | "year" | "3months" | "month";

interface ReportData {
  period: string;
  periodLabel: string;
  overview: {
    tripCount: number;
    totalCatch: number;
    speciesCount: number;
    successRate: number;
    avgCatchPerTrip: string;
  };
  rankings: {
    topSpecies: Array<{ speciesId: string; speciesName: string; count: number }>;
    topLocations: Array<{ locationName: string; tripCount: number }>;
    topCombos: Array<{ comboId: string; comboName: string; catchCount: number }>;
  };
  weatherDistribution: Array<{ weatherType: string; weatherLabel: string; tripCount: number }>;
  monthlyTrends: Array<{ month: string; trips: number; catches: number }>;
  highlights: {
    bestTrip: {
      id: string;
      title: string;
      locationName: string;
      startTime: string;
      catchCount: number;
    } | null;
    biggestCatch: {
      speciesName: string;
      sizeText: string | null;
      weightText: string | null;
      caughtAt: string | null;
      tripId: string;
      tripTitle: string;
    } | null;
  };
}

const periodOptions: { value: Period; label: string }[] = [
  { value: "month", label: "本月" },
  { value: "3months", label: "近3月" },
  { value: "year", label: "今年" },
  { value: "all", label: "全部" },
];

export function ReportDashboard() {
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stats/report?period=${period}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "获取数据失败");
        }
        setData(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取数据失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-xl font-bold text-slate-800 mb-4">钓鱼报告</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-xl font-bold text-slate-800 mb-4">钓鱼报告</h1>
        <p className="text-slate-500">暂无数据</p>
      </div>
    );
  }

  const { overview, rankings, weatherDistribution, monthlyTrends, highlights } = data;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 顶部标题和周期选择 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">钓鱼报告</h1>
        </div>
      </div>

      {/* 周期选择器 */}
      <div className="flex gap-2">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              period === opt.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <OverviewCard
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
          label="出击次数"
          value={overview.tripCount}
          unit="次"
        />
        <OverviewCard
          icon={<Fish className="w-4 h-4 text-emerald-500" />}
          label="总渔获"
          value={overview.totalCatch}
          unit="尾"
        />
        <OverviewCard
          icon={<Target className="w-4 h-4 text-purple-500" />}
          label="解锁鱼种"
          value={overview.speciesCount}
          unit="种"
        />
        <OverviewCard
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
          label="成功率"
          value={overview.successRate}
          unit="%"
        />
        <OverviewCard
          icon={<Zap className="w-4 h-4 text-yellow-500" />}
          label="场均渔获"
          value={overview.avgCatchPerTrip}
          unit="尾"
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* 亮点记录 */}
      {(highlights.bestTrip || highlights.biggestCatch) && (
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              亮点时刻
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highlights.bestTrip && (
              <Link
                href={`/trips/${highlights.bestTrip.id}`}
                className="block p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">🏆 最佳单次出击</p>
                    <p className="font-medium text-slate-800">{highlights.bestTrip.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {highlights.bestTrip.locationName} · {dayjs(highlights.bestTrip.startTime).format("MM/DD")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">{highlights.bestTrip.catchCount}</p>
                    <p className="text-xs text-slate-500">尾</p>
                  </div>
                </div>
              </Link>
            )}
            {highlights.biggestCatch && (
              <Link
                href={`/trips/${highlights.biggestCatch.tripId}`}
                className="block p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">🎣 精彩渔获</p>
                    <p className="font-medium text-slate-800">{highlights.biggestCatch.speciesName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {highlights.biggestCatch.tripTitle}
                      {highlights.biggestCatch.caughtAt && ` · ${dayjs(highlights.biggestCatch.caughtAt).format("MM/DD")}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {highlights.biggestCatch.sizeText && (
                      <p className="text-lg font-bold text-amber-600">{highlights.biggestCatch.sizeText}</p>
                    )}
                    {highlights.biggestCatch.weightText && (
                      <p className="text-sm text-slate-600">{highlights.biggestCatch.weightText}</p>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* 月度趋势 */}
      {monthlyTrends.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              出击趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlyTrends.slice(0, 6).map((item, index) => {
                const maxCatches = Math.max(...monthlyTrends.map(t => t.catches), 1);
                const percentage = (item.catches / maxCatches) * 100;
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-16">{item.month}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 w-20 text-right">
                      <span className="font-medium">{item.catches}</span>尾 / <span>{item.trips}</span>次
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 排行榜区域 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 鱼种排行 */}
        {rankings.topSpecies.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Fish className="w-4 h-4 text-emerald-500" />
                鱼种排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rankings.topSpecies.slice(0, 5).map((item, index) => (
                  <Link
                    key={item.speciesId}
                    href={`/stats?speciesId=${item.speciesId}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RankBadge rank={index + 1} />
                    <span className="flex-1 text-sm text-slate-700">{item.speciesName}</span>
                    <span className="text-sm font-medium text-slate-800">{item.count} 尾</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 钓点排行 */}
        {rankings.topLocations.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                常去钓点
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rankings.topLocations.slice(0, 5).map((item, index) => (
                  <div
                    key={item.locationName}
                    className="flex items-center gap-3 p-2 rounded-lg"
                  >
                    <RankBadge rank={index + 1} />
                    <span className="flex-1 text-sm text-slate-700 truncate">{item.locationName}</span>
                    <span className="text-sm font-medium text-slate-800">{item.tripCount} 次</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 装备使用统计 */}
      {rankings.topCombos.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              常用装备
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rankings.topCombos.slice(0, 5).map((item, index) => (
                <div
                  key={item.comboId}
                  className="flex items-center gap-3 p-2 rounded-lg"
                >
                  <RankBadge rank={index + 1} />
                  <span className="flex-1 text-sm text-slate-700">{item.comboName}</span>
                  <span className="text-sm font-medium text-slate-800">{item.catchCount} 尾</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 天气分布 */}
      {weatherDistribution.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" />
              天气分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weatherDistribution.map((item) => (
                <div
                  key={item.weatherType}
                  className="px-3 py-2 bg-slate-100 rounded-lg text-sm"
                >
                  <span className="text-slate-700">{item.weatherLabel}</span>
                  <span className="ml-2 font-medium text-slate-800">{item.tripCount}次</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态提示 */}
      {overview.tripCount === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center">
            <Fish className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">还没有出击记录</p>
            <Link href="/trips/new">
              <Button>
                记录第一次出击
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 概览卡片组件
function OverviewCard({
  icon,
  label,
  value,
  unit,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  className?: string;
}) {
  return (
    <Card className={`border-none shadow-sm ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold text-slate-800">
          {value}
          <span className="ml-1 text-sm font-normal text-slate-400">{unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}

// 排名徽章
function RankBadge({ rank }: { rank: number }) {
  const colors = [
    "bg-amber-100 text-amber-700",
    "bg-slate-100 text-slate-600",
    "bg-orange-100 text-orange-700",
  ];
  const colorClass = colors[rank - 1] || "bg-slate-50 text-slate-500";

  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${colorClass}`}>
      {rank}
    </span>
  );
}

// 加载骨架屏
function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-16 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
