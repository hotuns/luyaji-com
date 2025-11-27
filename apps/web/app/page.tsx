import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Plus, Backpack, MapPin, Fish, ChevronRight, Calendar, Map } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* 顶部欢迎区域 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 pt-12 pb-16 rounded-b-[2.5rem] md:rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-inner">
            <span className="text-3xl">🎣</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              你好，{session.user.name || "钓友"}
            </h1>
            <p className="text-blue-100 text-sm font-medium opacity-90">今天也是个爆护的好日子！</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 relative z-10 max-w-2xl mx-auto md:mx-0">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-sm hover:bg-white/20 transition-colors cursor-default">
            <div className="text-2xl font-bold tracking-tight">{tripCount}</div>
            <div className="text-xs text-blue-100 font-medium mt-1">出击次数</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-sm hover:bg-white/20 transition-colors cursor-default">
            <div className="text-2xl font-bold tracking-tight">{catchCount._sum.count || 0}</div>
            <div className="text-xs text-blue-100 font-medium mt-1">总渔获</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10 shadow-sm hover:bg-white/20 transition-colors cursor-default">
            <div className="text-2xl font-bold tracking-tight">{speciesCount.length}</div>
            <div className="text-xs text-blue-100 font-medium mt-1">解锁鱼种</div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0 -mt-8 space-y-6 relative z-20">
        {/* 快捷操作 */}
        <Card className="border-none shadow-md overflow-hidden md:rounded-2xl">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Map className="w-4 h-4 text-blue-500" />
              快捷操作
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
            <Link href="/trips/new" className="block group">
              <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl p-3 flex flex-col items-center justify-center gap-2 h-20 border border-blue-100 group-hover:border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-xs text-blue-900">新建出击</span>
              </div>
            </Link>
            <Link href="/gear" className="block group">
              <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3 flex flex-col items-center justify-center gap-2 h-20 border border-gray-100 group-hover:border-gray-200">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Backpack className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-xs text-gray-900">管理装备</span>
              </div>
            </Link>
            {/* Desktop placeholders or more actions could go here */}
          </CardContent>
        </Card>

        {/* 最近出击 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              最近出击
            </h2>
            <Link href="/trips" className="text-xs font-medium text-blue-600 flex items-center hover:underline">
              查看全部 <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          {recentTrips.length === 0 ? (
            <Card className="border-dashed border-2 bg-gray-50/50 shadow-none md:rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">还没有出击记录</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/trips/new">立即开始记录</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTrips.map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="block group h-full">
                  <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 group-hover:border-l-blue-600 h-full md:rounded-xl">
                    <CardContent className="p-4 flex items-center justify-between h-full">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                          {trip.title || trip.locationName}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(trip.startTime).toLocaleDateString("zh-CN")}
                          </span>
                          {trip.catches.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded-md">
                              <Fish className="w-3 h-3" />
                              {trip.catches.reduce((sum, c) => sum + c.count, 0)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
