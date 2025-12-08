import { useCallback, useEffect, useState } from "react"
import type { MetadataCategory, MetadataOption } from "@/lib/metadata"

export function useMetadataOptions(category: MetadataCategory) {
  const [options, setOptions] = useState<MetadataOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/metadata?category=${category}`, {
        cache: "no-store",
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.error || "获取元数据失败")
      }
      setOptions(json.data ?? [])
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取元数据失败")
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  return {
    options,
    loading,
    error,
    reload: fetchOptions,
  }
}
