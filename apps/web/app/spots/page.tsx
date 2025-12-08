import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SpotsDashboard from "./spots-dashboard";

export default async function SpotsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const spots = await prisma.fishingSpot.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      locationName: true,
      locationLat: true,
      locationLng: true,
      description: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { trips: true } },
      trips: {
        orderBy: { startTime: "desc" },
        take: 1,
        select: {
          id: true,
          title: true,
          startTime: true,
          totalCatchCount: true,
          fishSpeciesCount: true,
        },
      },
    },
  });

  const mapSpots = spots
    .filter((spot) => spot.locationLat !== null && spot.locationLng !== null)
    .map((spot) => ({
      id: spot.id,
      name: spot.name,
      locationName: spot.locationName || spot.name,
      lat: spot.locationLat as number,
      lng: spot.locationLng as number,
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

  const normalizedSpots = spots.map((spot) => ({
    id: spot.id,
    name: spot.name,
    locationName: spot.locationName,
    locationLat: spot.locationLat,
    locationLng: spot.locationLng,
    description: spot.description,
    visibility: spot.visibility,
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
    tripCount: spot._count.trips,
    lastTrip: spot.trips[0]
      ? {
          id: spot.trips[0]!.id,
          title: spot.trips[0]!.title,
          startTime: spot.trips[0]!.startTime.toISOString(),
          totalCatchCount: spot.trips[0]!.totalCatchCount || 0,
          fishSpeciesCount: spot.trips[0]!.fishSpeciesCount || 0,
        }
      : null,
  }));

  return <SpotsDashboard spots={normalizedSpots} mapSpots={mapSpots} />;
}
