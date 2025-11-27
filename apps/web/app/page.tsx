import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部欢迎区域 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 pt-8 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎣</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              你好，{session.user.name || "钓友"}
            </h1>
            <p className="text-blue-100 text-sm">记录每一次出击</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold">{tripCount}</div>
            <div className="text-xs text-blue-100">出击次数</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold">{catchCount._sum.count || 0}</div>
            <div className="text-xs text-blue-100">总渔获</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold">{speciesCount.length}</div>
            <div className="text-xs text-blue-100">解锁鱼种</div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* 快捷操作 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/trips/new"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">新建出击</span>
            </Link>
            <Link
              href="/gear"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">管理装备</span>
            </Link>
          </div>
        </div>

        {/* 最近出击 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">最近出击</h2>
            <Link href="/trips" className="text-sm text-blue-600">
              查看全部
            </Link>
          </div>

          {recentTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>还没有出击记录</p>
              <Link
                href="/trips/new"
                className="text-blue-600 text-sm mt-2 inline-block"
              >
                立即开始记录
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {trip.title || trip.locationName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(trip.startTime).toLocaleDateString("zh-CN")}
                      {trip.catches.length > 0 && (
                        <span className="ml-2">
                          🐟 {trip.catches.reduce((sum, c) => sum + c.count, 0)} 条
                        </span>
                      )}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 底部留白 */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}
