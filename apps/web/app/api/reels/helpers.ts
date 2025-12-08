import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { getMetadataRecord } from "@/lib/server/metadata-utils"

type ReelMetadataPayload = {
  brand?: string | null
  brandMetadataId?: string | null
}

type ReelDataTarget =
  | Prisma.ReelUncheckedCreateInput
  | Prisma.ReelUncheckedUpdateInput

export async function applyReelMetadata(
  payload: ReelMetadataPayload,
  reelData: ReelDataTarget
) {
  if (payload.brandMetadataId) {
    const record = await getMetadataRecord(payload.brandMetadataId, "reel_brand")
    if (!record) {
      return NextResponse.json(
        { success: false, error: "所选渔轮品牌已失效，请刷新后重试" },
        { status: 400 }
      )
    }
    reelData.brandMetadataId = record.id
    reelData.brand = record.label
  } else if (payload.brandMetadataId === null) {
    reelData.brandMetadataId = null
  }

  if (payload.brand !== undefined) {
    if (!payload.brandMetadataId) {
      reelData.brandMetadataId = null
    }
    reelData.brand = payload.brand
  }

  return null
}
