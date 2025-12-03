"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
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
import { Plus, Pencil, Trash2, Settings2, Library, Camera, Loader2, X, Fish, Anchor, Layers, Search, MoreHorizontal, Share2, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

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
  likeCount?: number;
  photoUrls?: string[];
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

interface GearData {
  rods: RodSummary[];
  reels: ReelSummary[];
  combos: ComboSummary[];
}

// 入口组件 - 自动获取数据
export function GearDashboardWrapper() {
  const [data, setData] = useState<GearData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/gear", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("获取装备数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <GearSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">加载失败，请刷新重试</p>
      </div>
    );
  }

  return <GearDashboard initialRods={data.rods} initialReels={data.reels} initialCombos={data.combos} />;
}

function GearSkeleton() {
  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Tabs 骨架 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <Skeleton className="h-10 w-full md:w-80 rounded-xl" />
      </div>
      
      {/* 卡片网格骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-sm">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

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
    <div className="space-y-8 pb-24 md:pb-12">
      {/* 顶部操作栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { key: "combos" as const, label: "我的组合", icon: Layers, count: combos.length },
            { key: "rods" as const, label: "鱼竿", icon: Fish, count: rods.length },
            { key: "reels" as const, label: "渔轮", icon: Anchor, count: reels.length },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setGearTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                  gearTab === t.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", gearTab === t.key ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500")}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden md:flex gap-2"
            onClick={() => window.location.href = "/square"}
          >
            <Search className="h-4 w-4" />
            去广场看看
          </Button>
          
          {gearTab === "combos" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">新建组合</span>
                  <span className="sm:hidden">新建</span>
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
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">新增鱼竿</span>
                  <span className="sm:hidden">新增</span>
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
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">新增渔轮</span>
                  <span className="sm:hidden">新增</span>
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
      </div>

      {/* 内容区域 */}
      <div className="min-h-[400px]">
        {gearTab === "combos" && (
          <>
            {combos.length === 0 ? (
              <EmptyState 
                title="还没有创建组合"
                description="组合是将鱼竿、渔轮和线组搭配在一起的完整装备方案。"
                actionText="创建第一个组合"
                onAction={() => document.querySelector<HTMLButtonElement>('[data-state="closed"]')?.click()} // Hacky trigger but works for now
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </>
        )}

        {gearTab === "rods" && (
          <>
            {rods.length === 0 ? (
              <EmptyState 
                title="还没有添加鱼竿"
                description="添加你的鱼竿，方便在创建组合时快速选择。"
                actionText="添加第一根鱼竿"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </>
        )}

        {gearTab === "reels" && (
          <>
            {reels.length === 0 ? (
              <EmptyState 
                title="还没有添加渔轮"
                description="添加你的渔轮，方便在创建组合时快速选择。"
                actionText="添加第一个渔轮"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </>
        )}
      </div>
    </div>
  );
}

type StatusState = { type: "success" | "error"; message: string } | null;

function EmptyState({ title, description, actionText, onAction }: { title: string, description: string, actionText?: string, onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
      <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
        <Layers className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-8">{description}</p>
      {actionText && (
        <Button variant="outline" className="gap-2" onClick={onAction}>
          <Plus className="h-4 w-4" />
          {actionText}
        </Button>
      )}
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
          className={cn(
            "text-sm p-2 rounded",
            status.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}
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
            <p className="text-xs text-muted-foreground">引用其他钓友公开的渔轮模板自动填充。</p>
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
          placeholder="例如：禧玛诺斯泰拉"
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
          placeholder="例如：C3000XG"
        />
        <LabeledInput
          label="速比"
          value={form.gearRatioText}
          onChange={(value) => setForm((prev) => ({ ...prev, gearRatioText: value }))}
          placeholder="例如：6.4:1"
        />
      </div>

      <LabeledInput
        label="线容量"
        value={form.lineCapacityText}
        onChange={(value) => setForm((prev) => ({ ...prev, lineCapacityText: value }))}
        placeholder="例如：PE 1.5号-200m"
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
          className={cn(
            "text-sm p-2 rounded",
            status.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}
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

function ComboForm({
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    initialData?.photoUrls?.[0] ?? null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = rods.length > 0 && reels.length > 0;

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

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
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      mainLineText: nullableString(form.mainLineText),
      leaderLineText: nullableString(form.leaderLineText),
      hookText: nullableString(form.hookText),
      detailNote: nullableString(form.detailNote),
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
        setPhotoUrl(null);
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
        placeholder="例如：远投泛用套装"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>选择鱼竿</Label>
          <Select
            value={form.rodId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, rodId: value }))}
            required
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
          <Label>选择渔轮</Label>
          <Select
            value={form.reelId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, reelId: value }))}
            required
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
          placeholder="例如：PE 1.0"
        />
        <LabeledInput
          label="子线"
          value={form.leaderLineText}
          onChange={(value) => setForm((prev) => ({ ...prev, leaderLineText: value }))}
          placeholder="例如：碳线 2.0"
        />
        <LabeledInput
          label="钩型"
          value={form.hookText}
          onChange={(value) => setForm((prev) => ({ ...prev, hookText: value }))}
          placeholder="例如：曲柄钩 2#"
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
        <Label>详细说明</Label>
        <Textarea
          value={form.detailNote}
          onChange={(e) => setForm((prev) => ({ ...prev, detailNote: e.target.value }))}
          placeholder="记录这套组合的适用场景、使用心得等..."
          className="resize-none h-24"
        />
      </div>

      {/* 组合照片：单张，上传到 OSS */}
      <div className="space-y-2">
        <Label>
          组合照片 <span className="text-xs text-slate-400 font-normal">（可选，单张）</span>
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {photoUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="组合照片" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Camera size={24} />
                <span className="text-xs mt-1">添加照片</span>
              </>
            )}
          </button>
        )}
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
          公开后，其他钓友可以在公共装备库看到你的搭配方案。
        </p>
      </div>

      {status && (
        <div
          className={cn(
            "text-sm p-2 rounded",
            status.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}
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

// --- Cards ---

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
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("确定要删除这个组合吗？")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/combos/${combo.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="group overflow-hidden border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
        {/* Cover Image Area */}
        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
          {combo.photoUrls && combo.photoUrls.length > 0 ? (
            <img
              src={combo.photoUrls[0]}
              alt={combo.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
              <Layers className="h-12 w-12 opacity-50" />
            </div>
          )}
          
          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {combo.visibility === "public" ? (
              <Badge className="bg-blue-500/80 backdrop-blur-sm text-white border-0 hover:bg-blue-600">
                <Share2 className="w-3 h-3 mr-1" /> 公开
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-900/50 backdrop-blur-sm text-white border-0">
                <Lock className="w-3 h-3 mr-1" /> 私有
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-slate-900 line-clamp-1 text-lg group-hover:text-blue-600 transition-colors">
              {combo.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> 编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> 删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 mb-4 flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Fish className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{combo.rod?.name || "未知鱼竿"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Anchor className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{combo.reel?.name || "未知渔轮"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
            {combo.mainLineText && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600">
                主 {combo.mainLineText}
              </Badge>
            )}
            {combo.leaderLineText && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600">
                子 {combo.leaderLineText}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑组合</DialogTitle>
          </DialogHeader>
          <ComboForm
            rods={rods}
            reels={reels}
            initialData={combo}
            onSuccess={(updated) => {
              onUpdated(updated);
              setIsEditing(false);
            }}
            closeDialog={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function RodCard({
  rod,
  onUpdated,
  onDeleted,
}: {
  rod: RodSummary;
  onUpdated: (rod: RodSummary) => void;
  onDeleted: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (rod.combosCount > 0) {
      alert(`无法删除：该鱼竿已被 ${rod.combosCount} 个组合使用。请先解除关联。`);
      return;
    }
    if (!confirm("确定要删除这根鱼竿吗？")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rods/${rod.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="p-5 flex flex-col h-full hover:shadow-md transition-shadow border-slate-200">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 line-clamp-1 text-lg">
              {rod.name}
            </h3>
            {rod.brand && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">
                {rod.brand}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> 编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {rod.power && (
            <Badge variant="outline" className="font-normal">
              {rod.power}调
            </Badge>
          )}
          {rod.length && (
            <Badge variant="outline" className="font-normal">
              {rod.length}
              {rod.lengthUnit || "m"}
            </Badge>
          )}
          {rod.lureWeightMin !== null && rod.lureWeightMax !== null && (
            <Badge variant="outline" className="font-normal">
              {rod.lureWeightMin}-{rod.lureWeightMax}g
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {rod.visibility === "public" ? (
              <span className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                <Share2 className="w-3 h-3 mr-1" /> 公开
              </span>
            ) : (
              <span className="flex items-center text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                <Lock className="w-3 h-3 mr-1" /> 私有
              </span>
            )}
          </div>
          {rod.combosCount > 0 && (
            <span className="text-slate-400">用于 {rod.combosCount} 个组合</span>
          )}
        </div>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑鱼竿</DialogTitle>
          </DialogHeader>
          <RodForm
            initialData={rod}
            onSuccess={(updated) => {
              onUpdated(updated);
              setIsEditing(false);
            }}
            closeDialog={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </>
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
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (reel.combosCount > 0) {
      alert(`无法删除：该渔轮已被 ${reel.combosCount} 个组合使用。请先解除关联。`);
      return;
    }
    if (!confirm("确定要删除这个渔轮吗？")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reels/${reel.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="p-5 flex flex-col h-full hover:shadow-md transition-shadow border-slate-200">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 line-clamp-1 text-lg">
              {reel.name}
            </h3>
            {reel.brand && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">
                {reel.brand}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" /> 编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> 删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {reel.model && (
            <Badge variant="outline" className="font-normal">
              {reel.model}
            </Badge>
          )}
          {reel.gearRatioText && (
            <Badge variant="outline" className="font-normal">
              速比 {reel.gearRatioText}
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {reel.visibility === "public" ? (
              <span className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                <Share2 className="w-3 h-3 mr-1" /> 公开
              </span>
            ) : (
              <span className="flex items-center text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                <Lock className="w-3 h-3 mr-1" /> 私有
              </span>
            )}
          </div>
          {reel.combosCount > 0 && (
            <span className="text-slate-400">用于 {reel.combosCount} 个组合</span>
          )}
        </div>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑渔轮</DialogTitle>
          </DialogHeader>
          <ReelForm
            initialData={reel}
            onSuccess={(updated) => {
              onUpdated(updated);
              setIsEditing(false);
            }}
            closeDialog={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Helpers ---

function LabeledInput({
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

function nullableString(val: string) {
  return val.trim() || null;
}

function nullableNumber(val: string) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseSceneTags(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
  rod?: { id: string; name: string } | null;
  reel?: { id: string; name: string } | null;
  photoUrls?: string[];
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
    photoUrls: data.photoUrls,
  };
}

// --- Pickers ---

function RodLibraryPicker({ onSelect }: { onSelect: (item: RodLibraryItem) => void }) {
  return (
    <GearLibraryDialog<RodLibraryItem>
      type="rod"
      title="从装备库复制鱼竿"
      description="展示其他钓友公开的鱼竿参数，选择后会自动填充表单。"
      trigger={
        <Button type="button" size="sm" variant="outline">
          <Library className="mr-2 h-3 w-3" />
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
          <Library className="mr-2 h-3 w-3" />
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
