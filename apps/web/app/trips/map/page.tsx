import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MapClient from "./map-client";

export default async function TripsMapPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const spots = await prisma.fishingSpot.findMany({
    where: {
      userId: session.user.id,
      locationLat: { not: null },
      locationLng: { not: null },
    },
    select: {
      id: true,
      name: true,
      locationName: true,
      locationLat: true,
      locationLng: true,
      description: true,
      visibility: true,
      createdAt: true,
      _count: {
        select: { trips: true },
      },
      trips: {
        orderBy: { startTime: "desc" },
        take: 1,
        select: {
          startTime: true,
          totalCatchCount: true,
          fishSpeciesCount: true,
          title: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const spotMarkers = spots.map((spot) => ({
    id: spot.id,
    name: spot.name,
    locationName: spot.locationName || spot.name,
    lat: spot.locationLat!,
    lng: spot.locationLng!,
    description: spot.description,
    visibility: spot.visibility,
    tripCount: spot._count.trips,
    lastTrip: spot.trips[0]
      ? {
          title: spot.trips[0]!.title,
          startTime: spot.trips[0]!.startTime.toISOString(),
          totalCatchCount: spot.trips[0]!.totalCatchCount || 0,
          fishSpeciesCount: spot.trips[0]!.fishSpeciesCount || 0,
        }
      : null,
  }));

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-slate-100 pb-16 md:pb-0 md:pt-16">
      {/* 顶部导航 - PC端显示更多信息 */}
      <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 md:h-16 md:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/trips"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-slate-900">我的钓点地图</h1>
            <p className="text-sm text-slate-500">{spotMarkers.length} 个记录点</p>
          </div>
        </div>
        <h1 className="text-base font-semibold text-slate-900 md:hidden">我的钓点地图</h1>
      </header>

      {/* 地图区域 - PC端添加边距和圆角 */}
      <div className="flex-1 md:p-6">
        <div className="h-full w-full md:overflow-hidden md:rounded-2xl md:shadow-lg">
          <MapClient spots={spotMarkers} />
        </div>
      </div>
    </div>
  );
}
