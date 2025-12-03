"use client";

import { useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

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

type ComboLibraryItem = {
  id: string;
  name: string;
  mainLineText: string | null;
  leaderLineText: string | null;
  hookText: string | null;
  detailNote: string | null;
  photoUrls: string[] | null;
  updatedAt: string;
  ownerName: string;
};

type TabKey = "rods" | "reels" | "combos";

export function GearLibraryDashboard() {
  const [tab, setTab] = useState<TabKey>("rods");
  const [keyword, setKeyword] = useState("");
  const [rodItems, setRodItems] = useState<RodLibraryItem[] | null>(null);
  const [reelItems, setReelItems] = useState<ReelLibraryItem[] | null>(null);
  const [comboItems, setComboItems] = useState<ComboLibraryItem[] | null>(null);
  const [rodTotal, setRodTotal] = useState<number | null>(null);
  const [reelTotal, setReelTotal] = useState<number | null>(null);
  const [comboTotal, setComboTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    void fetchCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  async function fetchCurrent() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set(
        "type",
        tab === "rods" ? "rod" : tab === "reels" ? "reel" : "combo",
      );
      params.set("limit", String(pageSize));
      params.set("page", String(page));
      if (keyword.trim()) params.set("q", keyword.trim());

      const res = await fetch(`/api/gear-library?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.success) return;
      if (tab === "rods") {
      if (!json.success) return;
      if (tab === "rods") {
        setRodItems(json.data as RodLibraryItem[]);
        setRodTotal(typeof json.total === "number" ? json.total : null);
      } else if (tab === "reels") {
        setReelItems(json.data as ReelLibraryItem[]);
        setReelTotal(typeof json.total === "number" ? json.total : null);
      } else {
        setComboItems(json.data as ComboLibraryItem[]);
        setComboTotal(typeof json.total === "number" ? json.total : null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(type: "rod" | "reel", id: string) {
    const res = await fetch(`/api/gear-library/copy/${type === "rod" ? "rod" : "reel"}/${id}`, {
      method: "POST",
    });
    const json = await res.json();
    if (!json.success) {
      // 简单提示，后续可接入全局 toast
      alert(json.error || "复制失败，请稍后重试");
      return;
    }
    alert("已复制到你的装备中，可在“我的装备”里查看");
  }

  const items = tab === "rods" ? rodItems : reelItems;
  const items = tab === "rods" ? rodItems : tab === "reels" ? reelItems : comboItems;
  const total = tab === "rods" ? rodTotal : tab === "reels" ? reelTotal : comboTotal;
  const totalPages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : null;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex p-1 bg-slate-200/60 rounded-xl md:w-auto w-full">
          {[
            { key: "rods" as const, label: "鱼竿库" },
            { key: "reels" as const, label: "渔轮库" },
            { key: "combos" as const, label: "组合库" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 md:flex-none md:w-24 py-2 text-sm font-medium rounded-lg transition-all",
                tab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64 flex gap-2">
          <Input
            placeholder="搜索名称、品牌、备注..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(1);
              void fetchCurrent();
            }}
          >
            搜索
          </Button>
        </div>
      </div>

      {total != null && (
        <div className="text-xs text-slate-500">
          共 {total} 条
          {tab === "rods" ? "鱼竿" : tab === "reels" ? "渔轮" : "组合"}，每页 {pageSize} 条
        </div>
      )}

      {loading && !items && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      )}

      {!loading && items && items.length === 0 && (
        <div className="py-16 text-center text-slate-500 text-sm">
          暂无公开的
          {tab === "rods" ? "鱼竿" : tab === "reels" ? "渔轮" : "组合"}
          ，你可以先去创建并公开自己的装备。
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tab === "rods"
              ? (items as RodLibraryItem[]).map((item) => (
                <Card key={item.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{item.name}</span>
                        {item.brand && (
                          <span className="text-xs text-slate-500">{item.brand}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">来自：{item.ownerName}</p>
                    </div>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleCopy("rod", item.id)}
                    >
                      复制到我的鱼竿
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                    {item.power && <Badge variant="outline">硬度 {item.power}</Badge>}
                    {item.length && (
                      <Badge variant="outline">
                        长度 {item.length}
                        {item.lengthUnit || "m"}
                      </Badge>
                    )}
                    {item.lureWeightMin !== null && item.lureWeightMax !== null && (
                      <Badge variant="outline">
                        饵重 {item.lureWeightMin}-{item.lureWeightMax}g
                      </Badge>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.note}</p>
                  )}
                </Card>
              ))
              ))
              : tab === "reels"
              ? (items as ReelLibraryItem[]).map((item) => (
                <Card key={item.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{item.name}</span>
                        {item.brand && (
                          <span className="text-xs text-slate-500">{item.brand}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">来自：{item.ownerName}</p>
                    </div>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleCopy("reel", item.id)}
                    >
                      复制到我的渔轮
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                    {item.model && <Badge variant="outline">型号 {item.model}</Badge>}
                    {item.gearRatioText && (
                      <Badge variant="outline">速比 {item.gearRatioText}</Badge>
                    )}
                  </div>
                  {item.note && (
                  {item.note && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.note}</p>
                  )}
                </Card>
              ))
              : (items as ComboLibraryItem[]).map((item) => (
                <Card key={item.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">来自：{item.ownerName}</p>
                    </div>
                  </div>

                  {item.photoUrls && item.photoUrls.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {item.photoUrls.slice(0, 3).map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt={item.name}
                          className="h-20 w-20 rounded-md object-cover flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2">
                    {item.mainLineText && (
                      <Badge variant="outline">主线 {item.mainLineText}</Badge>
                    )}
                    {item.leaderLineText && (
                      <Badge variant="outline">子线 {item.leaderLineText}</Badge>
                    )}
                    {item.hookText && <Badge variant="outline">钩类 {item.hookText}</Badge>}
                  </div>

                  {item.detailNote && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{item.detailNote}</p>
                  )}
                </Card>
              ))}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <span className="text-xs text-slate-500">
              第 {page} 页
              {totalPages != null && ` / 共 ${totalPages} 页`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                loading ||
                (totalPages != null ? page >= totalPages : items != null && items.length < pageSize)
              }
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
