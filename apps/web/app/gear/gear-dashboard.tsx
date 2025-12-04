"use client";

import { useEffect, useState } from "react";
import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Search, Layers } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

import { RodSummary, ReelSummary, ComboSummary } from "./gear-shared";
import { ComboCard, RodCard, ReelCard } from "./GearCards";
import { ComboForm, RodForm, ReelForm } from "./GearForms";

interface GearData {
  rods: RodSummary[];
  reels: ReelSummary[];
  combos: ComboSummary[];
}

export function GearDashboardWrapper() {
  const [data, setData] = useState<GearData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/gear", { cache: "no-store" });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error("获取装备数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <GearSkeleton />;
  if (!data) return <div className="flex items-center justify-center py-20"><p className="text-slate-500">加载失败，请刷新重试</p></div>;

  return <GearDashboard initialRods={data.rods} initialReels={data.reels} initialCombos={data.combos} />;
}

function GearSkeleton() {
  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <Skeleton className="h-10 w-full md:w-80 rounded-xl" />
      </div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { key: "combos" as const, label: "我的组合", icon: Layers, count: combos.length },
            { key: "rods" as const, label: "鱼竿", icon: () => null, count: rods.length },
            { key: "reels" as const, label: "渔轮", icon: () => null, count: reels.length },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setGearTab(t.key)} className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap", gearTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")}>
                <Icon className="h-4 w-4" />
                {t.label}
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", gearTab === t.key ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500")}>{t.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 px-3 py-2 text-xs md:text-sm"
            onClick={() => (window.location.href = "/square")}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">去广场看看</span>
            <span className="sm:hidden">广场</span>
          </Button>
          {/* 创建按钮 融合到每个 tab 的 Dialog 由表单组件内部处理 */}
        </div>
      </div>

      <div className="min-h-[400px]">
        {gearTab === "combos" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">管理你的常用组合，搭配鱼竿和渔轮。</p>
              <CreateComboButton
                rods={rods}
                reels={reels}
                onCreated={(combo) => setCombos((prev) => [combo, ...prev])}
              />
            </div>

            {combos.length === 0 ? (
              <EmptyState
                title="还没有创建组合"
                description="组合是将鱼竿、渔轮和线组搭配在一起的完整装备方案。"
                actionText="创建第一个组合"
                onAction={() => {
                  const button = document.getElementById("create-combo-button");
                  button?.click();
                }}
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
                    onDeleted={() =>
                      setCombos((prev) => prev.filter((item) => item.id !== combo.id))
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {gearTab === "rods" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">先维护好你的鱼竿清单，再去搭配组合。</p>
              <CreateRodButton
                onCreated={(rod) => setRods((prev) => [rod, ...prev])}
              />
            </div>

            {rods.length === 0 ? (
              <EmptyState
                title="还没有添加鱼竿"
                description="添加你的鱼竿，方便在创建组合时快速选择。"
                actionText="添加第一根鱼竿"
                onAction={() => {
                  const button = document.getElementById("create-rod-button");
                  button?.click();
                }}
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
                    onDeleted={() =>
                      setRods((prev) => prev.filter((item) => item.id !== rod.id))
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {gearTab === "reels" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">把常用渔轮录入进来，后续选择更快捷。</p>
              <CreateReelButton
                onCreated={(reel) => setReels((prev) => [reel, ...prev])}
              />
            </div>

            {reels.length === 0 ? (
              <EmptyState
                title="还没有添加渔轮"
                description="添加你的渔轮，方便在创建组合时快速选择。"
                actionText="添加第一个渔轮"
                onAction={() => {
                  const button = document.getElementById("create-reel-button");
                  button?.click();
                }}
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
                    onDeleted={() =>
                      setReels((prev) => prev.filter((item) => item.id !== reel.id))
                    }
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

function CreateComboButton({
  rods,
  reels,
  onCreated,
}: {
  rods: RodSummary[];
  reels: ReelSummary[];
  onCreated: (combo: ComboSummary) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        id="create-combo-button"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        新建组合
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建组合</DialogTitle>
          </DialogHeader>
          <ComboForm
            rods={rods}
            reels={reels}
            onSuccess={(combo) => {
              onCreated(combo);
              setOpen(false);
            }}
            closeDialog={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateRodButton({
  onCreated,
}: {
  onCreated: (rod: RodSummary) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        id="create-rod-button"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        新建鱼竿
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建鱼竿</DialogTitle>
          </DialogHeader>
          <RodForm
            onSuccess={(rod) => {
              onCreated(rod);
              setOpen(false);
            }}
            closeDialog={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateReelButton({
  onCreated,
}: {
  onCreated: (reel: ReelSummary) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        id="create-reel-button"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        新建渔轮
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建渔轮</DialogTitle>
          </DialogHeader>
          <ReelForm
            onSuccess={(reel) => {
              onCreated(reel);
              setOpen(false);
            }}
            closeDialog={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({
  title,
  description,
  actionText,
  onAction,
}: {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
      <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
        <Layers className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md">{description}</p>
      {actionText && (
        <Button variant="outline" className="gap-2" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
