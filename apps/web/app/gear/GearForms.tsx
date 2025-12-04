"use client";

import { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {Textarea} from "@workspace/ui/components/textarea";
import { Input } from "@workspace/ui/components/input";
import { processImageForUpload } from "@/lib/image-utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { DialogFooter } from "@workspace/ui/components/dialog";
import { Loader2, Camera, X } from "lucide-react";
import { RodLibraryPicker, ReelLibraryPicker } from "./GearLibrary";
import {
  LabeledInput,
  nullableNumber,
  nullableString,
  parseSceneTags,
  normalizeComboResponse,
  RodSummary,
  ReelSummary,
  ComboSummary,
  RodLibraryItem,
  ReelLibraryItem,
  StatusState,
  optionalString,
} from "./gear-shared";

export function RodForm({ onSuccess, initialData, closeDialog }: { onSuccess: (rod: RodSummary) => void; initialData?: RodSummary; closeDialog?: () => void }) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    brand: initialData?.brand ?? "",
    length: initialData?.length?.toString() ?? "",
    lengthUnit: (initialData?.lengthUnit as "m" | "ft") ?? "m",
    power: initialData?.power ?? "",
    lureWeightMin: initialData?.lureWeightMin?.toString() ?? "",
    lureWeightMax: initialData?.lureWeightMax?.toString() ?? "",
    lineWeightText: initialData?.lineWeightText ?? "",
    note: initialData?.note ?? "",
    visibility: initialData?.visibility ?? "private",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const handleTemplateApply = (template: RodLibraryItem) => {
    setForm((prev) => ({
      ...prev,
      name: template.name ?? "",
      brand: template.brand ?? "",
      length: template.length?.toString() ?? "",
      lengthUnit: (template.lengthUnit as "m" | "ft") ?? prev.lengthUnit,
      power: template.power ?? "",
      lureWeightMin: template.lureWeightMin?.toString() ?? "",
      lureWeightMax: template.lureWeightMax?.toString() ?? "",
      lineWeightText: template.lineWeightText ?? "",
      note: template.note ?? "",
    }));
    setStatus({ type: "success", message: "已根据装备库模板填充，可继续调整" });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    const payload = {
      name: form.name.trim(),
      brand: nullableString(form.brand),
      length: nullableNumber(form.length),
      lengthUnit: form.lengthUnit,
      power: nullableString(form.power),
      lureWeightMin: nullableNumber(form.lureWeightMin),
      lureWeightMax: nullableNumber(form.lureWeightMax),
      lineWeightText: nullableString(form.lineWeightText),
      note: nullableString(form.note),
      visibility: form.visibility,
    };

    const url = initialData ? `/api/rods/${initialData.id}` : "/api/rods";
    const method = initialData ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }
      onSuccess({ ...result.data, combosCount: initialData?.combosCount ?? 0 });
      if (!initialData) {
        setForm({
          name: "",
          brand: "",
          length: "",
          lengthUnit: "m",
          power: "",
          lureWeightMin: "",
          lureWeightMax: "",
          lineWeightText: "",
          note: "",
          visibility: "private",
        });
      }
      setStatus({ type: "success", message: "保存成功" });
      if (closeDialog) {
        setTimeout(closeDialog, 500);
      }
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">快速复制</p>
            <p className="text-xs text-muted-foreground">引用其他钓友公开的鱼竿模板自动填充。</p>
          </div>
          <RodLibraryPicker onSelect={handleTemplateApply} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LabeledInput
          label="名称"
          required
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="例如：禧玛诺佐迪亚斯"
        />
        <LabeledInput
          label="品牌"
          value={form.brand}
          onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))}
          placeholder="例如：Shimano"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <LabeledInput
          label="长度"
          type="number"
          value={form.length}
          onChange={(value) => setForm((prev) => ({ ...prev, length: value }))}
          placeholder="1.98"
        />
        <div className="space-y-2">
          <Label>单位</Label>
          <Select
            value={form.lengthUnit}
            onValueChange={(value) => setForm((prev) => ({ ...prev, lengthUnit: value as "m" | "ft" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="单位" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="m">米 (m)</SelectItem>
              <SelectItem value="ft">英尺 (ft)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <LabeledInput
          label="硬度"
          value={form.power}
          onChange={(value) => setForm((prev) => ({ ...prev, power: value }))}
          placeholder="L / ML / M"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LabeledInput
          label="饵重下限 (g)"
          type="number"
          value={form.lureWeightMin}
          onChange={(value) => setForm((prev) => ({ ...prev, lureWeightMin: value }))}
        />
        <LabeledInput
          label="饵重上限 (g)"
          type="number"
          value={form.lureWeightMax}
          onChange={(value) => setForm((prev) => ({ ...prev, lureWeightMax: value }))}
        />
      </div>

      <LabeledInput
        label="线重范围"
        value={form.lineWeightText}
        onChange={(value) => setForm((prev) => ({ ...prev, lineWeightText: value }))}
        placeholder="例如：6-12lb"
      />

      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="记录使用感受、购买价格等..."
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>可见性</Label>
        <Select
          value={form.visibility}
          onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "private" | "public" }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有 (仅自己可见)</SelectItem>
            <SelectItem value="public">公开 (分享到装备库)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          公开后，其他钓友可以在公共装备库看到并引用此装备参数。
        </p>
      </div>

      {status && (
        <div
          className={
            status.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          + " text-sm p-2 rounded"
          }
        >
          {status.message}
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ReelForm({ onSuccess, initialData, closeDialog }: { onSuccess: (reel: ReelSummary) => void; initialData?: ReelSummary; closeDialog?: () => void }) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    brand: initialData?.brand ?? "",
    model: initialData?.model ?? "",
    gearRatioText: initialData?.gearRatioText ?? "",
    lineCapacityText: initialData?.lineCapacityText ?? "",
    note: initialData?.note ?? "",
    visibility: initialData?.visibility ?? "private",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const handleTemplateApply = (template: ReelLibraryItem) => {
    setForm((prev) => ({
      ...prev,
      name: template.name ?? "",
      brand: template.brand ?? "",
      model: template.model ?? "",
      gearRatioText: template.gearRatioText ?? "",
      lineCapacityText: template.lineCapacityText ?? "",
      note: template.note ?? "",
    }));
    setStatus({ type: "success", message: "已根据装备库模板填充，可继续调整" });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    const payload = {
      name: form.name.trim(),
      brand: nullableString(form.brand),
      model: nullableString(form.model),
      gearRatioText: nullableString(form.gearRatioText),
      lineCapacityText: nullableString(form.lineCapacityText),
      note: nullableString(form.note),
      visibility: form.visibility,
    };

    const url = initialData ? `/api/reels/${initialData.id}` : "/api/reels";
    const method = initialData ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }
      onSuccess({ ...result.data, combosCount: initialData?.combosCount ?? 0 });
      if (!initialData) {
        setForm({ name: "", brand: "", model: "", gearRatioText: "", lineCapacityText: "", note: "", visibility: "private" });
      }
      setStatus({ type: "success", message: "保存成功" });
      if (closeDialog) setTimeout(closeDialog, 500);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">快速复制</p>
            <p className="text-xs text-muted-foreground">引用其他钓友公开的渔轮模板自动填充。</p>
          </div>
          <ReelLibraryPicker onSelect={handleTemplateApply} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LabeledInput label="名称" required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="例如：禧玛诺斯泰拉" />
        <LabeledInput label="品牌" value={form.brand} onChange={(v) => setForm((p) => ({ ...p, brand: v }))} placeholder="例如：Shimano" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LabeledInput label="型号" value={form.model} onChange={(v) => setForm((p) => ({ ...p, model: v }))} placeholder="例如：C3000XG" />
        <LabeledInput label="速比" value={form.gearRatioText} onChange={(v) => setForm((p) => ({ ...p, gearRatioText: v }))} placeholder="例如：6.4:1" />
      </div>

      <LabeledInput label="线容量" value={form.lineCapacityText} onChange={(v) => setForm((p) => ({ ...p, lineCapacityText: v }))} placeholder="例如：PE 1.5号-200m" />

      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="记录使用感受、购买价格等..." className="resize-none" />
      </div>

      <div className="space-y-2">
        <Label>可见性</Label>
        <Select value={form.visibility} onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "private" | "public" }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有 (仅自己可见)</SelectItem>
            <SelectItem value="public">公开 (分享到装备库)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">公开后，其他钓友可以在公共装备库看到并引用此装备参数。</p>
      </div>

      {status && (
        <div className={status.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600" + " text-sm p-2 rounded"}>
          {status.message}
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ComboForm({
  rods,
  reels,
  onSuccess,
  initialData,
  closeDialog,
}: {
  rods: RodSummary[];
  reels: ReelSummary[];
  onSuccess: (combo: ComboSummary) => void;
  initialData?: ComboSummary;
  closeDialog?: () => void;
}) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    rodId: initialData?.rodId ?? rods[0]?.id ?? "",
    reelId: initialData?.reelId ?? reels[0]?.id ?? "",
    mainLineText: initialData?.mainLineText ?? "",
    leaderLineText: initialData?.leaderLineText ?? "",
    hookText: initialData?.hookText ?? "",
    detailNote: initialData?.detailNote ?? "",
    sceneTags: initialData?.sceneTags?.join(",") ?? "",
    visibility: initialData?.visibility ?? "private",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrls?.[0] ?? null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "compressing" | "uploading">("idle");
  const isUploading = uploadStatus !== "idle";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = rods.length > 0 && reels.length > 0;

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 阶段1: 压缩图片
      setUploadStatus("compressing");
      const { blob, filename } = await processImageForUpload(file);

      // 阶段2: 上传到服务器
      setUploadStatus("uploading");
      const formData = new FormData();
      formData.append("file", blob, filename);

      const res = await fetch("/api/upload/catch-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setPhotoUrl(data.data.url as string);
      } else {
        alert(data.error || "上传失败");
      }
    } catch (error) {
      console.error("上传失败:", error);
      alert("上传失败，请重试");
    } finally {
      setUploadStatus("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (!canSubmit) {
      setStatus({ type: "error", message: "请先创建鱼竿和渔轮" });
      return;
    }
    setIsLoading(true);

    const payload = {
      name: form.name.trim(),
      rodId: form.rodId,
      reelId: form.reelId,
      mainLineText: optionalString(form.mainLineText),
      leaderLineText: optionalString(form.leaderLineText),
      hookText: optionalString(form.hookText),
      detailNote: optionalString(form.detailNote),
      visibility: form.visibility,
      sceneTags: parseSceneTags(form.sceneTags),
      photoUrls: photoUrl ? [photoUrl] : undefined,
    };

    const url = initialData ? `/api/combos/${initialData.id}` : "/api/combos";
    const method = initialData ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }

      onSuccess(normalizeComboResponse(result.data));
      if (!initialData) {
        setForm({ name: "", rodId: rods[0]?.id ?? "", reelId: reels[0]?.id ?? "", mainLineText: "", leaderLineText: "", hookText: "", detailNote: "", sceneTags: "", visibility: "private" });
        setPhotoUrl(null);
      }
      setStatus({ type: "success", message: "保存成功" });
      if (closeDialog) setTimeout(closeDialog, 500);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "保存失败" });
    } finally {
      setIsLoading(false);
    }
  }

  if (!canSubmit) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>创建组合前，请先添加至少一根鱼竿和一个渔轮。</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <LabeledInput label="组合名称" required value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="例如：远投泛用套装" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>选择鱼竿</Label>
          <Select value={form.rodId} onValueChange={(value) => setForm((prev) => ({ ...prev, rodId: value }))} required>
            <SelectTrigger>
              <SelectValue placeholder="选择鱼竿" />
            </SelectTrigger>
            <SelectContent>
              {rods.map((rod) => (
                <SelectItem key={rod.id} value={rod.id}>{rod.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>选择渔轮</Label>
          <Select value={form.reelId} onValueChange={(value) => setForm((prev) => ({ ...prev, reelId: value }))} required>
            <SelectTrigger>
              <SelectValue placeholder="选择渔轮" />
            </SelectTrigger>
            <SelectContent>
              {reels.map((reel) => (
                <SelectItem key={reel.id} value={reel.id}>{reel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <LabeledInput label="主线" value={form.mainLineText} onChange={(v) => setForm((p) => ({ ...p, mainLineText: v }))} placeholder="例如：PE 1.0" />
        <LabeledInput label="子线" value={form.leaderLineText} onChange={(v) => setForm((p) => ({ ...p, leaderLineText: v }))} placeholder="例如：碳线 2.0" />
        <LabeledInput label="钩型" value={form.hookText} onChange={(v) => setForm((p) => ({ ...p, hookText: v }))} placeholder="例如：曲柄钩 2#" />
      </div>

      <div className="space-y-2">
        <Label>适用场景（逗号分隔）</Label>
        <Input value={form.sceneTags} onChange={(e) => setForm((p) => ({ ...p, sceneTags: e.target.value }))} placeholder="例如：溪流, 微物" />
      </div>

      <div className="space-y-2">
        <Label>详细说明</Label>
        <Textarea value={form.detailNote} onChange={(e) => setForm((p) => ({ ...p, detailNote: e.target.value }))} placeholder="记录这套组合的适用场景、使用心得等..." className="resize-none h-24" />
      </div>

      <div className="space-y-2">
        <Label>
          组合照片 <span className="text-xs text-slate-400 font-normal">（可选，单张）</span>
        </Label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
        {photoUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
              <img src={photoUrl} alt="组合照片" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setPhotoUrl(null)} className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50">
            {uploadStatus === "compressing" ? (
              <><Loader2 size={24} className="animate-spin" /><span className="text-xs mt-1">压缩中...</span></>
            ) : uploadStatus === "uploading" ? (
              <><Loader2 size={24} className="animate-spin" /><span className="text-xs mt-1">上传中...</span></>
            ) : (
              <><Camera size={24} /><span className="text-xs mt-1">添加照片</span></>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <Label>可见性</Label>
        <Select value={form.visibility} onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "private" | "public" }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有 (仅自己可见)</SelectItem>
            <SelectItem value="public">公开 (分享到装备库)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">公开后，其他钓友可以在公共装备库看到你的搭配方案。</p>
      </div>

      {status && (
        <div className={status.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600" + " text-sm p-2 rounded"}>
          {status.message}
        </div>
      )}

      <DialogFooter>
        <Button type="submit" disabled={isLoading || isUploading}>
          {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? "上传中..." : "保存"}
        </Button>
      </DialogFooter>
    </form>
  );
}
