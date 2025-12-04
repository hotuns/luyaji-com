"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Plus, Settings, ChevronRight, Fish, MapPin, BookOpen, Megaphone, BarChart3 } from "lucide-react";
import dayjs from "dayjs";

interface HomeStats {
  tripCount: number;
  catchCount: number;
  speciesCount: number;
  totalSpecies: number;
  recentTrips: {
    id: string;
    title: string | null;
    locationName: string;
    startTime: string;
    catches: { count: number; speciesName: string }[];
  }[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  publishedAt: string | null;
  showAsBanner?: boolean;
}

export default function HomeDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [banner, setBanner] = useState<Announcement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/home-stats", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/announcements", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.data) {
            setAnnouncements(data.data.items || []);
            setBanner(data.data.banner || null);
          }
        }
      })
      .catch(() => {});
  }, []);

  const userName = session?.user?.name || "钓友";

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Top Banner Announcement */}
      {banner && !bannerDismissed && (
        <Card className="mb-2 border-amber-200 bg-amber-50/80">
          <CardContent className="p-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Megaphone className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">{banner.title}</p>
                <p className="mt-0.5 text-[11px] text-amber-800 whitespace-pre-line">
                  {banner.content}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-[10px] text-amber-700 hover:text-amber-900"
              onClick={() => setBannerDismissed(true)}
            >
              不再显示
            </button>
          </CardContent>
        </Card>
      )}
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            你好，{userName} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">今天适合去抛两杆吗？</p>
        </div>
        <div className="hidden md:block">
          <Link 
            href="/trips/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 font-medium active:scale-95"
          >
            <Plus size={18} />
            记录出击
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
            <MapPin size={16} /> <span>总出击</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold">
            {loading ? (
              <div className="h-10 w-16 bg-blue-400/50 rounded animate-pulse" />
            ) : (
              <>{stats?.tripCount || 0} <span className="text-lg font-normal opacity-70">次</span></>
            )}
          </div>
        </Card>
        <Card className="p-4 md:p-6 bg-white border-none shadow-sm flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Fish size={16} /> <span>总渔获</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-800">
            {loading ? (
              <div className="h-10 w-16 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>{stats?.catchCount || 0} <span className="text-lg font-normal text-slate-400">尾</span></>
            )}
          </div>
        </Card>
        <Card className="p-4 md:p-6 bg-white border-none shadow-sm flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <BookOpen size={16} /> <span>解锁图鉴</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-800">
            {loading ? (
              <div className="h-10 w-20 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                {stats?.speciesCount || 0}
                <span className="text-slate-300 text-lg mx-1">/</span>
                <span className="text-lg text-slate-400">{stats?.totalSpecies || 0}</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm text-slate-800">系统公告</h3>
          </div>
          <div className="space-y-2">
            {announcements.map((item) => (
              <Card key={item.id} className="border-amber-100 bg-amber-50/60">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-amber-900">{item.title}</p>
                      <p className="mt-1 text-xs text-amber-800 whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-700 whitespace-nowrap mt-0.5">
                      {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action (Mobile Only) */}
      <div className="grid grid-cols-3 gap-3 md:hidden">
        <Link 
          href="/trips/new"
          className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700">
            <Plus size={20} />
          </div>
          <div className="text-center">
            <div className="font-bold text-xs">记录出击</div>
          </div>
        </Link>
        <Link 
          href="/gear"
          className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
            <Settings size={20} />
          </div>
          <div className="text-center">
            <div className="font-bold text-xs">整理装备</div>
          </div>
        </Link>
        <Link 
          href="/stats/report"
          className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl border border-purple-100 text-purple-700 hover:bg-purple-100 transition-colors"
        >
          <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700">
            <BarChart3 size={20} />
          </div>
          <div className="text-center">
            <div className="font-bold text-xs">钓鱼报告</div>
          </div>
        </Link>
      </div>

      {/* Recent Trips */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-lg md:text-xl text-slate-800">最近出击</h3>
          <Link 
            href="/trips" 
            className="text-xs md:text-sm text-blue-600 font-medium flex items-center hover:underline"
          >
            全部记录 <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {loading ? (
            // 骨架屏
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-3" />
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
                      <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : !stats?.recentTrips?.length ? (
            <Card className="border-dashed border-2 bg-slate-50 shadow-none col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <MapPin size={24} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mb-3">还没有出击记录</p>
                <Link 
                  href="/trips/new"
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  快去钓鱼吧！
                </Link>
              </CardContent>
            </Card>
          ) : (
            stats.recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return dayjs(value).format("YYYY-MM-DD HH:mm");
}

function TripCard({ trip }: { trip: { id: string; title: string | null; locationName: string; startTime: string; catches: { count: number; speciesName: string }[] } }) {
  const totalCatch = trip.catches.reduce((sum, c) => sum + c.count, 0);
  
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="bg-white border-none shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {trip.title || trip.locationName}
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-md border border-blue-100">
                {trip.locationName}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(trip.startTime).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {trip.catches.length > 0 ? (
              trip.catches.slice(0, 3).map((c, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100"
                >
                  <Fish size={12} />
                  <span className="font-medium">{c.speciesName}</span>
                  <span className="bg-white/50 px-1.5 rounded-full ml-1">x{c.count}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">空军 (此次无渔获)</span>
            )}
            {totalCatch > 0 && trip.catches.length > 3 && (
              <span className="text-xs text-slate-400">+{trip.catches.length - 3} 种</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
