"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Fish,
  MapPin,
  Clock,
  User,
  Cloud,
  Navigation,
  Download,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface TripDetail {
  id: string;
  title: string | null;
  visibility: string;
  startTime: string;
  endTime: string | null;
  locationName: string;
  locationLat: number | null;
  locationLng: number | null;
  spotName: string | null;
  spotVisibility: "private" | "friends" | "public" | null;
  note: string | null;
  weatherType: string | null;
  weatherTemperatureText: string | null;
  weatherWindText: string | null;
  totalCatchCount: number;
  fishSpeciesCount: number;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
  };
  combos: {
    id: string;
    name: string;
    note: string | null;
    rod: { id: string; name: string; brand: string | null } | null;
    reel: { id: string; name: string; brand: string | null } | null;
    mainLineText?: string | null;
    leaderLineText?: string | null;
    hookText?: string | null;
    detailNote?: string | null;
  }[];
  catches: {
    id: string;
    speciesId: string;
    speciesName: string;
    speciesImageUrl: string | null;
    count: number;
    sizeText: string | null;
    weightText: string | null;
    caughtAt: string | null;
    lureText: string | null;
    note: string | null;
    photoUrls: string[] | null;
  }[];
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

function formatDuration(start: string, end: string | null) {
  if (!end) return "进行中";
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}分钟`;
  return `${hours}小时${minutes}分钟`;
}

export default function ShareTripClient({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`/api/share/trip/${tripId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || "获取失败");
          return;
        }
        setTrip(json.data);
      } catch (e) {
        console.error("获取出击记录详情失败:", e);
        setError("网络异常，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
    fetchTrip();
  }, [tripId]);

  if (loading) return <TripSkeleton />;
  if (error || !trip) return <ErrorState error={error || "未知错误"} />;

  const fallbackSpotLabel = trip.spotName || trip.locationName;
  const title = trip.title || `${fallbackSpotLabel}出击`;
  const startDate = new Date(trip.startTime);
  const coverPhoto = trip.catches.find(c => c.photoUrls && c.photoUrls.length > 0)?.photoUrls?.[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      {/* 顶部导航栏 (透明) */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          {/* Logo or Back button could go here */}
        </div>
        {!isAuthenticated && (
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full shadow-lg bg-white/90 backdrop-blur text-slate-800 pointer-events-auto"
            asChild
          >
            <Link href="/auth/register">
              <Download className="w-4 h-4 mr-1.5" />
              查看更多
            </Link>
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 space-y-6">
        {/* Hero Section */}
        <div className="relative h-[45vh] min-h-[320px] rounded-[32px] overflow-hidden shadow-2xl">
          {coverPhoto ? (
            <img src={coverPhoto} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Fish className="w-20 h-20 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-slate-800">
                {trip.user.avatarUrl ? (
                  <img src={trip.user.avatarUrl} alt={trip.user.nickname} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 m-3 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm text-white/90">{trip.user.nickname}</p>
                <p className="text-xs text-white/60">{dateFormatter.format(startDate)}</p>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{title}</h1>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-white/80 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {trip.locationName}
              </div>
              {trip.spotVisibility && trip.spotVisibility !== "public" && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] text-white/90">
                  钓点保密
                </span>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(trip.startTime, trip.endTime)}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 -mt-10 space-y-5">
        {/* 核心数据卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-slate-900">{trip.totalCatchCount}</span>
            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Fish className="w-3 h-3" /> 渔获总数
            </span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-slate-900">{trip.fishSpeciesCount}</span>
            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Navigation className="w-3 h-3" /> 鱼种数量
            </span>
          </div>
        </div>

        {/* 天气卡片 */}
        {(trip.weatherType || trip.weatherTemperatureText) && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-blue-600">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{trip.weatherType || "天气未知"}</p>
                  <p className="text-xs text-slate-500">
                    {trip.weatherTemperatureText && `${trip.weatherTemperatureText} `}
                    {trip.weatherWindText && `• ${trip.weatherWindText}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 渔获列表 */}
        {trip.catches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-900">渔获记录</h3>
              <span className="text-xs text-slate-500">{trip.catches.length} 条记录</span>
            </div>
            {trip.catches.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                  {item.photoUrls && item.photoUrls.length > 0 ? (
                    <img src={item.photoUrls[0]} alt={item.speciesName} className="w-full h-full object-cover" />
                  ) : item.speciesImageUrl ? (
                    <img src={item.speciesImageUrl} alt={item.speciesName} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Fish className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900">{item.speciesName}</h4>
                    <Badge variant="outline" className="text-xs font-normal bg-slate-50">
                      x{item.count}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {item.sizeText && <span className="bg-slate-50 px-1.5 py-0.5 rounded">📏 {item.sizeText}</span>}
                    {item.weightText && <span className="bg-slate-50 px-1.5 py-0.5 rounded">⚖️ {item.weightText}</span>}
                  </div>
                  {item.lureText && (
                    <p className="text-xs text-slate-400 truncate">🎣 {item.lureText}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 装备列表 */}
        {trip.combos.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 px-1">使用装备</h3>
            <div className="grid gap-3">
              {trip.combos.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500 rounded-full" />
                      <h4 className="font-semibold text-slate-900">{combo.name}</h4>
                    </div>
                    {combo.note && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {combo.note}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 pl-3 text-xs text-slate-600">
                    {combo.rod && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 w-10">鱼竿</span>
                        <span className="font-medium text-slate-900">
                          {combo.rod.name}
                        </span>
                        {combo.rod.brand && (
                          <span className="text-slate-400">({combo.rod.brand})</span>
                        )}
                      </div>
                    )}
                    {combo.reel && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 w-10">渔轮</span>
                        <span className="font-medium text-slate-900">
                          {combo.reel.name}
                        </span>
                        {combo.reel.brand && (
                          <span className="text-slate-400">({combo.reel.brand})</span>
                        )}
                      </div>
                    )}
                    {(combo.mainLineText || combo.leaderLineText) && (
                      <div className="flex flex-wrap gap-2">
                        {combo.mainLineText && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            主线 {combo.mainLineText}
                          </Badge>
                        )}
                        {combo.leaderLineText && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            子线 {combo.leaderLineText}
                          </Badge>
                        )}
                      </div>
                    )}
                    {combo.hookText && (
                      <div className="text-slate-500">钩类：{combo.hookText}</div>
                    )}
                    {combo.detailNote && (
                      <p className="text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3">
                        {combo.detailNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* 备注 */}
          {trip.note && (
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
              <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> 钓行笔记
              </h3>
              <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                {trip.note}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部悬浮引导栏 */}
      <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none">
        <div className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 pointer-events-auto">
          <div>
            <p className="font-bold text-sm">路亚记 Luyaji</p>
            <p className="text-xs text-slate-300">记录你的每一次抛投</p>
          </div>
          <Button
            size="sm"
            className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-medium"
            asChild
          >
            <Link href="/auth/register">立即体验</Link>
          </Button>
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
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">{error || "该记录可能已被删除或设为私有"}</p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}

function TripSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Skeleton className="h-[40vh] w-full" />
      <div className="relative z-10 -mt-10 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
