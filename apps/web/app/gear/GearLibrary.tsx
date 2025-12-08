"use client";

import { useEffect, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Library } from "lucide-react";
import { GearLibraryItemBase, RodLibraryItem, ReelLibraryItem } from "./gear-shared";
import { parseDateLabel } from "./gear-shared";

export function GearLibraryDialog<T extends GearLibraryItemBase>({ type, title, description, trigger, formatMeta, onSelect }: { type: "rod" | "reel"; title: string; description: string; trigger: ReactNode; formatMeta: (item: T) => string; onSelect: (item: T) => void; }) {
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
        const params = new URLSearchParams({ type, limit: "10", page: "1" });
        if (query) params.set("q", query);
        const response = await fetch(`/api/gear-library?${params.toString()}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "加载失败");
        if (!cancelled) setItems(data.data as T[]);
      } catch (fetchError) {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "加载失败");
      } finally {
        if (!cancelled) setIsLoading(false);
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuery(""); setItems([]); setError(null); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索名称、品牌或备注" />
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
              const updatedLabel = parseDateLabel(item.updatedAt);
              const sourceLabel = item.sourceType === "template" ? "官方模板" : "用户上传";
              return (
                <button key={item.id} type="button" onClick={() => handleSelect(item)} className="w-full rounded-lg border bg-white p-3 text-left transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">来自 {item.ownerName}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          item.sourceType === "template"
                            ? "text-[10px] px-1.5 h-5 font-normal border-dashed border-amber-400 text-amber-600 bg-amber-50"
                            : "text-[10px] px-1.5 h-5 font-normal border-dashed border-slate-200 text-slate-500 bg-slate-50"
                        }
                      >
                        {sourceLabel}
                      </Badge>
                    </div>
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

export function RodLibraryPicker({ onSelect }: { onSelect: (item: RodLibraryItem) => void }) {
  return (
    <GearLibraryDialog<RodLibraryItem>
      type="rod"
      title="从装备库复制鱼竿"
      description="展示其他钓友公开的鱼竿参数，选择后会自动填充表单。"
      trigger={<Button type="button" size="sm" variant="outline"><Library className="mr-2 h-3 w-3" />选择模板</Button>}
      formatMeta={(item) => {
        const specs = [item.brand, item.length ? `${item.length}${item.lengthUnit ?? ""}` : null, item.power].filter(Boolean);
        const lureRange = item.lureWeightMin || item.lureWeightMax ? `${item.lureWeightMin ?? "?"}-${item.lureWeightMax ?? "?"}g 饵重` : null;
        const lineText = item.lineWeightText ? `线号 ${item.lineWeightText}` : null;
        return [...specs, lureRange, lineText].filter(Boolean).join(" ｜ ");
      }}
      onSelect={onSelect}
    />
  );
}

export function ReelLibraryPicker({ onSelect }: { onSelect: (item: ReelLibraryItem) => void }) {
  return (
    <GearLibraryDialog<ReelLibraryItem>
      type="reel"
      title="从装备库复制渔轮"
      description="使用其他钓友公开的渔轮模板，自动带出常用参数。"
      trigger={<Button type="button" size="sm" variant="outline"><Library className="mr-2 h-3 w-3" />选择模板</Button>}
      formatMeta={(item) => {
        const specs = [item.brand, item.model, item.gearRatioText].filter(Boolean);
        const line = item.lineCapacityText ? `线容量 ${item.lineCapacityText}` : null;
        return [...specs, line].filter(Boolean).join(" ｜ ");
      }}
      onSelect={onSelect}
    />
  );
}
