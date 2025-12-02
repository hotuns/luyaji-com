"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@workspace/ui/components/dialog";

import { cn } from "@workspace/ui/lib/utils";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";

export type RodSummary = {
  id: string;
  name: string;
  brand: string | null;
  length: number | null;
  lengthUnit: string | null;
  power: string | null;
  lureWeightMin: number | null;
  lureWeightMax: number | null;
  lineWeightText: string | null;
  note: string | null;
  visibility: "private" | "public";
  combosCount: number;
};

export type ReelSummary = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  gearRatioText: string | null;
  lineCapacityText: string | null;
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
  rod: { id: string; name: string } | null;
  reel: { id: string; name: string } | null;
};

type RodLibraryItem = {
  id: string;
  name: string;
  brand: string | null;
  length: number | null;
  lengthUnit: string | null;
  power: string | null;
  lureWeightMin: number | null;
  lureWeightMax: number | null;
  lineWeightText: string | null;
  note: string | null;
  updatedAt: string;
  ownerName: string;
};

type ReelLibraryItem = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  gearRatioText: string | null;
  lineCapacityText: string | null;
  note: string | null;
  updatedAt: string;
  ownerName: string;
};

type GearLibraryItemBase = {
  id: string;
  name: string;
  ownerName: string;
  updatedAt: string;
};

type GearDashboardProps = {
  initialRods: RodSummary[];
  initialReels: ReelSummary[];
  initialCombos: ComboSummary[];
};

export function GearDashboard({ initialRods, initialReels, initialCombos }: GearDashboardProps) {
  const [rods, setRods] = useState(initialRods);
  const [reels, setReels] = useState(initialReels);
  const [combos, setCombos] = useState(initialCombos);
  const [gearTab, setGearTab] = useState<"combos" | "rods" | "reels">("combos");

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 顶部标题和标签 - 匹配 Demo GearView */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* Custom Tabs - 匹配 Demo 样式 */}
        <div className="flex p-1 bg-slate-200/60 rounded-xl md:w-auto w-full">
          {[
            { key: "combos" as const, label: "组合", count: combos.length },
            { key: "rods" as const, label: "鱼竿", count: rods.length },
            { key: "reels" as const, label: "渔轮", count: reels.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setGearTab(t.key)}
              className={cn(
                "flex-1 md:flex-none md:w-24 py-2 text-sm font-medium rounded-lg transition-all",
                gearTab === t.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* 添加按钮 */}
        {gearTab === "combos" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="hidden md:flex gap-2 h-10 text-sm">
                <Plus className="h-4 w-4" />
                新建组合
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新组合</DialogTitle>
                <DialogDescription>
                  将鱼竿和渔轮搭配，并记录线组信息。
                </DialogDescription>
              </DialogHeader>
              <ComboForm
                rods={rods}
                reels={reels}
                onSuccess={(combo) => setCombos((prev) => [combo, ...prev])}
              />
            </DialogContent>
          </Dialog>
        )}
        {gearTab === "rods" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="hidden md:flex gap-2 h-10 text-sm">
                <Plus className="h-4 w-4" />
                新增鱼竿
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增鱼竿</DialogTitle>
                <DialogDescription>记录你的鱼竿参数。</DialogDescription>
              </DialogHeader>
              <RodForm onSuccess={(rod) => setRods((prev) => [rod, ...prev])} />
            </DialogContent>
          </Dialog>
        )}
        {gearTab === "reels" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="hidden md:flex gap-2 h-10 text-sm">
                <Plus className="h-4 w-4" />
                新增渔轮
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增渔轮</DialogTitle>
                <DialogDescription>记录你的渔轮参数。</DialogDescription>
              </DialogHeader>
              <ReelForm onSuccess={(reel) => setReels((prev) => [reel, ...prev])} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 组合列表 */}
      {gearTab === "combos" && (
        <div className="space-y-4">
          {/* Mobile 添加按钮 */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="md:hidden w-full gap-2">
                <Plus className="h-4 w-4" />
                新建组合
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新组合</DialogTitle>
                <DialogDescription>
                  将鱼竿和渔轮搭配，并记录线组信息。
                </DialogDescription>
              </DialogHeader>
              <ComboForm
                rods={rods}
                reels={reels}
                onSuccess={(combo) => setCombos((prev) => [combo, ...prev])}
              />
            </DialogContent>
          </Dialog>

          {combos.length === 0 ? (
            <EmptyState description="还没有组合，点击上方按钮创建一个吧" />
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {combos.map((combo) => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  rods={rods}
                  reels={reels}
                  onUpdated={(next) =>
                    setCombos((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                  }
                  onDeleted={() => setCombos((prev) => prev.filter((item) => item.id !== combo.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 鱼竿列表 */}
      {gearTab === "rods" && (
        <div className="space-y-4">
          {/* Mobile 添加按钮 */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="md:hidden w-full gap-2">
                <Plus className="h-4 w-4" />
                新增鱼竿
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增鱼竿</DialogTitle>
                <DialogDescription>记录你的鱼竿参数。</DialogDescription>
              </DialogHeader>
              <RodForm onSuccess={(rod) => setRods((prev) => [rod, ...prev])} />
            </DialogContent>
          </Dialog>

          {rods.length === 0 ? (
            <EmptyState description="尚未创建鱼竿" />
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {rods.map((rod) => (
                <RodCard
                  key={rod.id}
                  rod={rod}
                  onUpdated={(next) =>
                    setRods((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                  }
                  onDeleted={() => setRods((prev) => prev.filter((item) => item.id !== rod.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 渔轮列表 */}
      {gearTab === "reels" && (
        <div className="space-y-4">
          {/* Mobile 添加按钮 */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="md:hidden w-full gap-2">
                <Plus className="h-4 w-4" />
                新增渔轮
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增渔轮</DialogTitle>
                <DialogDescription>记录你的渔轮参数。</DialogDescription>
              </DialogHeader>
              <ReelForm onSuccess={(reel) => setReels((prev) => [reel, ...prev])} />
            </DialogContent>
          </Dialog>

          {reels.length === 0 ? (
            <EmptyState description="尚未创建渔轮" />
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {reels.map((reel) => (
                <ReelCard
                  key={reel.id}
                  reel={reel}
                  onUpdated={(next) =>
                    setReels((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                  }
                  onDeleted={() => setReels((prev) => prev.filter((item) => item.id !== reel.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type StatusState = { type: "success" | "error"; message: string } | null;

function EmptyState({ description }: { description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Settings2 className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-slate-500 text-sm">{description}</p>
    </div>
  );
}

// --- Forms ---

function RodForm({ onSuccess, initialData, closeDialog }: { onSuccess: (rod: RodSummary) => void; initialData?: RodSummary; closeDialog?: () => void }) {
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
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败",
      });
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
        label="适用线号"
        value={form.lineWeightText}
        onChange={(value) => setForm((prev) => ({ ...prev, lineWeightText: value }))}
        placeholder="例如：4-10lb"
      />

      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          rows={3}
          placeholder="记录一些额外信息..."
        />
      </div>

      <div className="space-y-2">
        <Label>可见性</Label>
        <Select
          value={form.visibility}
          onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "private" | "public" }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择可见性" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有 (仅自己可见)</SelectItem>
            <SelectItem value="public">公开 (展示在个人主页)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status && (
        <p
          className={cn(
            "text-sm rounded-md px-3 py-2",
            status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {status.message}
        </p>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        {closeDialog && (
          <Button type="button" variant="outline" onClick={closeDialog}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ReelForm({ onSuccess, initialData, closeDialog }: { onSuccess: (reel: ReelSummary) => void; initialData?: ReelSummary; closeDialog?: () => void }) {
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
        setForm({
          name: "",
          brand: "",
          model: "",
          gearRatioText: "",
          lineCapacityText: "",
          note: "",
          visibility: "private",
        });
      }
      setStatus({ type: "success", message: "保存成功" });
      if (closeDialog) {
        setTimeout(closeDialog, 500);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败",
      });
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
            <p className="text-xs text-muted-foreground">使用其他钓友公开的渔轮模板快速填写。</p>
          </div>
          <ReelLibraryPicker onSelect={handleTemplateApply} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LabeledInput
          label="名称"
          required
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="例如：斯泰拉 2500"
        />
        <LabeledInput
          label="品牌"
          value={form.brand}
          onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))}
          placeholder="例如：Shimano"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput
          label="型号"
          value={form.model}
          onChange={(value) => setForm((prev) => ({ ...prev, model: value }))}
          placeholder="例如：C2000S"
        />
        <LabeledInput
          label="速比"
          value={form.gearRatioText}
          onChange={(value) => setForm((prev) => ({ ...prev, gearRatioText: value }))}
          placeholder="例如：5.1:1"
        />
      </div>

      <LabeledInput
        label="线容量"
        value={form.lineCapacityText}
        onChange={(value) => setForm((prev) => ({ ...prev, lineCapacityText: value }))}
        placeholder="例如：PE 0.8号-150m"
      />

      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          rows={3}
          placeholder="记录一些额外信息..."
        />
      </div>

      <div className="space-y-2">
        <Label>可见性</Label>
        <Select
          value={form.visibility}
          onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "private" | "public" }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择可见性" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有 (仅自己可见)</SelectItem>
            <SelectItem value="public">公开 (展示在个人主页)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status && (
        <p
          className={cn(
            "text-sm rounded-md px-3 py-2",
            status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {status.message}
        </p>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        {closeDialog && (
          <Button type="button" variant="outline" onClick={closeDialog}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RodLibraryPicker({ onSelect }: { onSelect: (item: RodLibraryItem) => void }) {
  return (
    <GearLibraryDialog<RodLibraryItem>
      type="rod"
      title="从装备库复制鱼竿"
      description="展示其他钓友公开的鱼竿参数，选择后会自动填充表单。"
      trigger={
        <Button type="button" size="sm" variant="outline">
          选择模板
        </Button>
      }
      formatMeta={(item) => {
        const specs = [
          item.brand,
          item.length ? `${item.length}${item.lengthUnit ?? ""}` : null,
          item.power,
        ].filter(Boolean);
        const lureRange =
          item.lureWeightMin || item.lureWeightMax
            ? `${item.lureWeightMin ?? "?"}-${item.lureWeightMax ?? "?"}g 饵重`
            : null;
        const lineText = item.lineWeightText ? `线号 ${item.lineWeightText}` : null;
        return [...specs, lureRange, lineText].filter(Boolean).join(" ｜ ");
      }}
      onSelect={onSelect}
    />
  );
}

function ReelLibraryPicker({ onSelect }: { onSelect: (item: ReelLibraryItem) => void }) {
  return (
    <GearLibraryDialog<ReelLibraryItem>
      type="reel"
      title="从装备库复制渔轮"
      description="使用其他钓友公开的渔轮模板，自动带出常用参数。"
      trigger={
        <Button type="button" size="sm" variant="outline">
          选择模板
        </Button>
      }
      formatMeta={(item) => {
        const specs = [item.brand, item.model, item.gearRatioText].filter(Boolean);
        const line = item.lineCapacityText ? `线容量 ${item.lineCapacityText}` : null;
        return [...specs, line].filter(Boolean).join(" ｜ ");
      }}
      onSelect={onSelect}
    />
  );
}

type GearLibraryDialogProps<T extends GearLibraryItemBase> = {
  type: "rod" | "reel";
  title: string;
  description: string;
  trigger: ReactNode;
  formatMeta: (item: T) => string;
  onSelect: (item: T) => void;
};

function GearLibraryDialog<T extends GearLibraryItemBase>({ type, title, description, trigger, formatMeta, onSelect }: GearLibraryDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const handler = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ type });
        if (query) {
          params.set("q", query);
        }
        const response = await fetch(`/api/gear-library?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "加载失败");
        }
        if (!cancelled) {
          setItems(data.data as T[]);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "加载失败");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [open, query, type]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setQuery("");
          setItems([]);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索名称、品牌或备注"
        />
        <p className="text-xs text-muted-foreground">仅展示其他钓友公开的装备模板</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无可复制的装备，试试调整关键词</p>
          ) : (
            items.map((item) => {
              const meta = formatMeta(item);
              const updatedLabel = new Date(item.updatedAt).toLocaleDateString();
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full rounded-lg border bg-white p-3 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="secondary">来自 {item.ownerName}</Badge>
                  </div>
                  {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">最近更新 {updatedLabel}</p>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComboForm({
  rods,
  reels,
  initialData,
  onSuccess,
  closeDialog,
}: {
  rods: RodSummary[];
  reels: ReelSummary[];
  initialData?: ComboSummary;
  onSuccess: (combo: ComboSummary) => void;
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

  const canSubmit = rods.length > 0 && reels.length > 0;

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
      mainLineText: nullableString(form.mainLineText),
      leaderLineText: nullableString(form.leaderLineText),
      hookText: nullableString(form.hookText),
      detailNote: nullableString(form.detailNote),
      visibility: form.visibility,
      sceneTags: parseSceneTags(form.sceneTags),
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
        setForm({
          name: "",
          rodId: rods[0]?.id ?? "",
          reelId: reels[0]?.id ?? "",
          mainLineText: "",
          leaderLineText: "",
          hookText: "",
          detailNote: "",
          sceneTags: "",
          visibility: "private",
        });
      }
      setStatus({ type: "success", message: "保存成功" });
      if (closeDialog) {
        setTimeout(closeDialog, 500);
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败",
      });
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
      <LabeledInput
        label="组合名称"
        required
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        placeholder="例如：泛用直柄套装"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>鱼竿</Label>
          <Select
            value={form.rodId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, rodId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择鱼竿" />
            </SelectTrigger>
            <SelectContent>
              {rods.map((rod) => (
                <SelectItem key={rod.id} value={rod.id}>
                  {rod.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>渔轮</Label>
          <Select
            value={form.reelId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, reelId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择渔轮" />
            </SelectTrigger>
            <SelectContent>
              {reels.map((reel) => (
                <SelectItem key={reel.id} value={reel.id}>
                  {reel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <LabeledInput
          label="主线"
          value={form.mainLineText}
          onChange={(value) => setForm((prev) => ({ ...prev, mainLineText: value }))}
          placeholder="PE 0.8"
        />
        <LabeledInput
          label="前导线"
          value={form.leaderLineText}
          onChange={(value) => setForm((prev) => ({ ...prev, leaderLineText: value }))}
          placeholder="碳线 2.0"
        />
        <LabeledInput
          label="钩/亮片"
          value={form.hookText}
          onChange={(value) => setForm((prev) => ({ ...prev, hookText: value }))}
          placeholder="3g 亮片"
        />
      </div>

      <div className="space-y-2">
        <Label>适用场景（逗号分隔）</Label>
        <Input
          value={form.sceneTags}
          onChange={(event) => setForm((prev) => ({ ...prev, sceneTags: event.target.value }))}
          placeholder="例如：溪流, 微物"
        />
      </div>

      <div className="space-y-2">
        <Label>补充说明</Label>
        <Textarea
          rows={3}
          value={form.detailNote}
          onChange={(event) => setForm((prev) => ({ ...prev, detailNote: event.target.value }))}
          placeholder="记录一些额外信息..."
        />
      </div>

      <div className="space-y-2">
        <Label>可见性</Label>
        <Select
          value={form.visibility}
          onValueChange={(value) => setForm((prev) => ({ ...prev, visibility: value as "private" | "public" }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择可见性" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有 (仅自己可见)</SelectItem>
            <SelectItem value="public">公开 (展示在个人主页)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status && (
        <p
          className={cn(
            "text-sm rounded-md px-3 py-2",
            status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {status.message}
        </p>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        {closeDialog && (
          <Button type="button" variant="outline" onClick={closeDialog}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// --- Cards ---

function RodCard({
  rod,
  onUpdated,
  onDeleted,
}: {
  rod: RodSummary;
  onUpdated: (rod: RodSummary) => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    if (!window.confirm("确定删除该鱼竿？")) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rods/${rod.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "删除失败");
      }
      onDeleted();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-3">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate" title={rod.name}>
                {rod.name}
              </h3>
              {rod.visibility === "public" && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 font-normal">
                  公开
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {rod.brand || "未知品牌"}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>编辑鱼竿</DialogTitle>
                </DialogHeader>
                <RodForm
                  initialData={rod}
                  onSuccess={(updated) => {
                    onUpdated(updated);
                    setIsDialogOpen(false);
                  }}
                  closeDialog={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 rounded p-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex flex-col">
            <span className="scale-90 origin-top-left opacity-70">长度</span>
            <span className="font-medium text-foreground">
              {rod.length ? `${rod.length}${rod.lengthUnit}` : "-"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="scale-90 origin-top-left opacity-70">硬度</span>
            <span className="font-medium text-foreground">{rod.power || "-"}</span>
          </div>
          <div className="flex flex-col">
            <span className="scale-90 origin-top-left opacity-70">饵重</span>
            <span className="font-medium text-foreground truncate">
              {rod.lureWeightMin || rod.lureWeightMax
                ? `${rod.lureWeightMin ?? "?"}-${rod.lureWeightMax ?? "?"}g`
                : "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="truncate max-w-[70%]">
            {rod.note ? rod.note : <span className="opacity-50">无备注</span>}
          </div>
          <div className="shrink-0">组合: {rod.combosCount}</div>
        </div>
      </div>
    </Card>
  );
}

function ReelCard({
  reel,
  onUpdated,
  onDeleted,
}: {
  reel: ReelSummary;
  onUpdated: (reel: ReelSummary) => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    if (!window.confirm("确定删除该渔轮？")) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reels/${reel.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "删除失败");
      }
      onDeleted();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-3">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate" title={reel.name}>
                {reel.name}
              </h3>
              {reel.visibility === "public" && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 font-normal">
                  公开
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {reel.brand || "未知品牌"}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>编辑渔轮</DialogTitle>
                </DialogHeader>
                <ReelForm
                  initialData={reel}
                  onSuccess={(updated) => {
                    onUpdated(updated);
                    setIsDialogOpen(false);
                  }}
                  closeDialog={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 rounded p-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
          <div className="flex flex-col">
            <span className="scale-90 origin-top-left opacity-70">型号</span>
            <span className="font-medium text-foreground">{reel.model || "-"}</span>
          </div>
          <div className="flex flex-col">
            <span className="scale-90 origin-top-left opacity-70">速比</span>
            <span className="font-medium text-foreground">{reel.gearRatioText || "-"}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="scale-90 origin-top-left opacity-70">线容量</span>
            <span className="font-medium text-foreground truncate" title={reel.lineCapacityText || ""}>
              {reel.lineCapacityText || "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="truncate max-w-[70%]">
            {reel.note ? reel.note : <span className="opacity-50">无备注</span>}
          </div>
          <div className="shrink-0">组合: {reel.combosCount}</div>
        </div>
      </div>
    </Card>
  );
}

function ComboCard({
  combo,
  rods,
  reels,
  onUpdated,
  onDeleted,
}: {
  combo: ComboSummary;
  rods: RodSummary[];
  reels: ReelSummary[];
  onUpdated: (combo: ComboSummary) => void;
  onDeleted: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete() {
    if (!window.confirm("确定删除该组合？")) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/combos/${combo.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "删除失败");
      }
      onDeleted();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <div className="p-3">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate" title={combo.name}>
                {combo.name}
              </h3>
              {combo.visibility === "public" && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 font-normal">
                  公开
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {combo.sceneTags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>编辑组合</DialogTitle>
                </DialogHeader>
                <ComboForm
                  rods={rods}
                  reels={reels}
                  initialData={combo}
                  onSuccess={(updated) => {
                    onUpdated(updated);
                    setIsDialogOpen(false);
                  }}
                  closeDialog={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="shrink-0 w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
              竿
            </span>
            <span className="truncate text-slate-700">
              {combo.rod?.name || "未关联"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="shrink-0 w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
              轮
            </span>
            <span className="truncate text-slate-700">
              {combo.reel?.name || "未关联"}
            </span>
          </div>
        </div>

        <div className="bg-muted/30 rounded p-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-col items-center flex-1">
            <span className="scale-90 opacity-70">主线</span>
            <span className="font-medium text-foreground truncate max-w-full">
              {combo.mainLineText || "-"}
            </span>
          </div>
          <div className="w-px h-6 bg-border/50"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="scale-90 opacity-70">前导</span>
            <span className="font-medium text-foreground truncate max-w-full">
              {combo.leaderLineText || "-"}
            </span>
          </div>
          <div className="w-px h-6 bg-border/50"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="scale-90 opacity-70">钩/饵</span>
            <span className="font-medium text-foreground truncate max-w-full">
              {combo.hookText || "-"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// --- Helpers ---

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
  rod?: { id: string; name: string } | null;
  reel?: { id: string; name: string } | null;
};

function normalizeComboResponse(data: ComboApiResponse): ComboSummary {
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
    sceneTags: Array.isArray(data.sceneTags)
      ? (data.sceneTags as unknown[])
          .map((item) => (typeof item === "string" ? item : null))
          .filter((item): item is string => Boolean(item))
      : null,
    rod: data.rod ?? null,
    reel: data.reel ?? null,
  };
}

function LabeledInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      <Input 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
        type={type} 
        required={required} 
        placeholder={placeholder}
      />
    </div>
  );
}

function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function nullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isNaN(num) ? undefined : num;
}

function parseSceneTags(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
