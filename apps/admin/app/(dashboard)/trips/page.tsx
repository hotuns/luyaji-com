import { prisma } from "@/lib/prisma";
import { TripsTable } from "./trips-table";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const pageSize = 20;

  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { locationName: { contains: search } },
          { user: { nickname: { contains: search } } },
          { user: { phone: { contains: search } } },
        ],
      }
    : {};

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startTime: "desc" },
      include: {
        user: {
          select: { nickname: true, phone: true },
        },
        _count: {
          select: { catches: true },
        },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <TripsTable
      trips={trips}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
    />
  );
}
