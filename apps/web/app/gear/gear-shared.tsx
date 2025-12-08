"use client";

import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";

export type RodSummary = {
  id: string;
  name: string;
  brand: string | null;
  brandMetadataId?: string | null;
  length: number | null;
  lengthUnit: string | null;
  lengthUnitMetadataId?: string | null;
  power: string | null;
  powerMetadataId?: string | null;
  lureWeightMin: number | null;
  lureWeightMax: number | null;
  lineWeightText: string | null;
  price: number | null;
  note: string | null;
  visibility: "private" | "public";
  combosCount: number;
};

export type ReelSummary = {
  id: string;
  name: string;
  brand: string | null;
  brandMetadataId?: string | null;
  model: string | null;
  gearRatioText: string | null;
  lineCapacityText: string | null;
  price: number | null;
  note: string | null;
  visibility: "private" | "public";
  combosCount: number;
};

export type ComboSummary = {
  id: string;
  name: string;
  rodId: string;
  reelId: string;
  mainLineText: string | null;
  leaderLineText: string | null;
  hookText: string | null;
  detailNote: string | null;
  visibility: "private" | "public";
  sceneTags: string[] | null;
  sceneMetadataIds?: string[];
  customSceneTags?: string[];
  rod: { id: string; name: string } | null;
  reel: { id: string; name: string } | null;
  likeCount?: number;
  photoUrls?: string[];
};

export type RodLibraryItem = {
  id: string;
  name: string;
  brand: string | null;
  length: number | null;
  lengthUnit: string | null;
  power: string | null;
  lureWeightMin: number | null;
  lureWeightMax: number | null;
  lineWeightText: string | null;
  price: number | null;
  note: string | null;
  sourceType: "user" | "template" | "copied";
  updatedAt: string;
  ownerName: string;
};

export type ReelLibraryItem = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  gearRatioText: string | null;
  lineCapacityText: string | null;
  price: number | null;
  note: string | null;
  sourceType: "user" | "template" | "copied";
  updatedAt: string;
  ownerName: string;
};

export type GearLibraryItemBase = {
  id: string;
  name: string;
  ownerName: string;
  sourceType: "user" | "template" | "copied";
  updatedAt: string;
};

export type StatusState = { type: "success" | "error"; message: string } | null;

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export function nullableString(val: string) {
  return val.trim() || null;
}

// 用于 API payload：返回 string 或 undefined，而不是 null
export function optionalString(val: string | null | undefined) {
  const trimmed = val?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function nullableNumber(val: string) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

type ComboApiResponse = {
  id: string;
  name: string;
  rodId: string;
  reelId: string;
  mainLineText?: string | null;
  leaderLineText?: string | null;
  hookText?: string | null;
  detailNote?: string | null;
  visibility?: string | null;
  sceneTags?: unknown;
  sceneMetadata?: Array<{
    metadataId: string;
    metadata?: {
      label?: string | null;
      value?: string | null;
    } | null;
  }>;
  rod?: { id: string; name: string } | null;
  reel?: { id: string; name: string } | null;
  photoUrls?: string[];
};

export function normalizeComboResponse(data: ComboApiResponse): ComboSummary {
  const sceneMetadataIds =
    data.sceneMetadata?.map((item) => item.metadataId).filter(Boolean) ?? [];
  const metadataLabels =
    data.sceneMetadata
      ?.map((item) => item.metadata?.label ?? item.metadata?.value ?? null)
      .filter((item): item is string => Boolean(item)) ?? [];
  const fallbackSceneTags =
    Array.isArray(data.sceneTags)
      ? (data.sceneTags as unknown[])
          .map((item) => (typeof item === "string" ? item : null))
          .filter((item): item is string => Boolean(item))
      : null;
  const metadataLabelSet = new Set(metadataLabels);
  const customSceneTags =
    fallbackSceneTags?.filter((tag) => !metadataLabelSet.has(tag)) ?? [];
  const displaySceneTags =
    metadataLabels.length > 0 || customSceneTags.length > 0
      ? [...metadataLabels, ...customSceneTags]
      : fallbackSceneTags;
  return {
    id: data.id,
    name: data.name,
    rodId: data.rodId,
    reelId: data.reelId,
    mainLineText: data.mainLineText ?? null,
    leaderLineText: data.leaderLineText ?? null,
    hookText: data.hookText ?? null,
    detailNote: data.detailNote ?? null,
    visibility: (data.visibility as "private" | "public") ?? "private",
    sceneTags: displaySceneTags ?? null,
    sceneMetadataIds,
    customSceneTags,
    rod: data.rod ?? null,
    reel: data.reel ?? null,
    photoUrls: data.photoUrls,
  };
}

export function parseDateLabel(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}
