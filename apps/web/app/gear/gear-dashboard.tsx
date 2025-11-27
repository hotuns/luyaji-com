"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
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
import { Plus, Pencil, Trash2, Settings2, Ruler, Weight, Activity, Disc } from "lucide-react";

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

type GearDashboardProps = {
  initialRods: RodSummary[];
  initialReels: ReelSummary[];
  initialCombos: ComboSummary[];
};

export function GearDashboard({ initialRods, initialReels, initialCombos }: GearDashboardProps) {
  const [rods, setRods] = useState(initialRods);
  const [reels, setReels] = useState(initialReels);
  const [combos, setCombos] = useState(initialCombos);

  return (
    <Tabs defaultValue="combos" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="combos">组合 ({combos.length})</TabsTrigger>
          <TabsTrigger value="rods">鱼竿 ({rods.length})</TabsTrigger>
          <TabsTrigger value="reels">渔轮 ({reels.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="combos" className="space-y-4">
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
        </div>

        {combos.length === 0 ? (
          <EmptyState description="还没有组合，点击右上角创建一个吧" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      </TabsContent>

      <TabsContent value="rods" className="space-y-4">
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新增鱼竿
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增鱼竿</DialogTitle>
                <DialogDescription>记录你的鱼竿参数。</DialogDescription>
              </DialogHeader>
              <RodForm
                onSuccess={(rod) => setRods((prev) => [rod, ...prev])}
              />
            </DialogContent>
          </Dialog>
        </div>

        {rods.length === 0 ? (
          <EmptyState description="尚未创建鱼竿" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      </TabsContent>

      <TabsContent value="reels" className="space-y-4">
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
        </div>

        {reels.length === 0 ? (
          <EmptyState description="尚未创建渔轮" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      </TabsContent>
    </Tabs>
  );
}

type StatusState = { type: "success" | "error"; message: string } | null;

function EmptyState({ description }: { description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Settings2 className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm">{description}</p>
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
      <div className="text-center py-8 text-gray-500">
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
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base font-semibold line-clamp-1" title={rod.name}>
              {rod.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-1">
              {rod.brand || "未知品牌"}
            </CardDescription>
          </div>
          {rod.visibility === "public" && (
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 h-5">公开</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5 text-gray-400" />
            <span>{rod.length ? `${rod.length}${rod.lengthUnit}` : "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span>{rod.power || "-"}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Weight className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {rod.lureWeightMin || rod.lureWeightMax
                ? `${rod.lureWeightMin ?? "?"}-${rod.lureWeightMax ?? "?"}g`
                : "-"}
            </span>
          </div>
        </div>
        {rod.note && (
          <p className="mt-3 text-xs text-gray-400 line-clamp-2 border-t pt-2 border-dashed">
            {rod.note}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center border-t bg-gray-50/50 p-3">
        <span className="text-xs text-gray-400">
          关联组合: {rod.combosCount}
        </span>
        <div className="flex gap-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-3.5 w-3.5 text-gray-500" />
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
            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
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
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base font-semibold line-clamp-1" title={reel.name}>
              {reel.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-1">
              {reel.brand || "未知品牌"}
            </CardDescription>
          </div>
          {reel.visibility === "public" && (
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 h-5">公开</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{reel.model || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span>{reel.gearRatioText || "-"}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Disc className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate" title={reel.lineCapacityText || ""}>
              {reel.lineCapacityText || "-"}
            </span>
          </div>
        </div>
        {reel.note && (
          <p className="mt-3 text-xs text-gray-400 line-clamp-2 border-t pt-2 border-dashed">
            {reel.note}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center border-t bg-gray-50/50 p-3">
        <span className="text-xs text-gray-400">
          关联组合: {reel.combosCount}
        </span>
        <div className="flex gap-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-3.5 w-3.5 text-gray-500" />
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
            className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
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
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-base font-semibold line-clamp-1" title={combo.name}>
              {combo.name}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mt-2">
              {combo.sceneTags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          {combo.visibility === "public" && (
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 h-5">公开</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-500">竿</span>
            </div>
            <span className="font-medium text-gray-700 line-clamp-1">
              {combo.rod?.name || "未关联"}
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-500">轮</span>
            </div>
            <span className="font-medium text-gray-700 line-clamp-1">
              {combo.reel?.name || "未关联"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 pt-2 border-t border-dashed">
          <div className="text-center">
            <div className="scale-75 text-gray-400 mb-0.5">主线</div>
            <div className="font-medium text-gray-700 truncate">{combo.mainLineText || "-"}</div>
          </div>
          <div className="text-center border-l border-dashed">
            <div className="scale-75 text-gray-400 mb-0.5">前导</div>
            <div className="font-medium text-gray-700 truncate">{combo.leaderLineText || "-"}</div>
          </div>
          <div className="text-center border-l border-dashed">
            <div className="scale-75 text-gray-400 mb-0.5">钩/饵</div>
            <div className="font-medium text-gray-700 truncate">{combo.hookText || "-"}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end items-center border-t bg-gray-50/50 p-2">
        <div className="flex gap-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Pencil className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                编辑
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
            size="sm"
            className="h-8 px-2 text-xs hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            删除
          </Button>
        </div>
      </CardFooter>
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
