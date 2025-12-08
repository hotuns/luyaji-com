import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const APPLY_CHANGES = process.argv.includes("--apply")

async function main() {
  console.log(APPLY_CHANGES ? "Removing legacy metadata entries (scene_tag)..." : "Dry run: listing legacy scene_tag metadata records")

  const legacyItems = await prisma.metadata.findMany({
    where: { category: "scene_tag" },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  })

  if (legacyItems.length === 0) {
    console.log("没有找到 category = scene_tag 的记录，无需处理。")
    return
  }

  legacyItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.label} (${item.value})`)
  })

  if (!APPLY_CHANGES) {
    console.log(`共 ${legacyItems.length} 条旧数据。若确认可删除，请运行：pnpm metadata:cleanup -- --apply`)
    return
  }

  const result = await prisma.metadata.deleteMany({
    where: { id: { in: legacyItems.map((item) => item.id) } },
  })

  console.log(`已删除 ${result.count} 条 scene_tag 记录。`)
}

main()
  .catch((error) => {
    console.error("清理失败:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
