"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { FishingSpotFormDialog } from "@/components/fishing-spot-form-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import { LocationPicker } from "@/components/map";

const SpotsMap = dynamic(() => import("@/components/map/trips-map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
      <div className="text-sm text-slate-500">地图加载中...</div>
    </div>
  ),
});

type SpotSummary = {
  id: string;
  name: string;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  description?: string | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  tripCount: number;
  lastTrip: {
    id: string;
    title: string | null;
    startTime: string;
    totalCatchCount: number;
    fishSpeciesCount: number;
  } | null;
};

type MapSpot = {
  id: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  description?: string | null;
  visibility: string;
  tripCount: number;
  lastTrip: {
    title: string | null;
    startTime: string;
    totalCatchCount: number;
    fishSpeciesCount: number;
  } | null;
};

export default function SpotsDashboard({
  spots,
  mapSpots,
}: {
  spots: SpotSummary[];
  mapSpots: MapSpot[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"list" | "map">("list");
  const [showCreate, setShowCreate] = useState(false);
  const [editingSpot, setEditingSpot] = useState<SpotSummary | null>(null);

  useEffect(() => {
    const editId = searchParams?.get("edit");
    if (editId) {
      const target = spots.find((spot) => spot.id === editId);
      if (target) {
        setEditingSpot(target);
      }
    }
  }, [searchParams, spots]);

  const stats = useMemo(() => {
    const withCoords = spots.filter((spot) => spot.locationLat && spot.locationLng).length;
    const publicCount = spots.filter((spot) => spot.visibility === "public").length;
    return {
      total: spots.length,
      withCoords,
      publicCount,
    };
  }, [spots]);

  const handleCreated = () => {
    setShowCreate(false);
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">钓点管理</h1>
          <p className="text-sm text-slate-500">维护常用钓点，出击时即可快速选择。</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/trips/map"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
          >
            查看钓点地图
          </Link>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            新建钓点
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-3">
        <StatCard label="全部钓点" value={stats.total} note={stats.total > 0 ? "含私密与公开" : "暂未创建"} />
        <StatCard label="已定位" value={stats.withCoords} note="拥有精确坐标" />
        <StatCard label="公开钓点" value={stats.publicCount} note="可分享给钓友" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              view === "list" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            列表视图
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              view === "map" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            地图视图
          </button>
        </div>

        {view === "list" ? (
          <div className="divide-y divide-slate-100">
            {spots.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-500">暂未创建钓点，点击右上角“新建钓点”开始记录。</div>
            )}
            {spots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => setEditingSpot(spot)}
                className="flex w-full flex-col gap-3 border-b border-slate-100 py-4 text-left transition hover:bg-slate-50 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{spot.name}</h3>
                    <VisibilityBadge value={spot.visibility} />
                    {!spot.locationLat && (
                      <span className="text-xs text-amber-600">未选坐标</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {spot.locationName || "未填写位置名称"}
                  </p>
                  {spot.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{spot.description}</p>
                  )}
                  <p className="text-xs text-slate-400">点击即可查看详情与编辑</p>
                </div>
                <div className="text-sm text-slate-500 md:text-right">
                  <div>关联出击：<span className="font-semibold text-slate-900">{spot.tripCount}</span></div>
                  <div>
                    最近出击：
                    {spot.lastTrip ? (
                      <span>
                        {new Date(spot.lastTrip.startTime).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      </span>
                    ) : (
                      <span>暂无</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    更新于 {new Date(spot.updatedAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            {mapSpots.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                暂无坐标信息的钓点
              </div>
            ) : (
              <div className="h-[500px] overflow-hidden rounded-2xl border border-slate-100">
                <SpotsMap spots={mapSpots} />
              </div>
            )}
          </div>
        )}
      </div>

      <FishingSpotFormDialog open={showCreate} onOpenChange={setShowCreate} onCreated={handleCreated} />
      <SpotEditorDialog
        spot={editingSpot}
        open={!!editingSpot}
        onOpenChange={(open) => {
          if (!open) setEditingSpot(null);
        }}
        onUpdated={handleCreated}
      />
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{note}</p>
    </div>
  );
}

function VisibilityBadge({ value }: { value: string }) {
  if (value === "public") {
    return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">公开</span>;
  }
  if (value === "friends") {
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">好友</span>;
  }
  return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">私密</span>;
}

function SpotEditorDialog({
  spot,
  open,
  onOpenChange,
  onUpdated,
}: {
  spot: SpotSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [visibility, setVisibility] = useState<SpotSummary["visibility"]>("private");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spot) {
      setName(spot.name);
      setLocationName(spot.locationName || "");
      setLocation(
        spot.locationLat && spot.locationLng ? { lat: spot.locationLat, lng: spot.locationLng } : null
      );
      setVisibility(spot.visibility);
      setDescription(spot.description || "");
      setError(null);
    }
  }, [spot]);

  const handleSave = async () => {
    if (!spot) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/spots/${spot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          locationName: locationName.trim() || undefined,
          locationLat: location?.lat,
          locationLng: location?.lng,
          description: description.trim() || undefined,
          visibility,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "更新失败");
      }
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!spot) return;
    if (!confirm("确定删除该钓点吗？已关联的出击将无法再选此钓点。")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/spots/${spot.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "删除失败");
      }
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>管理钓点</DialogTitle>
        </DialogHeader>
        {spot ? (
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                钓点名称 <span className="text-red-500">*</span>
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <LocationPicker
              value={location}
              onChange={(val) => setLocation(val ? { lat: val.lat, lng: val.lng } : null)}
              locationName={locationName}
              onLocationNameChange={setLocationName}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">钓点说明</label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">钓点可见性</label>
              <div className="flex gap-2">
                {[
                  { key: "private", label: "私密" },
                  { key: "friends", label: "仅好友" },
                  { key: "public", label: "公开" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setVisibility(option.key as SpotSummary["visibility"])}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                      visibility === option.key
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">未选择钓点</div>
        )}
        <DialogFooter className="flex w-full flex-row items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-600"
            disabled={saving || !spot}
          >
            删除钓点
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !spot}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
