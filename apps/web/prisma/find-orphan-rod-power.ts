import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const rods = await prisma.rod.findMany({
    where: {
      powerMetadataId: { not: null },
      powerMetadata: null,
    },
    select: {
      id: true,
      name: true,
      power: true,
      powerMetadataId: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  if (rods.length === 0) {
    console.log("未发现 powerMetadataId 悬空的鱼竿记录。")
    return
  }

  console.log(`共找到 ${rods.length} 条鱼竿记录存在无效 powerMetadataId：`)
  rods.forEach((rod) => {
    console.log(
      `- ${rod.id} | ${rod.name ?? "未命名"} | power=${rod.power ?? "-"} | powerMetadataId=${rod.powerMetadataId}`
    )
  })
}

main()
  .catch((error) => {
    console.error("查询失败：", error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
