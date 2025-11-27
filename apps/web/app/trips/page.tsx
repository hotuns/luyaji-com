import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold text-gray-900">出击记录</h1>
          <div className="text-sm text-gray-500">
            共 {trips.length} 次
          </div>
        </div>
      </header>

      {/* 出击列表 */}
      <div className="p-4 space-y-3">
        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎣</div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              还没有出击记录
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              点击下方按钮，开始记录你的第一次出击吧！
            </p>
          </div>
        ) : (
          trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">
                  {trip.title || trip.locationName}
                </h3>
                <span className="text-xs text-gray-400">
                  {new Date(trip.startTime).toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {trip.locationName}
                </span>
                
                {trip.catches.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span>🐟</span>
                    {trip.catches.reduce((sum, c) => sum + c.count, 0)} 条
                  </span>
                )}
                
                {trip.weatherType && (
                  <span>{trip.weatherType}</span>
                )}
              </div>
              
              {trip.tripCombos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {trip.tripCombos.map((tc) => (
                    <span
                      key={tc.id}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                    >
                      {tc.combo.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* 悬浮新建按钮 */}
      <Link
        href="/trips/new"
        className="fixed right-4 bottom-20 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
