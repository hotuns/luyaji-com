import { prisma } from "@/lib/prisma";
import { FishSpeciesTable } from "./fish-species-table";

export default async function FishSpeciesPage() {
  const species = await prisma.fishSpecies.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { catches: true },
      },
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>鱼种管理</h1>
        <p style={{ color: "#888" }}>管理系统鱼种数据库</p>
      </div>

      <FishSpeciesTable initialSpecies={species} />
    </div>
  );
}
