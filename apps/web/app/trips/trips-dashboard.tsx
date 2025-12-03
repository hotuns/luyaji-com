"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Plus, MapPin, Cloud, Thermometer, Wind, Map } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/trips", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTrips(data.data || []);
        }
      })
      .catch(() => {
        // 保留简洁处理，失败态由下方 UI 通过 trips 为空体现
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">出击记录</h2>
        <div className="flex gap-2">
          <Link 
            href="/trips/map"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            <Map size={18} />
            地图视图
          </Link>
          <Link 
            href="/trips/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 text-sm font-medium active:scale-95"
          >
            <Plus size={18} />
            记一笔
          </Link>
        </div>
      </div>

      {/* 出击列表 */}
      <div className="flex-1 pb-24 md:pb-8">
        {loading ? (
          // 骨架屏
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-3" />
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mb-4" />
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg mb-4">
                    <div className="h-5 bg-slate-100 rounded animate-pulse" />
                    <div className="h-5 bg-slate-100 rounded animate-pulse" />
                    <div className="h-5 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-amber-50 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-amber-50 rounded-full animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50 shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MapPin size={32} className="text-slate-400" />
              </div>
              <h2 className="text-lg font-medium text-slate-800 mb-2">
                还没有出击记录
              </h2>
              <p className="text-slate-500 text-sm mb-1 max-w-xs mx-auto">
                点击下方按钮，开始记录你的第一次出击吧！
              </p>
              <p className="text-slate-400 text-xs mb-6 max-w-xs mx-auto">
                每次出击都可以顺手记一下地点、天气和渔获，后续会在图鉴和数据概览里自动帮你统计。
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
                <Link href="/trips/new" className="gap-2">
                  <Plus size={18} />
                  新建出击
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {trips.map((trip) => {
              // 计算时长
              const startHour = new Date(trip.startTime).getHours();
              const endHour = trip.endTime ? new Date(trip.endTime).getHours() : null;
              const durationHours = endHour ? endHour - startHour : null;
              
              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="block group"
                >
                  <Card className="bg-white border-none shadow-sm hover:shadow-md hover:border-blue-300 transition-all h-full flex flex-col">
                    <CardContent className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800 text-lg truncate group-hover:text-blue-600 transition-colors">
                            {trip.title || trip.locationName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-md border border-blue-100">
                              {trip.locationName}
                            </span>
                            <span className="text-xs text-slate-400 font-mono hidden md:inline-block">
                              {new Date(trip.startTime).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono md:hidden">
                          {new Date(trip.startTime).toLocaleDateString("zh-CN", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      
                      {/* Weather Bar */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1 justify-center">
                          <Cloud size={14} />
                          {trip.weatherType || "晴"}
                        </span>
                        <span className="flex items-center gap-1 justify-center">
                          <Thermometer size={14} />
                          {trip.weatherTemperatureText || "-"}
                        </span>
                        <span className="flex items-center gap-1 justify-center">
                          <Wind size={14} />
                          {durationHours ? `${durationHours}h` : "-"}
                        </span>
                      </div>
                      
                      {/* Catches */}
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {trip.catches.length > 0 ? (
                          trip.catches.slice(0, 4).map((c, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100"
                            >
                              <span>🐟</span>
                              <span className="font-medium">{c.speciesName}</span>
                              <span className="bg-white/50 px-1.5 rounded-full ml-1 font-bold">x{c.count}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">空军 (此次无渔获)</span>
                        )}
                        {trip.catches.length > 4 && (
                          <span className="text-xs text-slate-400">+{trip.catches.length - 4} 种</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 悬浮新建按钮 (Mobile Only) */}
      <Link
        href="/trips/new"
        className="md:hidden fixed right-5 bottom-24 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all z-30 active:scale-95"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}
