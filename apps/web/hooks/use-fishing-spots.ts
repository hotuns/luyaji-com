import { useCallback, useEffect, useState } from "react";

export interface FishingSpotOption {
  id: string;
  name: string;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  description?: string | null;
  visibility: "private" | "friends" | "public";
}

interface SpotsResponse {
  success: boolean;
  data?: FishingSpotOption[];
  error?: string;
}

export function useFishingSpots() {
  const [spots, setSpots] = useState<FishingSpotOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spots", { cache: "no-store" });
      const json: SpotsResponse = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "获取钓点失败");
      }
      setSpots(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("获取钓点失败", err);
      setError(err instanceof Error ? err.message : "获取失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertSpot = useCallback((spot: FishingSpotOption) => {
    setSpots((prev) => {
      const index = prev.findIndex((item) => item.id === spot.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = spot;
        return next;
      }
      return [spot, ...prev];
    });
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  return { spots, loading, error, reload: fetchSpots, upsertSpot };
}
