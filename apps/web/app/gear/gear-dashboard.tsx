"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
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

import { cn } from "@workspace/ui/lib/utils";

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
    <Tabs defaultValue="combos" className="space-y-6">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="combos">组合</TabsTrigger>
        <TabsTrigger value="rods">鱼竿</TabsTrigger>
        <TabsTrigger value="reels">渔轮</TabsTrigger>
      </TabsList>

      <TabsContent value="combos" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>创建新组合</CardTitle>
          </CardHeader>
          <CardContent>
            <ComboForm
              rods={rods}
              reels={reels}
              onSuccess={(combo) => setCombos((prev) => [combo, ...prev])}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {combos.length === 0 ? (
            <EmptyState description="还没有组合，先创建一个吧" />
          ) : (
            combos.map((combo) => (
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
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="rods" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>新增鱼竿</CardTitle>
          </CardHeader>
          <CardContent>
            <RodForm
              onSuccess={(rod) => setRods((prev) => [rod, ...prev])}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {rods.length === 0 ? (
            <EmptyState description="尚未创建鱼竿" />
          ) : (
            rods.map((rod) => (
              <RodCard
                key={rod.id}
                rod={rod}
                onUpdated={(next) =>
                  setRods((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                }
                onDeleted={() => setRods((prev) => prev.filter((item) => item.id !== rod.id))}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="reels" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>新增渔轮</CardTitle>
          </CardHeader>
          <CardContent>
            <ReelForm onSuccess={(reel) => setReels((prev) => [reel, ...prev])} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {reels.length === 0 ? (
            <EmptyState description="尚未创建渔轮" />
          ) : (
            reels.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                onUpdated={(next) =>
                  setReels((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                }
                onDeleted={() => setReels((prev) => prev.filter((item) => item.id !== reel.id))}
              />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

type StatusState = { type: "success" | "error"; message: string } | null;

function EmptyState({ description }: { description: string }) {
  return (
    <div className="text-center py-8 border border-dashed rounded-2xl text-gray-400 text-sm">
      {description}
    </div>
  );
}

function RodForm({ onSuccess }: { onSuccess: (rod: RodSummary) => void }) {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    length: "",
    lengthUnit: "m",
    power: "",
    lureWeightMin: "",
    lureWeightMax: "",
    lineWeightText: "",
    note: "",
    visibility: "private" as "private" | "public",
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

    try {
      const response = await fetch("/api/rods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }
      onSuccess({ ...result.data, combosCount: 0 });
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
      setStatus({ type: "success", message: "创建成功" });
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <LabeledInput
        label="名称"
        required
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
      />
      <LabeledInput
        label="品牌"
        value={form.brand}
        onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="长度"
          type="number"
          value={form.length}
          onChange={(value) => setForm((prev) => ({ ...prev, length: value }))}
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
      </div>
      <LabeledInput
        label="调性/硬度"
        value={form.power}
        onChange={(value) => setForm((prev) => ({ ...prev, power: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
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
      />
      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          rows={3}
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
            <SelectItem value="private">私有</SelectItem>
            <SelectItem value="public">公开</SelectItem>
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
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "保存中..." : "保存"}
      </Button>
    </form>
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
  const [status, setStatus] = useState<StatusState>(null);

  async function handleDelete() {
    if (!window.confirm("确定删除该鱼竿？")) {
      return;
    }
    setStatus(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rods/${rod.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "删除失败");
      }
      onDeleted();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "删除失败",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{rod.name}</CardTitle>
          <div className="flex gap-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? "收起" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete} disabled={isDeleting}>
              删除
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {rod.brand || "未填写品牌"} · 可见性：{rod.visibility === "public" ? "公开" : "私有"}
        </div>
        <div className="text-xs text-gray-400">关联组合：{rod.combosCount}</div>
        {status && status.type === "error" && (
          <p className="text-xs text-red-600">{status.message}</p>
        )}
      </CardHeader>
      {isEditing && (
        <CardContent>
          <RodEditForm
            rod={rod}
            onSuccess={(next) => {
              onUpdated(next);
              setIsEditing(false);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
}

function RodEditForm({ rod, onSuccess }: { rod: RodSummary; onSuccess: (rod: RodSummary) => void }) {
  const [form, setForm] = useState({
    name: rod.name,
    brand: rod.brand ?? "",
    length: rod.length?.toString() ?? "",
    lengthUnit: (rod.lengthUnit as "m" | "ft") ?? "m",
    power: rod.power ?? "",
    lureWeightMin: rod.lureWeightMin?.toString() ?? "",
    lureWeightMax: rod.lureWeightMax?.toString() ?? "",
    lineWeightText: rod.lineWeightText ?? "",
    note: rod.note ?? "",
    visibility: rod.visibility,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    const payload = {
      name: form.name.trim() || rod.name,
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

    try {
      const response = await fetch(`/api/rods/${rod.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }
      onSuccess({ ...result.data, combosCount: rod.combosCount });
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <LabeledInput
        label="名称"
        required
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
      />
      <LabeledInput
        label="品牌"
        value={form.brand}
        onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput
          label="长度"
          type="number"
          value={form.length}
          onChange={(value) => setForm((prev) => ({ ...prev, length: value }))}
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
      </div>
      <LabeledInput
        label="调性/硬度"
        value={form.power}
        onChange={(value) => setForm((prev) => ({ ...prev, power: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
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
      />
      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          rows={3}
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
            <SelectItem value="private">私有</SelectItem>
            <SelectItem value="public">公开</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {status && status.type === "error" && (
        <p className="text-sm text-red-600">{status.message}</p>
      )}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "保存中..." : "保存修改"}
      </Button>
    </form>
  );
}

function ReelForm({ onSuccess }: { onSuccess: (reel: ReelSummary) => void }) {
  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    gearRatioText: "",
    lineCapacityText: "",
    note: "",
    visibility: "private" as "private" | "public",
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

    try {
      const response = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }
      onSuccess({ ...result.data, combosCount: 0 });
      setForm({
        name: "",
        brand: "",
        model: "",
        gearRatioText: "",
        lineCapacityText: "",
        note: "",
        visibility: "private",
      });
      setStatus({ type: "success", message: "创建成功" });
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <LabeledInput
        label="名称"
        required
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
      />
      <LabeledInput
        label="品牌"
        value={form.brand}
        onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))}
      />
      <LabeledInput
        label="型号"
        value={form.model}
        onChange={(value) => setForm((prev) => ({ ...prev, model: value }))}
      />
      <LabeledInput
        label="速比"
        value={form.gearRatioText}
        onChange={(value) => setForm((prev) => ({ ...prev, gearRatioText: value }))}
      />
      <LabeledInput
        label="线容量"
        value={form.lineCapacityText}
        onChange={(value) => setForm((prev) => ({ ...prev, lineCapacityText: value }))}
      />
      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          rows={3}
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
            <SelectItem value="private">私有</SelectItem>
            <SelectItem value="public">公开</SelectItem>
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
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "保存中..." : "保存"}
      </Button>
    </form>
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
  const [status, setStatus] = useState<StatusState>(null);

  async function handleDelete() {
    if (!window.confirm("确定删除该渔轮？")) {
      return;
    }
    setStatus(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reels/${reel.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "删除失败");
      }
      onDeleted();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "删除失败",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{reel.name}</CardTitle>
          <div className="flex gap-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? "收起" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete} disabled={isDeleting}>
              删除
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {reel.brand || "未填写品牌"} · 可见性：{reel.visibility === "public" ? "公开" : "私有"}
        </div>
        <div className="text-xs text-gray-400">关联组合：{reel.combosCount}</div>
        {status && status.type === "error" && (
          <p className="text-xs text-red-600">{status.message}</p>
        )}
      </CardHeader>
      {isEditing && (
        <CardContent>
          <ReelEditForm
            reel={reel}
            onSuccess={(next) => {
              onUpdated(next);
              setIsEditing(false);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
}

function ReelEditForm({ reel, onSuccess }: { reel: ReelSummary; onSuccess: (reel: ReelSummary) => void }) {
  const [form, setForm] = useState({
    name: reel.name,
    brand: reel.brand ?? "",
    model: reel.model ?? "",
    gearRatioText: reel.gearRatioText ?? "",
    lineCapacityText: reel.lineCapacityText ?? "",
    note: reel.note ?? "",
    visibility: reel.visibility,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    const payload = {
      name: form.name.trim() || reel.name,
      brand: nullableString(form.brand),
      model: nullableString(form.model),
      gearRatioText: nullableString(form.gearRatioText),
      lineCapacityText: nullableString(form.lineCapacityText),
      note: nullableString(form.note),
      visibility: form.visibility,
    };

    try {
      const response = await fetch(`/api/reels/${reel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败");
      }
      onSuccess({ ...result.data, combosCount: reel.combosCount });
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <LabeledInput
        label="名称"
        required
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
      />
      <LabeledInput
        label="品牌"
        value={form.brand}
        onChange={(value) => setForm((prev) => ({ ...prev, brand: value }))}
      />
      <LabeledInput
        label="型号"
        value={form.model}
        onChange={(value) => setForm((prev) => ({ ...prev, model: value }))}
      />
      <LabeledInput
        label="速比"
        value={form.gearRatioText}
        onChange={(value) => setForm((prev) => ({ ...prev, gearRatioText: value }))}
      />
      <LabeledInput
        label="线容量"
        value={form.lineCapacityText}
        onChange={(value) => setForm((prev) => ({ ...prev, lineCapacityText: value }))}
      />
      <div className="space-y-2">
        <Label>备注</Label>
        <Textarea
          value={form.note}
          onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          rows={3}
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
            <SelectItem value="private">私有</SelectItem>
            <SelectItem value="public">公开</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {status && status.type === "error" && (
        <p className="text-sm text-red-600">{status.message}</p>
      )}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "保存中..." : "保存修改"}
      </Button>
    </form>
  );
}

function ComboForm({
  rods,
  reels,
  initial,
  onSuccess,
  comboId,
}: {
  rods: RodSummary[];
  reels: ReelSummary[];
  initial?: ComboFormState;
  onSuccess: (combo: ComboSummary) => void;
  comboId?: string;
}) {
  const [form, setForm] = useState<ComboFormState>(
    initial ?? {
      name: "",
      rodId: rods[0]?.id ?? "",
      reelId: reels[0]?.id ?? "",
      mainLineText: "",
      leaderLineText: "",
      hookText: "",
      detailNote: "",
      sceneTags: "",
      visibility: "private",
    }
  );
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

    const url = comboId ? `/api/combos/${comboId}` : "/api/combos";
    const method = comboId ? "PATCH" : "POST";

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
      if (!comboId) {
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
        setStatus({ type: "success", message: "创建成功" });
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
    <form className="space-y-3" onSubmit={handleSubmit}>
      <LabeledInput
        label="组合名称"
        required
        value={form.name}
        onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>鱼竿</Label>
          <Select
            value={form.rodId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, rodId: value }))}
            disabled={rods.length === 0}
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
            disabled={reels.length === 0}
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
      <LabeledInput
        label="主线"
        value={form.mainLineText}
        onChange={(value) => setForm((prev) => ({ ...prev, mainLineText: value }))}
      />
      <LabeledInput
        label="前导线"
        value={form.leaderLineText}
        onChange={(value) => setForm((prev) => ({ ...prev, leaderLineText: value }))}
      />
      <LabeledInput
        label="钩/亮片"
        value={form.hookText}
        onChange={(value) => setForm((prev) => ({ ...prev, hookText: value }))}
      />
      <div className="space-y-2">
        <Label>适用场景（逗号分隔）</Label>
        <Input
          value={form.sceneTags}
          onChange={(event) => setForm((prev) => ({ ...prev, sceneTags: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>补充说明</Label>
        <Textarea
          rows={4}
          value={form.detailNote}
          onChange={(event) => setForm((prev) => ({ ...prev, detailNote: event.target.value }))}
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
            <SelectItem value="private">私有</SelectItem>
            <SelectItem value="public">公开</SelectItem>
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
      <Button type="submit" disabled={isLoading || !canSubmit} className="w-full">
        {isLoading ? "保存中..." : comboId ? "保存修改" : "保存"}
      </Button>
    </form>
  );
}

type ComboFormState = {
  name: string;
  rodId: string;
  reelId: string;
  mainLineText: string;
  leaderLineText: string;
  hookText: string;
  detailNote: string;
  sceneTags: string;
  visibility: "private" | "public";
};

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
  const [status, setStatus] = useState<StatusState>(null);

  async function handleDelete() {
    if (!window.confirm("确定删除该组合？")) {
      return;
    }
    setStatus(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/combos/${combo.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "删除失败");
      }
      onDeleted();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "删除失败",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{combo.name}</CardTitle>
          <div className="flex gap-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? "收起" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete} disabled={isDeleting}>
              删除
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {combo.rod?.name ?? "未关联鱼竿"} · {combo.reel?.name ?? "未关联渔轮"}
        </div>
        <div className="text-xs text-gray-400">{combo.visibility === "public" ? "公开组合" : "私有组合"}</div>
        {status && status.type === "error" && (
          <p className="text-xs text-red-600">{status.message}</p>
        )}
      </CardHeader>
      {isEditing && (
        <CardContent>
          <ComboForm
            rods={rods}
            reels={reels}
            comboId={combo.id}
            initial={{
              name: combo.name,
              rodId: combo.rodId,
              reelId: combo.reelId,
              mainLineText: combo.mainLineText ?? "",
              leaderLineText: combo.leaderLineText ?? "",
              hookText: combo.hookText ?? "",
              detailNote: combo.detailNote ?? "",
              sceneTags: combo.sceneTags?.join(",") ?? "",
              visibility: combo.visibility,
            }}
            onSuccess={(next) => {
              onUpdated(next);
              setIsEditing(false);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} />
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
