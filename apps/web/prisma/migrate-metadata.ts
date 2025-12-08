import { Prisma, PrismaClient } from "@prisma/client"

type MetadataIndex = Map<
  string,
  {
    values: Map<string, string>
    aliases: Map<string, string>
  }
>

type UnmatchedCounter = Map<string, number>

type MigrationStats = {
  entity: string
  processed: number
  updated: number
  unmatched: Record<string, UnmatchedCounter>
}

type Options = {
  apply: boolean
}

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const options: Options = {
  apply: args.includes("--apply"),
}

const metadataIndex: MetadataIndex = new Map()

function normalize(input: string | null | undefined) {
  if (!input) return ""
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s_-]/g, "")
}

function toStringArray(value: Prisma.JsonValue | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return []
}

function registerMetadata(category: string, id: string, value: string, aliases: Prisma.JsonValue | null) {
  const normalizedValue = normalize(value)
  const entry =
    metadataIndex.get(category) ??
    {
      values: new Map<string, string>(),
      aliases: new Map<string, string>(),
    }
  entry.values.set(normalizedValue, id)

  toStringArray(aliases).forEach((alias) => {
    const normalizedAlias = normalize(alias)
    if (normalizedAlias) {
      entry.aliases.set(normalizedAlias, id)
    }
  })

  metadataIndex.set(category, entry)
}

function findMetadataId(category: string, rawValue: string | null | undefined) {
  if (!rawValue) return null
  const normalized = normalize(rawValue)
  if (!normalized) return null
  const entry = metadataIndex.get(category)
  if (!entry) return null
  return entry.values.get(normalized) ?? entry.aliases.get(normalized) ?? null
}

function recordUnmatched(map: Record<string, UnmatchedCounter>, category: string, rawValue: string | null | undefined) {
  if (!rawValue) return
  const entry = map[category] ?? new Map<string, number>()
  entry.set(rawValue, (entry.get(rawValue) ?? 0) + 1)
  map[category] = entry
}

async function migrateRods(): Promise<MigrationStats> {
  const rods = await prisma.rod.findMany({
    select: {
      id: true,
      brand: true,
      brandMetadataId: true,
      power: true,
      powerMetadataId: true,
      lengthUnit: true,
      lengthUnitMetadataId: true,
    },
  })

  let updated = 0
  const unmatched: Record<string, UnmatchedCounter> = {}

  for (const rod of rods) {
    const data: Prisma.RodUpdateInput = {}

    const brandId = findMetadataId("rod_brand", rod.brand)
    if (brandId) {
      if (rod.brandMetadataId !== brandId) {
        data.brandMetadata = { connect: { id: brandId } }
      }
    } else {
      recordUnmatched(unmatched, "rod_brand", rod.brand)
    }

    const powerId = findMetadataId("rod_power", rod.power)
    if (powerId) {
      if (rod.powerMetadataId !== powerId) {
        data.powerMetadata = { connect: { id: powerId } }
      }
    } else {
      recordUnmatched(unmatched, "rod_power", rod.power)
    }

    const lengthUnitId = findMetadataId("length_unit", rod.lengthUnit)
    if (lengthUnitId) {
      if (rod.lengthUnitMetadataId !== lengthUnitId) {
        data.lengthUnitMetadata = { connect: { id: lengthUnitId } }
      }
    } else {
      recordUnmatched(unmatched, "length_unit", rod.lengthUnit)
    }

    if (Object.keys(data).length > 0) {
      updated += 1
      if (options.apply) {
        await prisma.rod.update({
          where: { id: rod.id },
          data,
        })
      }
    }
  }

  return {
    entity: "Rod",
    processed: rods.length,
    updated,
    unmatched,
  }
}

async function migrateReels(): Promise<MigrationStats> {
  const reels = await prisma.reel.findMany({
    select: {
      id: true,
      brand: true,
      brandMetadataId: true,
    },
  })

  let updated = 0
  const unmatched: Record<string, UnmatchedCounter> = {}

  for (const reel of reels) {
    const brandId = findMetadataId("reel_brand", reel.brand)
    if (brandId) {
      if (reel.brandMetadataId !== brandId) {
        updated += 1
        if (options.apply) {
          await prisma.reel.update({
            where: { id: reel.id },
            data: {
              brandMetadata: { connect: { id: brandId } },
            },
          })
        }
      }
    } else {
      recordUnmatched(unmatched, "reel_brand", reel.brand)
    }
  }

  return {
    entity: "Reel",
    processed: reels.length,
    updated,
    unmatched,
  }
}

async function migrateTrips(): Promise<MigrationStats> {
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      weatherType: true,
      weatherMetadataId: true,
    },
  })

  let updated = 0
  const unmatched: Record<string, UnmatchedCounter> = {}

  for (const trip of trips) {
    const weatherId = findMetadataId("weather_type", trip.weatherType)
    if (weatherId) {
      if (trip.weatherMetadataId !== weatherId) {
        updated += 1
        if (options.apply) {
          await prisma.trip.update({
            where: { id: trip.id },
            data: {
              weatherMetadataId: weatherId,
            },
          })
        }
      }
    } else {
      recordUnmatched(unmatched, "weather_type", trip.weatherType)
    }
  }

  return {
    entity: "Trip",
    processed: trips.length,
    updated,
    unmatched,
  }
}

async function migrateComboScenes(): Promise<MigrationStats> {
  const combos = await prisma.combo.findMany({
    select: {
      id: true,
      sceneTags: true,
    },
  })

  const unmatched: Record<string, UnmatchedCounter> = {}
  const linksToCreate: { comboId: string; metadataId: string }[] = []

  for (const combo of combos) {
    if (!Array.isArray(combo.sceneTags)) {
      continue
    }
    for (const raw of combo.sceneTags) {
      if (typeof raw !== "string") continue
      const metadataId = findMetadataId("combo_scene_tag", raw)
      if (!metadataId) {
        recordUnmatched(unmatched, "combo_scene_tag", raw)
        continue
      }
      linksToCreate.push({ comboId: combo.id, metadataId })
    }
  }

  let created = 0
  if (options.apply && linksToCreate.length > 0) {
    const result = await prisma.comboSceneMetadata.createMany({
      data: linksToCreate,
      skipDuplicates: true,
    })
    created = result.count
  } else {
    created = linksToCreate.length
  }

  return {
    entity: "ComboSceneMetadata",
    processed: combos.length,
    updated: created,
    unmatched,
  }
}

function printStats(stats: MigrationStats) {
  console.log(
    `\n[${stats.entity}] processed=${stats.processed} updated=${stats.updated}${
      options.apply ? "" : " (dry-run)"
    }`,
  )
  Object.entries(stats.unmatched).forEach(([category, counter]) => {
    if (counter.size === 0) return
    console.log(`  Unmatched ${category}:`)
    counter.forEach((count, value) => {
      console.log(`    - ${value}: ${count}`)
    })
  })
}

async function main() {
  console.log(options.apply ? "Applying metadata migration..." : "Dry run: metadata migration preview")
  const metadata = await prisma.metadata.findMany()
  metadata.forEach((item) => {
    registerMetadata(item.category, item.id, item.value, item.aliases)
  })

  const stats = [
    await migrateRods(),
    await migrateReels(),
    await migrateTrips(),
    await migrateComboScenes(),
  ]

  stats.forEach(printStats)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
