"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  MoreVertical,
  Pencil,
  Trash2,
  Cloud,
  Thermometer,
  Wind,
  Anchor,
  Fish,
  Camera,
  Loader2,
} from "lucide-react";

import type { TripDetail } from "@/lib/trip-detail";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { ShareDialog } from "@/components/share-dialog";
import { WEATHER_TYPES } from "@/lib/types";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return dateTimeFormatter.format(new Date(value));
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "进行中";
  const duration = new Date(end).getTime() - new Date(start).getTime();
  if (duration <= 0) return "-";
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export default function TripDetailClient() {
  const params = useParams<{ tripId: string }>();
  const router = useRouter();
  const tripId = params.tripId;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          if (res.status === 404) {
            setError("记录不存在");
          } else if (res.status === 401) {
            router.push("/auth/signin");
          } else {
            setError(json.error || "获取失败");
          }
          return;
        }
        setTrip(json.data as TripDetail);
      } catch (e) {
        console.error("获取出击详情失败", e);
        setError("网络异常，请稍后重试");
      } finally {
        setLoading(false);
      }
    }

    if (tripId) {
      fetchDetail();
    }
  }, [tripId, router]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这条出击记录吗？删除后无法恢复。")) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/trips");
      } else {
        alert(json.error || "删除失败");
      }
    } catch (e) {
      console.error("删除出击记录失败", e);
      alert("删除失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-base font-medium text-slate-800">
            {error || "未找到该出击记录"}
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/trips">
              <ArrowLeft className="mr-1 h-4 w-4" /> 返回出击列表
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/trips")}
              className="text-slate-500 hover:text-slate-900 -ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-base font-bold text-slate-900 truncate max-w-[200px]">
              {trip.title || trip.locationName}
            </h1>
          </div>
          
          <div className="flex items-center gap-1">
            {trip.visibility === "public" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShare(true)}
                className="text-slate-500 hover:text-slate-900"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/trips/${tripId}/edit`)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Pencil className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 w-4 h-4" />
                  {isDeleting ? "删除中..." : "删除出击记录"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">开始时间</div>
                  <div className="font-medium">{formatDateTime(trip.startTime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">持续时长</div>
                  <div className="font-medium">{formatDuration(trip.startTime, trip.endTime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700 md:col-span-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">出击地点</div>
                  <div className="font-medium">{trip.locationName}</div>
                </div>
              </div>
            </div>
            {trip.note && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <div className="text-xs text-slate-500 mb-1">备注</div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{trip.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">天气与环境</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Cloud className="w-4 h-4" />
                  <span className="text-xs">天气</span>
                </div>
                <div className="font-medium text-slate-900">
                  {trip.weatherType || "-"}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs">气温</span>
                </div>
                <div className="font-medium text-slate-900">{trip.weatherTemperatureText || "-"} °C</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs">风力</span>
                </div>
                <div className="font-medium text-slate-900">{trip.weatherWindText || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gear */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Anchor className="w-5 h-5 text-slate-500" />
              使用装备
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trip.combos.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">未记录装备信息</div>
            ) : (
              <div className="grid gap-3">
                {trip.combos.map((combo) => (
                  <div key={combo.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="font-medium text-slate-900">{combo.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {combo.rod?.name || "未知竿"} + {combo.reel?.name || "未知轮"}
                    </div>
                    {(combo.mainLineText || combo.leaderLineText) && (
                      <div className="text-xs text-slate-500 mt-1 pt-1 border-t border-slate-200/50">
                        线组: 主 {combo.mainLineText || "-"} / 前 {combo.leaderLineText || "-"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Fish className="w-5 h-5 text-blue-600" />
              渔获记录
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              共 {trip.totalCatchCount} 尾
            </Badge>
          </CardHeader>
          <CardContent>
            {trip.catches.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                本次出击暂无渔获
              </div>
            ) : (
              <div className="space-y-3">
                {trip.catches.map((item, index) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                      {item.photoUrls && item.photoUrls.length > 0 ? (
                        <>
                          <img 
                            src={item.photoUrls[0]} 
                            alt={item.speciesName} 
                            className="w-full h-full object-cover" 
                          />
                          {item.photoUrls.length > 1 && (
                            <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-tl-lg">
                              +{item.photoUrls.length - 1}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Camera className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium text-slate-900">{item.speciesName}</h4>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            {item.count}尾
                            {item.sizeText && ` · ${item.sizeText}`}
                            {item.lureText && ` · ${item.lureText}`}
                          </div>
                          {item.combo && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              使用: {item.combo.name}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-1.5 rounded">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Share Dialog */}
      {trip.visibility === "public" && (
        <ShareDialog
          config={{
            type: "trip",
            id: trip.id,
            title: trip.title || trip.locationName,
            description: `📍 ${trip.locationName} | 🐟 收获 ${trip.totalCatchCount || 0} 条`,
            imageUrl: trip.catches?.[0]?.photoUrls?.[0] || undefined,
          }}
          open={showShare}
          onOpenChange={setShowShare}
        />
      )}
    </div>
  );
}
