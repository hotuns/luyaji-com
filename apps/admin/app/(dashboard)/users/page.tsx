import { prisma } from "@/lib/prisma";
import { UsersTable } from "./users-table";

export default async function UsersPage({
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
          { phone: { contains: search } },
          { nickname: { contains: search } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { trips: true, catches: true, combos: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <UsersTable
      users={users}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
    />
  );
}
