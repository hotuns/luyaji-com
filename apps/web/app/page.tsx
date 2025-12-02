import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Plus, Settings, ChevronRight, Fish, MapPin, BookOpen } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 获取用户统计数据
  const [tripCount, catchCount, speciesCount, recentTrips] = await Promise.all([
    prisma.trip.count({ where: { userId: session.user.id } }),
    prisma.catch.aggregate({
      where: { userId: session.user.id },
      _sum: { count: true },
    }),
    prisma.catch.groupBy({
      by: ["speciesId"],
      where: { userId: session.user.id },
    }),
    prisma.trip.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: "desc" },
      take: 3,
      include: { catches: true },
    }),
  ]);

  const totalSpecies = await prisma.fishSpecies.count({ where: { isActive: true } });

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Welcome Header - 匹配 Demo HomeView */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
            早安，{session.user.name || "钓友"} 👋
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

      {/* Stats Cards - 匹配 Demo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
            <MapPin size={16} /> <span>总出击</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold">
            {tripCount} <span className="text-lg font-normal opacity-70">次</span>
          </div>
        </Card>
        <Card className="p-4 md:p-6 bg-white border-none shadow-sm flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Fish size={16} /> <span>总渔获</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-800">
            {catchCount._sum.count || 0} <span className="text-lg font-normal text-slate-400">尾</span>
          </div>
        </Card>
        <Card className="p-4 md:p-6 bg-white border-none shadow-sm flex flex-col justify-between h-32 md:h-40">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <BookOpen size={16} /> <span>解锁图鉴</span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-slate-800">
            {speciesCount.length}
            <span className="text-slate-300 text-lg mx-1">/</span>
            <span className="text-lg text-slate-400">{totalSpecies}</span>
          </div>
        </Card>
      </div>

      {/* Quick Action (Mobile Only) - 匹配 Demo */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <Link 
          href="/trips/new"
          className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700">
            <Plus size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">记录出击</div>
            <div className="text-xs opacity-70">添加新行程</div>
          </div>
        </Link>
        <Link 
          href="/gear"
          className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
            <Settings size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-sm">整理装备</div>
            <div className="text-xs opacity-70">管理竿轮</div>
          </div>
        </Link>
      </div>

      {/* Recent Trips - 匹配 Demo */}
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
          {recentTrips.length === 0 ? (
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
              recentTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))
            )}
          </div>
        </div>
      </div>
  );
}

function TripCard({ trip }: { trip: { id: string; title: string | null; locationName: string; startTime: Date; catches: { count: number; speciesName: string }[] } }) {
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
