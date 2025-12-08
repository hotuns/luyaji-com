import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { getMetadataRecord } from "@/lib/server/metadata-utils"

type RodMetadataPayload = {
  brand?: string | null
  brandMetadataId?: string | null
  power?: string | null
  powerMetadataId?: string | null
  lengthUnit?: string | null
  lengthUnitMetadataId?: string | null
}

type RodDataTarget =
  | Prisma.RodUncheckedCreateInput
  | Prisma.RodUncheckedUpdateInput

export async function applyRodMetadata(
  payload: RodMetadataPayload,
  rodData: RodDataTarget
) {
  if (payload.brandMetadataId) {
    const record = await getMetadataRecord(payload.brandMetadataId, "rod_brand")
    if (!record) {
      return NextResponse.json(
        { success: false, error: "所选鱼竿品牌已失效，请刷新后重试" },
        { status: 400 }
      )
    }
    rodData.brandMetadataId = record.id
    rodData.brand = record.label
  } else if (payload.brandMetadataId === null) {
    rodData.brandMetadataId = null
  }

  if (payload.brand !== undefined) {
    if (!payload.brandMetadataId) {
      rodData.brandMetadataId = null
    }
    rodData.brand = payload.brand
  }

  if (payload.powerMetadataId) {
    const record = await getMetadataRecord(payload.powerMetadataId, "rod_power")
    if (!record) {
      return NextResponse.json(
        { success: false, error: "所选鱼竿硬度已失效，请刷新后重试" },
        { status: 400 }
      )
    }
    rodData.powerMetadataId = record.id
    rodData.power = record.label
  } else if (payload.powerMetadataId === null) {
    rodData.powerMetadataId = null
  }

  if (payload.power !== undefined) {
    if (!payload.powerMetadataId) {
      rodData.powerMetadataId = null
    }
    rodData.power = payload.power
  }

  if (payload.lengthUnitMetadataId) {
    const record = await getMetadataRecord(payload.lengthUnitMetadataId, "length_unit")
    if (!record) {
      return NextResponse.json(
        { success: false, error: "所选长度单位已失效，请刷新后重试" },
        { status: 400 }
      )
    }
    rodData.lengthUnitMetadataId = record.id
    rodData.lengthUnit = record.value
  } else if (payload.lengthUnitMetadataId === null) {
    rodData.lengthUnitMetadataId = null
  }

  if (payload.lengthUnit !== undefined) {
    if (!payload.lengthUnitMetadataId) {
      rodData.lengthUnitMetadataId = null
    }
    rodData.lengthUnit = payload.lengthUnit
  }

  return null
}
