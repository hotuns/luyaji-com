import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Plus, MapPin, Fish, Calendar, CloudSun, Map } from "lucide-react";

export default async function TripsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 获取用户的出击记录
  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { startTime: "desc" },
    take: 20,
    include: {
      catches: true,
      tripCombos: {
        include: {
          combo: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-6 pt-12 pb-20 rounded-b-[2.5rem] md:rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">出击记录</h1>
            <p className="text-sm text-indigo-100 mt-2 font-medium opacity-90">
              回顾每一次精彩的作钓旅程
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl font-bold opacity-80">
              {trips.length} <span className="text-sm font-normal opacity-60">次</span>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="ghost" className="hidden md:flex text-white hover:bg-white/20">
                <Link href="/trips/map" className="gap-2">
                  <Map className="w-4 h-4" />
                  地图
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary" className="hidden md:flex shadow-sm">
                <Link href="/trips/new" className="gap-2">
                  <Plus className="w-4 h-4" />
                  新建出击
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 移动端快捷入口 */}
        <div className="flex gap-3 mt-4 md:hidden relative z-10">
          <Link
            href="/trips/map"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-sm"
          >
            <Map className="w-4 h-4" />
            查看地图
          </Link>
          <Link
            href="/trips/new"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-white/90 rounded-xl text-indigo-600 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新建出击
          </Link>
        </div>
      </div>

      {/* 出击列表 */}
      <div className="px-4 md:px-0 space-y-4 -mt-10 relative z-20">
        {trips.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50 shadow-none md:rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Fish className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                还没有出击记录
              </h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                点击下方按钮，开始记录你的第一次出击吧！
              </p>
              <Button asChild>
                <Link href="/trips/new" className="gap-2">
                  <Plus className="w-4 h-4" />
                  新建出击
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block group"
              >
                <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500 group-hover:border-l-indigo-600 md:rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors line-clamp-1">
                        {trip.title || trip.locationName}
                      </h3>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {new Date(trip.startTime).toLocaleDateString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{trip.locationName}</span>
                      </span>
                      
                      {trip.catches.length > 0 && (
                        <span className="flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                          <Fish className="w-4 h-4" />
                          {trip.catches.reduce((sum, c) => sum + c.count, 0)}
                        </span>
                      )}
                      
                      {trip.weatherType && (
                        <span className="flex items-center gap-1.5 shrink-0">
                          <CloudSun className="w-4 h-4 text-gray-400" />
                          {trip.weatherType}
                        </span>
                      )}
                    </div>
                    
                    {trip.tripCombos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-dashed border-gray-100">
                        {trip.tripCombos.map((tc) => (
                          <span
                            key={tc.id}
                            className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {tc.combo.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 悬浮新建按钮 (Mobile Only) */}
      <Link
        href="/trips/new"
        className="md:hidden fixed right-5 bottom-24 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all z-30"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  );
}
