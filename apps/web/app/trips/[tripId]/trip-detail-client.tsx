"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Fish,
  MapPin,
  NotebookPen,
  Pencil,
  Wind,
  Thermometer,
  Cloud,
  Share2,
  Anchor
} from "lucide-react";

import type { TripDetail } from "@/lib/trip-detail";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

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

  if (loading) {
    return <TripDetailSkeleton />;
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
              <ChevronLeft className="mr-1 h-4 w-4" /> 返回出击列表
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      {/* Header Section - Dark Theme */}
      <div className="relative overflow-hidden rounded-b-[2.5rem] md:rounded-3xl bg-slate-900 text-white shadow-xl">
         {/* Background Effects */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 container max-w-5xl mx-auto px-6 pt-8 pb-10">
          {/* Nav Bar */}
          <div className="flex items-center justify-between mb-8">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/trips">
                <ChevronLeft className="size-5" />
              </Link>
            </Button>
            <div className="flex gap-2">
               <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Share2 className="size-5" />
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
              >
                <Link href={`/trips/${tripId}/edit`}>
                  <Pencil className="size-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Title & Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-200/80 text-sm font-medium">
              <MapPin className="size-4" />
              <span>{trip.locationName}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              {trip.title || trip.locationName}
            </h1>
            
            {/* Key Stats Row */}
            <div className="flex flex-wrap gap-3 pt-2">
               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-sm border border-white/5">
                  <Calendar className="size-3.5 text-blue-300" />
                  <span>{formatDateTime(trip.startTime)}</span>
               </div>
               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-sm border border-white/5">
                  <Clock className="size-3.5 text-emerald-300" />
                  <span>{formatDuration(trip.startTime, trip.endTime)}</span>
               </div>
            </div>
          </div>
          
          {/* Big Stats Cards in Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
             <StatBox label="总渔获" value={trip.totalCatchCount} unit="尾" color="text-emerald-400" />
             <StatBox label="鱼种" value={trip.fishSpeciesCount} unit="种" color="text-blue-400" />
             <StatBox label="天气" value={trip.weatherType || "-"} unit="" color="text-amber-400" />
             <StatBox label="温度" value={trip.weatherTemperatureText || "-"} unit="" color="text-orange-400" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container max-w-5xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Note Section (if exists) */}
        {trip.note && (
          <Card className="border-none shadow-sm bg-white overflow-hidden">
             <div className="h-1 bg-amber-400 w-full"></div>
             <CardContent className="p-5">
                <div className="flex gap-3">
                   <NotebookPen className="size-5 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-slate-700 text-sm leading-relaxed">{trip.note}</p>
                </div>
             </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
           {/* Left Column: Catches & Gear */}
           <div className="space-y-8">
              
              {/* Catches */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Fish className="size-5 text-blue-600" />
                       渔获记录
                    </h2>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                       {trip.totalCatchCount} 尾
                    </Badge>
                 </div>
                 
                 {trip.catches.length === 0 ? (
                    <EmptyState icon={Fish} text="本次出击暂无渔获" subtext="下次一定爆护！" />
                 ) : (
                    <div className="grid gap-4">
                       {trip.catches.map((item, index) => (
                          <CatchCard key={item.id} item={item} index={index} />
                       ))}
                    </div>
                 )}
              </div>

              {/* Gear */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Anchor className="size-5 text-indigo-600" />
                       使用装备
                    </h2>
                 </div>
                 
                 {trip.combos.length === 0 ? (
                    <EmptyState icon={Anchor} text="未关联装备组合" subtext="可在编辑中添加" />
                 ) : (
                    <div className="grid gap-4">
                       {trip.combos.map((combo) => (
                          <GearCard key={combo.id} combo={combo} />
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {/* Right Column: Weather & Details (Desktop) / Bottom (Mobile) */}
           <div className="space-y-6">
              {/* Weather Details Card */}
              <Card className="border-none shadow-sm bg-white">
                 <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-slate-800">
                       <Cloud className="size-4 text-slate-500" />
                       环境信息
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="grid gap-4 pt-4">
                    <DetailRow label="天气" value={trip.weatherType || "-"} icon={Cloud} />
                    <DetailRow label="温度" value={trip.weatherTemperatureText || "-"} icon={Thermometer} />
                    <DetailRow label="风况" value={trip.weatherWindText || "-"} icon={Wind} />
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, color }: { label: string, value: string | number, unit: string, color: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div className={cn("text-xl md:text-2xl font-bold", color)}>
        {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, subtext }: { icon: any, text: string, subtext: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className="size-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-900">{text}</p>
      <p className="mt-1 text-xs text-slate-500">{subtext}</p>
    </div>
  );
}

function CatchCard({ item, index }: { item: any, index: number }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="flex items-center gap-4 p-4">
        {/* 照片缩略图 */}
        {item.photoUrls && item.photoUrls.length > 0 ? (
          <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-xl relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={item.photoUrls[0]} 
              alt={item.speciesName} 
              className="w-full h-full object-cover"
            />
            {item.photoUrls.length > 1 && (
              <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                +{item.photoUrls.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-xl flex items-center justify-center">
            <Fish className="size-6 text-slate-300" />
          </div>
        )}
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
              #{index + 1}
            </span>
            <h3 className="text-base font-bold text-slate-900 truncate">{item.speciesName}</h3>
          </div>
          {item.note && (
            <p className="text-xs text-slate-500 mt-1 truncate">{item.note}</p>
          )}
        </div>

        {/* 数量 */}
        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 shrink-0">
          {item.count} 尾
        </Badge>
      </div>
    </Card>
  );
}

function GearCard({ combo }: { combo: any }) {
  return (
    <Card className="border-none shadow-sm p-4 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-900">{combo.name}</h3>
          {combo.detailNote && (
            <p className="text-xs text-slate-500 mt-0.5">{combo.detailNote}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-sm bg-slate-50 rounded-xl p-3">
        <div className="flex justify-between">
          <span className="text-slate-500 text-xs">竿</span>
          <span className="font-medium text-slate-800">{combo.rod?.name || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-xs">轮</span>
          <span className="font-medium text-slate-800">{combo.reel?.name || "-"}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-200/50">
          <span className="text-slate-500 text-xs">线组</span>
          <span className="text-slate-800 text-xs">
            主 {combo.mainLineText || "-"} / 前 {combo.leaderLineText || "-"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="relative overflow-hidden rounded-b-[2.5rem] md:rounded-3xl bg-slate-900 px-6 pt-10 pb-12 shadow-xl h-80">
        <div className="container max-w-5xl mx-auto px-6 space-y-6">
          <div className="flex justify-between">
             <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
             <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
                <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
             </div>
          </div>
          <div className="space-y-4">
             <Skeleton className="h-4 w-32 bg-white/20" />
             <Skeleton className="h-10 w-64 bg-white/30" />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-8">
             <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
             <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
             <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
             <Skeleton className="h-20 w-full bg-white/10 rounded-2xl" />
          </div>
        </div>
      </div>
      <div className="container max-w-5xl mx-auto mt-6 space-y-6 px-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
             <Skeleton className="h-8 w-32" />
             <Skeleton className="h-48 w-full rounded-2xl" />
             <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
             <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
