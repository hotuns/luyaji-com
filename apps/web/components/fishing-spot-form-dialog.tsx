"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

import type { FishingSpotOption } from "@/hooks/use-fishing-spots";
import { LocationPicker } from "@/components/map";

interface FishingSpotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultLocationName?: string;
  defaultLocation?: { lat: number; lng: number } | null;
  onCreated?: (spot: FishingSpotOption) => void;
}

type Visibility = "private" | "friends" | "public";

export function FishingSpotFormDialog({
  open,
  onOpenChange,
  defaultName,
  defaultLocationName,
  defaultLocation,
  onCreated,
}: FishingSpotFormDialogProps) {
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setLocationName(defaultLocationName || "");
      setLocation(defaultLocation || null);
      setVisibility("private");
      setDescription("");
      setError(null);
    }
  }, [open, defaultName, defaultLocationName, defaultLocation]);

  const disabled = useMemo(() => !name.trim(), [name]);

  const handleSubmit = async () => {
    if (disabled) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          locationName: locationName.trim() || undefined,
          locationLat: location?.lat,
          locationLng: location?.lng,
          description: description.trim() || undefined,
          visibility,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "创建钓点失败");
      }
      onCreated?.(json.data as FishingSpotOption);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加钓点</DialogTitle>
          <DialogDescription>
            钓点可以重复使用，并拥有独立的公开设置。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              钓点名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：千岛湖北湾桦树林"
              maxLength={60}
            />
          </div>

          <LocationPicker
            value={location}
            onChange={(val) => setLocation(val ? { lat: val.lat, lng: val.lng } : null)}
            locationName={locationName}
            onLocationNameChange={setLocationName}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              钓点说明 <span className="text-slate-400">（选填）</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="记录地形、水深、鱼情等信息，方便自己回顾"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              钓点可见性
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "private", label: "私密", desc: "仅自己可见" },
                  { key: "friends", label: "仅好友", desc: "未来可控" },
                  { key: "public", label: "公开", desc: "可分享" },
                ] as { key: Visibility; label: string; desc: string }[]
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setVisibility(option.key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    visibility === option.key
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="font-medium text-sm text-slate-900">
                    {option.label}
                  </div>
                  <div className="text-[11px] text-slate-500">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || submitting}
          >
            {submitting ? "保存中..." : "保存钓点"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
