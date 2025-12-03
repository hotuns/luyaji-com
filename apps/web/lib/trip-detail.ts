import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TripDetail = {
  id: string;
  title: string | null;
  locationName: string;
  note: string | null;
  startTime: string;
  endTime: string | null;
  weatherType: string | null;
  weatherTemperatureText: string | null;
  weatherWindText: string | null;
  totalCatchCount: number;
  fishSpeciesCount: number;
  combos: Array<{
    id: string;
    name: string;
    mainLineText: string | null;
    leaderLineText: string | null;
    hookText: string | null;
    detailNote: string | null;
    rod: { id: string; name: string } | null;
    reel: { id: string; name: string } | null;
  }>;
  catches: Array<{
    id: string;
    speciesId: string;
    speciesName: string;
    count: number;
    sizeText: string | null;
    weightText: string | null;
    combo: { id: string; name: string } | null;
    lureText: string | null;
    note: string | null;
    caughtAt: string | null;
    photoUrls: string[] | null;
  }>;
};

type TripWithRelations = Prisma.TripGetPayload<{
  include: {
    tripCombos: {
      include: {
        combo: {
          include: {
            rod: { select: { id: true, name: true } },
            reel: { select: { id: true, name: true } },
          },
        },
      },
    },
    catches: {
      include: {
        combo: { select: { id: true, name: true } },
      },
    },
  },
}>;

export async function getTripDetail(userId: string, tripId: string): Promise<TripDetail | null> {
  const trip = (await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      tripCombos: {
        include: {
          combo: {
            include: {
              rod: { select: { id: true, name: true } },
              reel: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { id: "asc" },
      },
      catches: {
        include: {
          combo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })) as TripWithRelations | null;

  if (!trip) {
    return null;
  }

  return {
    id: trip.id,
    title: trip.title,
    locationName: trip.locationName,
    note: trip.note,
    startTime: trip.startTime.toISOString(),
    endTime: trip.endTime ? trip.endTime.toISOString() : null,
    weatherType: trip.weatherType,
    weatherTemperatureText: trip.weatherTemperatureText,
    weatherWindText: trip.weatherWindText,
    totalCatchCount: trip.totalCatchCount ?? 0,
    fishSpeciesCount: trip.fishSpeciesCount ?? 0,
    combos: trip.tripCombos.map((item) => ({
      id: item.combo.id,
      name: item.combo.name,
      mainLineText: item.combo.mainLineText,
      leaderLineText: item.combo.leaderLineText,
      hookText: item.combo.hookText,
      detailNote: item.combo.detailNote,
      rod: item.combo.rod ? { id: item.combo.rod.id, name: item.combo.rod.name } : null,
      reel: item.combo.reel ? { id: item.combo.reel.id, name: item.combo.reel.name } : null,
    })),
    catches: trip.catches.map((catchItem) => ({
      id: catchItem.id,
      speciesId: catchItem.speciesId,
      speciesName: catchItem.speciesName,
      count: catchItem.count,
      sizeText: catchItem.sizeText,
      weightText: catchItem.weightText,
      combo: catchItem.combo ? { id: catchItem.combo.id, name: catchItem.combo.name } : null,
      lureText: catchItem.lureText,
      note: catchItem.note,
      caughtAt: catchItem.caughtAt ? catchItem.caughtAt.toISOString() : null,
      photoUrls: Array.isArray(catchItem.photoUrls) ? (catchItem.photoUrls as string[]) : null,
    })),
  };
}
