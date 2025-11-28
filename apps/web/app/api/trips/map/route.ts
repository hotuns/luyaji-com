import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: {
      userId: session.user.id,
      locationLat: { not: null },
      locationLng: { not: null },
    },
    select: {
      id: true,
      title: true,
      locationName: true,
      locationLat: true,
      locationLng: true,
      startTime: true,
      totalCatchCount: true,
      fishSpeciesCount: true,
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: trips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      locationName: trip.locationName,
      lat: trip.locationLat,
      lng: trip.locationLng,
      startTime: trip.startTime.toISOString(),
      totalCatchCount: trip.totalCatchCount || 0,
      fishSpeciesCount: trip.fishSpeciesCount || 0,
    })),
  });
}
