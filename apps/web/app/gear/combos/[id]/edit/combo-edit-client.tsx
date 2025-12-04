"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ComboForm } from "@/app/gear/GearForms";
import { ComboSummary, RodSummary, ReelSummary } from "@/app/gear/gear-shared";
import { ShareDialog, useShareConfig } from "@/components/share-dialog";

interface ComboEditClientProps {
  initialData: ComboSummary;
  rods: RodSummary[];
  reels: ReelSummary[];
}

export function ComboEditClient({ initialData, rods, reels }: ComboEditClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const shareConfig = useShareConfig("combo", {
    id: initialData.id,
    name: initialData.name,
    photoUrls: initialData.photoUrls,
    rod: initialData.rod,
    reel: initialData.reel,
    mainLineText: initialData.mainLineText,
  });

  async function handleDelete() {
    if (!confirm("确定要删除这个组合吗？")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/combos/${initialData.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/gear");
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
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header - 与出击记录详情页统一 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/gear")}
              className="text-slate-500 hover:text-slate-900 -ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-base font-bold text-slate-900 truncate max-w-[200px]">
              {initialData.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-1">
            {initialData.visibility === "public" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShare(true)}
                className="text-slate-500 hover:text-slate-900"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 w-4 h-4" />
                  {isDeleting ? "删除中..." : "删除组合"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">组合详情</CardTitle>
          </CardHeader>
          <CardContent>
            <ComboForm
              rods={rods}
              reels={reels}
              initialData={initialData}
              onSuccess={() => {
                router.push("/gear");
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      </main>

      {/* Share Dialog */}
      {initialData.visibility === "public" && (
        <ShareDialog
          config={shareConfig}
          open={showShare}
          onOpenChange={setShowShare}
        />
      )}
    </div>
  );
}
