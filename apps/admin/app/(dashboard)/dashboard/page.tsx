import { prisma } from "@/lib/prisma";
import { DashboardOverview } from "./dashboard-overview";

async function getStats() {
  const [userCount, tripCount, catchCount, speciesCount, rodCount, reelCount, comboCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.catch.count(),
      prisma.fishSpecies.count(),
      prisma.rod.count(),
      prisma.reel.count(),
      prisma.combo.count(),
    ]);

  return {
    userCount,
    tripCount,
    catchCount,
    speciesCount,
    rodCount,
    reelCount,
    comboCount,
  };
}

async function getRecentUsers() {
  return prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nickname: true,
      phone: true,
      createdAt: true,
      _count: {
        select: { trips: true, catches: true },
      },
    },
  });
}

async function getRecentTrips() {
  return prisma.trip.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      startTime: true,
      spot: {
        select: {
          name: true,
          locationName: true,
        },
      },
      user: {
        select: { nickname: true, phone: true },
      },
      _count: {
        select: { catches: true },
      },
    },
  });
}

export default async function DashboardPage() {
  const [stats, recentUsers, recentTrips] = await Promise.all([
    getStats(),
    getRecentUsers(),
    getRecentTrips(),
  ]);

  return <DashboardOverview stats={stats} recentUsers={recentUsers} recentTrips={recentTrips} />;
}
