import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function resolveSceneMetadata(
  ids?: string[] | null
): Promise<
  | {
      labels: string[]
      relations: { metadataId: string }[]
    }
  | NextResponse
> {
  if (!ids || ids.length === 0) {
    return { labels: [], relations: [] }
  }

  const uniqueIds = Array.from(new Set(ids))
  const records = await prisma.metadata.findMany({
    where: {
      id: { in: uniqueIds },
      category: "combo_scene_tag",
      isActive: true,
    },
  })

  if (records.length !== uniqueIds.length) {
    return NextResponse.json(
      { success: false, error: "存在已失效的场景标签，请刷新后重试" },
      { status: 400 }
    )
  }

  return {
    labels: records.map((record) => record.label ?? record.value ?? ""),
    relations: records.map((record) => ({ metadataId: record.id })),
  }
}
