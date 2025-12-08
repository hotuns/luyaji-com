import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

type BrandType = "rod" | "reel"

const CATEGORY_BY_TYPE: Record<BrandType, string> = {
  rod: "rod_brand",
  reel: "reel_brand",
}

const TYPE_LABEL: Record<BrandType, string> = {
  rod: "鱼竿",
  reel: "渔轮",
}

type PendingBrandItem = {
  type: BrandType
  rawBrand: string
  displayBrand: string
  count: number
}

function buildResponse(success: boolean, payload: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success, ...payload }, { status })
}

function normalizeBrand(value: string | null | undefined) {
  return (value ?? "").trim()
}

async function fetchPendingBrands(type: "rod" | "reel") {
  if (type === "rod") {
    return prisma.rod.groupBy({
      by: ["brand"],
      where: {
        brandMetadataId: null,
        brand: { not: null },
      },
      _count: { _all: true },
    })
  }
  return prisma.reel.groupBy({
    by: ["brand"],
    where: {
      brandMetadataId: null,
      brand: { not: null },
    },
    _count: { _all: true },
  })
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.success) {
    return buildResponse(false, { error: auth.error }, 401)
  }

  const { searchParams } = new URL(request.url)
  const typeParam = searchParams.get("type") ?? "all"
  const includeRod = typeParam === "all" || typeParam === "rod"
  const includeReel = typeParam === "all" || typeParam === "reel"

  try {
    const results: PendingBrandItem[] = []

    if (includeRod) {
      const rows = await fetchPendingBrands("rod")
      rows.forEach((row) => {
        const raw = row.brand ?? ""
        const normalized = normalizeBrand(raw)
        if (!normalized) return
        results.push({
          type: "rod",
          rawBrand: raw,
          displayBrand: normalized,
          count: row._count?._all ?? 0,
        })
      })
    }

    if (includeReel) {
      const rows = await fetchPendingBrands("reel")
      rows.forEach((row) => {
        const raw = row.brand ?? ""
        const normalized = normalizeBrand(raw)
        if (!normalized) return
        results.push({
          type: "reel",
          rawBrand: raw,
          displayBrand: normalized,
          count: row._count?._all ?? 0,
        })
      })
    }

    results.sort((a, b) => b.count - a.count || a.displayBrand.localeCompare(b.displayBrand))

    return buildResponse(true, { data: results })
  } catch (error) {
    console.error("获取待归档品牌失败:", error)
    return buildResponse(false, { error: "获取失败" }, 500)
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.success) {
    return buildResponse(false, { error: auth.error }, 401)
  }

  try {
    const body = await request.json()
    const { type, brand, metadataId } = body as {
      type?: BrandType
      brand?: string
      metadataId?: string
    }

    if (!type || !CATEGORY_BY_TYPE[type]) {
      return buildResponse(false, { error: "缺少或不支持的类型" }, 400)
    }

    const trimmedBrand = normalizeBrand(brand)
    if (!trimmedBrand) {
      return buildResponse(false, { error: "品牌名称不能为空" }, 400)
    }

    if (!metadataId) {
      return buildResponse(false, { error: "请选择要绑定的元数据" }, 400)
    }

    const metadata = await prisma.metadata.findFirst({
      where: { id: metadataId, category: CATEGORY_BY_TYPE[type] },
    })
    if (!metadata) {
      return buildResponse(false, { error: "元数据不存在或分类不匹配" }, 404)
    }

    const payload = {
      brandMetadataId: metadata.id,
      brand: metadata.label ?? metadata.value ?? trimmedBrand,
    }

    const result =
      type === "rod"
        ? await prisma.rod.updateMany({
            where: { brand: brand, brandMetadataId: null },
            data: payload,
          })
        : await prisma.reel.updateMany({
            where: { brand: brand, brandMetadataId: null },
            data: payload,
          })

    return buildResponse(true, {
      message: `${TYPE_LABEL[type]}品牌已更新`,
      updated: result.count,
    })
  } catch (error) {
    console.error("归档品牌失败:", error)
    return buildResponse(false, { error: "归档失败" }, 500)
  }
}
