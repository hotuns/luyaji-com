export const METADATA_CATEGORIES = [
  "rod_brand",
  "reel_brand",
  "rod_power",
  "length_unit",
  "combo_scene_tag",
  "weather_type",
] as const

export type MetadataCategory = (typeof METADATA_CATEGORIES)[number]

export type MetadataOption = {
  id: string
  value: string
  label: string
  extra?: unknown
}
