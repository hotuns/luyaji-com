import type { MetadataCategory } from "@/lib/metadata"
import { prisma } from "@/lib/prisma"

export async function getMetadataRecord(id: string, category: MetadataCategory) {
  return prisma.metadata.findFirst({
    where: {
      id,
      category,
      isActive: true,
    },
  })
}
