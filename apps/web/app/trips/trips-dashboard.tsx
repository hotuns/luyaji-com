"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { 
  Plus, 
  MapPin, 
  Cloud, 
  Thermometer, 
  Wind, 
  Map, 
  Search, 
  Calendar, 
  Fish, 
  Clock, 
  Trophy,
  ArrowRight,
  Filter
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface Trip {
  id: string;
  title: string | null;
  locationName: string;
  startTime: string;
  endTime: string | null;
  weatherType: string | null;
  weatherTemperatureText: string | null;
  catches: { count: number; speciesName: string }[];
}

export default function TripsDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/trips", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTrips(data.data || []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch trips:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredTrips = useMemo(() => {
    if (!searchTerm) return trips;
    const lowerTerm = searchTerm.toLowerCase();
    return trips.filter(
      (trip) =>
        (trip.title && trip.title.toLowerCase().includes(lowerTerm)) ||
        trip.locationName.toLowerCase().includes(lowerTerm)
    );
  }, [trips, searchTerm]);

  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const totalCatches = trips.reduce(
      (acc, trip) => acc + trip.catches.reduce((cAcc, c) => cAcc + c.count, 0),
      0
    );
    const airForceCount = trips.filter((t) => t.catches.length === 0).length;
    const successRate = totalTrips > 0 ? Math.round(((totalTrips - airForceCount) / totalTrips) * 100) : 0;

    return { totalTrips, totalCatches, successRate };
  }, [trips]);

  if (loading) {
    return <TripsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* 顶部统计卡片 */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 p-6 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">出击记录</h2>
              <p className="text-slate-400 text-sm md:text-base">
                记录每一次抛竿的期待与收获。
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white border-0 backdrop-blur-md" asChild>
                <Link href="/trips/map">
                  <Map className="mr-2 h-4 w-4" />
                  足迹地图
                </Link>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 border-0" asChild>
                <Link href="/trips/new">
                  <Plus className="mr-2 h-4 w-4" />
                  记一笔
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">总出击</div>
              <div className="text-2xl font-bold text-white">{stats.totalTrips} <span className="text-sm font-normal text-slate-500">次</span></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">总渔获</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.totalCatches} <span className="text-sm font-normal text-slate-500">尾</span></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="text-slate-400 text-xs mb-1">不空军率</div>
              <div className="text-2xl font-bold text-blue-400">{stats.successRate}<span className="text-sm">%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-2 -my-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="搜索地点或标题..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 focus:border-blue-500 rounded-xl shadow-sm"
          />
        </div>
      </div>

      {/* 列表内容 */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            {searchTerm ? "未找到相关记录" : "还没有出击记录"}
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            {searchTerm ? "换个关键词试试看？" : "点击上方“记一笔”按钮，开始记录你的第一次路亚之旅吧！"}
          </p>
          {!searchTerm && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/trips/new">
                立即出发
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* 移动端悬浮按钮 */}
      <Link
        href="/trips/new"
        className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const startDate = new Date(trip.startTime);
  const totalCatchCount = trip.catches.reduce((acc, c) => acc + c.count, 0);
  const isAirForce = totalCatchCount === 0;

  // 计算时长
  const startHour = startDate.getHours();
  const endHour = trip.endTime ? new Date(trip.endTime).getHours() : null;
  const durationHours = endHour ? endHour - startHour : null;

  return (
    <Link href={`/trips/${trip.id}`} className="block group h-full">
      <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white group-hover:-translate-y-1">
        <CardContent className="p-0 flex flex-col h-full">
          {/* 卡片头部：日期与地点 */}
          <div className="p-5 pb-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5" />
                {startDate.toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                <span className="w-px h-3 bg-slate-300 mx-1"></span>
                <Clock className="w-3.5 h-3.5" />
                {startDate.getHours()}:00
              </div>
              {isAirForce ? (
                <Badge variant="outline" className="text-slate-400 border-slate-200 font-normal text-[10px]">
                  空军
                </Badge>
              ) : (
                <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 font-medium text-[10px] gap-1">
                  <Trophy className="w-3 h-3" />
                  收获 {totalCatchCount}
                </Badge>
              )}
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {trip.title || trip.locationName}
            </h3>
            
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{trip.locationName}</span>
            </div>
          </div>

          {/* 天气信息条 */}
          <div className="px-5 py-2 bg-slate-50/50 border-y border-slate-50 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              {trip.weatherType || "未知"}
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              {trip.weatherTemperatureText || "--"}
            </div>
            {durationHours !== null && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                {durationHours}h
              </div>
            )}
          </div>

          {/* 渔获展示区 */}
          <div className="p-5 pt-4 mt-auto">
            {trip.catches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trip.catches.slice(0, 3).map((c, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100/50"
                  >
                    <Fish className="w-3 h-3" />
                    <span>{c.speciesName}</span>
                    <span className="bg-white/60 px-1.5 rounded-full ml-0.5 text-[10px] min-w-[1.25rem] text-center">
                      {c.count}
                    </span>
                  </div>
                ))}
                {trip.catches.length > 3 && (
                  <div className="text-xs text-slate-400 flex items-center px-1">
                    +{trip.catches.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic flex items-center gap-2 opacity-60">
                <Wind className="w-3.5 h-3.5" />
                本次出击暂无收获，下次加油！
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TripsSkeleton() {
  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 顶部统计区骨架 */}
      <div className="bg-slate-900 p-6 md:p-10 rounded-3xl h-64 flex flex-col justify-between">
        <div className="flex justify-between">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48 bg-slate-800" />
            <Skeleton className="h-4 w-64 bg-slate-800" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 bg-slate-800" />
            <Skeleton className="h-10 w-24 bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20 w-full bg-slate-800 rounded-2xl" />
          <Skeleton className="h-20 w-full bg-slate-800 rounded-2xl" />
          <Skeleton className="h-20 w-full bg-slate-800 rounded-2xl" />
        </div>
      </div>

      {/* 搜索骨架 */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* 列表骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-48 border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
              <div className="pt-4 border-t border-slate-50 mt-4">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
