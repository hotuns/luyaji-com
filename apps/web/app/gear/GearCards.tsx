"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { MoreHorizontal, Layers, Share2, Lock, Fish, Anchor, Pencil, Trash2 } from "lucide-react";
import { RodSummary, ReelSummary, ComboSummary } from "./gear-shared";
import { ComboForm, RodForm, ReelForm } from "./GearForms";
import { ShareDialog, useShareConfig } from "@/components/share-dialog";

export function ComboCard({ combo, rods, reels, onUpdated, onDeleted }: { combo: ComboSummary; rods: RodSummary[]; reels: ReelSummary[]; onUpdated: (combo: ComboSummary) => void; onDeleted: () => void; }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const shareConfig = useShareConfig("combo", {
    id: combo.id,
    name: combo.name,
    photoUrls: combo.photoUrls,
    rod: combo.rod,
    reel: combo.reel,
    mainLineText: combo.mainLineText,
  });

  async function handleDelete() {
    if (!confirm("确定要删除这个组合吗？")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/combos/${combo.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        onDeleted();
      } else {
        alert(data.error || "删除失败，请稍后重试");
      }
    } catch {
      alert("网络异常，删除失败");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card 
        className="group h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1 cursor-pointer"
        onClick={() => router.push(`/gear/combos/${combo.id}/edit`)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
            {combo.photoUrls && combo.photoUrls.length > 0 ? (
              <img src={combo.photoUrls[0]} alt={combo.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><Layers className="h-12 w-12 opacity-50" /></div>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              {combo.visibility === "public" ? (
                <Badge className="bg-blue-500/80 backdrop-blur-sm text-white border-0 font-normal text-[10px] gap-0.5"><Share2 className="w-2.5 h-2.5" /> 公开</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-900/50 backdrop-blur-sm text-white border-0 font-normal text-[10px] gap-0.5"><Lock className="w-2.5 h-2.5" /> 私有</Badge>
              )}
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{combo.name}</h3>
              <div className="flex items-center gap-1 -mr-2">
                {combo.visibility === "public" && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowShare(true);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { 
                      e.stopPropagation(); 
                      router.push(`/gear/combos/${combo.id}/edit`);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" /> 编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> 删除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-600"><Fish className="h-4 w-4 text-slate-400 flex-shrink-0" /><span className="truncate">{combo.rod?.name || "未知鱼竿"}</span></div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><Anchor className="h-4 w-4 text-slate-400 flex-shrink-0" /><span className="truncate">{combo.reel?.name || "未知渔轮"}</span></div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-4 mt-auto border-t border-slate-50">
              {combo.mainLineText && (<Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600">主 {combo.mainLineText}</Badge>)}
              {combo.leaderLineText && (<Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-slate-100 text-slate-600">子 {combo.leaderLineText}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分享弹窗 */}
      <ShareDialog
        config={shareConfig}
        open={showShare}
        onOpenChange={setShowShare}
      />
    </>
  );
}

export function RodCard({ rod, onUpdated, onDeleted }: { rod: RodSummary; onUpdated: (rod: RodSummary) => void; onDeleted: () => void; }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleDelete() {
    if (rod.combosCount > 0) { alert(`无法删除：该鱼竿已被 ${rod.combosCount} 个组合使用。请先解除关联。`); return; }
    if (!confirm("确定要删除这根鱼竿吗？")) return;
    try {
      const res = await fetch(`/api/rods/${rod.id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
    } finally {}
  }

  return (
    <>
      <Card 
        className="group h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1 cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{rod.name}</h3>
              {rod.brand && <p className="text-xs text-blue-600 font-medium mt-0.5">{rod.brand}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -mr-2 -mt-2 text-slate-400 hover:text-slate-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}><Pencil className="mr-2 h-4 w-4" /> 编辑</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> 删除</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {rod.power && <Badge variant="outline" className="font-normal">{rod.power}调</Badge>}
            {rod.length && <Badge variant="outline" className="font-normal">{rod.length}{rod.lengthUnit || "m"}</Badge>}
            {rod.lureWeightMin !== null && rod.lureWeightMax !== null && (<Badge variant="outline" className="font-normal">{rod.lureWeightMin}-{rod.lureWeightMax}g</Badge>)}
            {rod.price !== null && rod.price > 0 && (<Badge variant="secondary" className="font-normal bg-amber-50 text-amber-700 border-amber-200">¥{rod.price}</Badge>)}
          </div>

          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              {rod.visibility === "public" ? (
                <Badge className="bg-blue-500/80 text-white border-0 font-normal text-[10px] gap-0.5"><Share2 className="w-2.5 h-2.5" /> 公开</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0 font-normal text-[10px] gap-0.5"><Lock className="w-2.5 h-2.5" /> 私有</Badge>
              )}
            </div>
            {rod.combosCount > 0 && (<span className="text-slate-400">用于 {rod.combosCount} 个组合</span>)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>编辑鱼竿</DialogTitle></DialogHeader>
          <RodForm initialData={rod} onSuccess={(updated) => { onUpdated(updated); setIsEditing(false); }} closeDialog={() => setIsEditing(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReelCard({ reel, onUpdated, onDeleted }: { reel: ReelSummary; onUpdated: (reel: ReelSummary) => void; onDeleted: () => void; }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleDelete() {
    if (reel.combosCount > 0) { alert(`无法删除：该渔轮已被 ${reel.combosCount} 个组合使用。请先解除关联。`); return; }
    if (!confirm("确定要删除这个渔轮吗？")) return;
    try {
      const res = await fetch(`/api/reels/${reel.id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
    } finally {}
  }

  return (
    <>
      <Card 
        className="group h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1 cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{reel.name}</h3>
              {reel.brand && <p className="text-xs text-blue-600 font-medium mt-0.5">{reel.brand}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -mr-2 -mt-2 text-slate-400 hover:text-slate-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}><Pencil className="mr-2 h-4 w-4" /> 编辑</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> 删除</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {reel.model && <Badge variant="outline" className="font-normal">{reel.model}</Badge>}
            {reel.gearRatioText && <Badge variant="outline" className="font-normal">速比 {reel.gearRatioText}</Badge>}
            {reel.price !== null && reel.price > 0 && (<Badge variant="secondary" className="font-normal bg-amber-50 text-amber-700 border-amber-200">¥{reel.price}</Badge>)}
          </div>

          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              {reel.visibility === "public" ? (
                <Badge className="bg-blue-500/80 text-white border-0 font-normal text-[10px] gap-0.5"><Share2 className="w-2.5 h-2.5" /> 公开</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0 font-normal text-[10px] gap-0.5"><Lock className="w-2.5 h-2.5" /> 私有</Badge>
              )}
            </div>
            {reel.combosCount > 0 && (<span className="text-slate-400">用于 {reel.combosCount} 个组合</span>)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>编辑渔轮</DialogTitle></DialogHeader>
          <ReelForm initialData={reel} onSuccess={(updated) => { onUpdated(updated); setIsEditing(false); }} closeDialog={() => setIsEditing(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
