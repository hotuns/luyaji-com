"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { TripFormState, TripCatchDraft, WEATHER_TYPES, Combo, FishSpecies } from "@/lib/types";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog";
import { ArrowLeft, Save, Plus, Trash2, Camera, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { DateTimeField } from "@/components/date-time-field";
import { processImageForUpload } from "@/lib/image-utils";
import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/skeleton";

// 动态导入 LocationPicker，禁用 SSR
const LocationPicker = dynamic(
  () => import("@/components/map").then((mod) => mod.LocationPicker),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-12 w-full rounded-xl" />
  }
);

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [formState, setFormState] = useState<TripFormState | null>(null);
  const [isCatchDialogOpen, setIsCatchDialogOpen] = useState(false);
  const [editingCatchId, setEditingCatchId] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripRes, combosRes] = await Promise.all([
          fetch(`/api/trips/${tripId}`),
          fetch("/api/combos", { cache: "no-store" })
        ]);

        const tripData = await tripRes.json();
        const combosData = await combosRes.json();

        if (tripData.success && tripData.data) {
          const trip = tripData.data;
          setFormState({
            title: trip.title || "",
            startTime: trip.startTime,
            endTime: trip.endTime || "",
            locationName: trip.locationName,
            locationLat: trip.locationLat,
            locationLng: trip.locationLng,
            weatherType: trip.weatherType || "晴",
            weatherTemperatureText: trip.weatherTemperatureText || "",
            weatherWindText: trip.weatherWindText || "",
            usedComboIds: trip.combos.map((c: any) => c.id),
            catches: trip.catches.map((c: any) => ({
              id: c.id,
              speciesId: c.speciesId,
              speciesName: c.speciesName,
              count: c.count,
              photoUrls: c.photoUrls || [],
              sizeText: c.sizeText || "",
              comboId: c.combo?.id || "",
              lureText: c.lureText || "",
              note: c.note || "",
            })),
            currentStep: 1,
            isDraft: false,
            visibility: trip.visibility || "public",
          });
        }

        if (combosData.success) {
          setCombos(combosData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const updateForm = (updates: Partial<TripFormState>) => {
    setFormState((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleSave = async () => {
    if (!formState) return;
    if (!formState.startTime) {
      alert("请选择出击时间");
      return;
    }
    if (!formState.locationName.trim()) {
      alert("请填写出击地点");
      return;
    }

    setIsSubmitting(true);
    try {
      // 构建符合 API 期望的数据格式
      const payload = {
        title: formState.title,
        startTime: formState.startTime,
        endTime: formState.endTime || null,
        locationName: formState.locationName,
        locationLat: formState.locationLat,
        locationLng: formState.locationLng,
        visibility: formState.visibility,
        weather: {
          type: formState.weatherType,
          temperatureText: formState.weatherTemperatureText || undefined,
          windText: formState.weatherWindText || undefined,
        },
        usedComboIds: formState.usedComboIds,
        catches: formState.catches.map(c => ({
          speciesId: c.speciesId,
          count: c.count,
          sizeText: c.sizeText || undefined,
          comboId: c.comboId || undefined,
          lureText: c.lureText || undefined,
          note: c.note || undefined,
          photoUrls: c.photoUrls || undefined,
        })),
      };

      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/trips/${tripId}`);
        router.refresh();
      } else {
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCombo = (comboId: string) => {
    if (!formState) return;
    const newIds = formState.usedComboIds.includes(comboId)
      ? formState.usedComboIds.filter((id) => id !== comboId)
      : [...formState.usedComboIds, comboId];
    updateForm({ usedComboIds: newIds });
  };

  const handleAddCatch = (newCatch: TripCatchDraft) => {
    if (!formState) return;
    if (editingCatchId) {
      updateForm({
        catches: formState.catches.map(c => c.id === editingCatchId ? newCatch : c)
      });
    } else {
      updateForm({
        catches: [...formState.catches, newCatch]
      });
    }
    setIsCatchDialogOpen(false);
    setEditingCatchId(null);
  };

  const removeCatch = (catchId: string) => {
    if (!formState) return;
    updateForm({
      catches: formState.catches.filter((c) => c.id !== catchId),
    });
  };

  const openAddCatchDialog = () => {
    setEditingCatchId(null);
    setIsCatchDialogOpen(true);
  };

  const openEditCatchDialog = (catchItem: TripCatchDraft) => {
    setEditingCatchId(catchItem.id);
    setIsCatchDialogOpen(true);
  };

  if (loading || !formState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push(`/trips/${tripId}`)}
              className="text-slate-500 hover:text-slate-900 -ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-base font-bold text-slate-900">编辑出击</h1>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>出击标题</Label>
              <Input 
                value={formState.title || ""} 
                onChange={(e) => updateForm({ title: e.target.value })}
                placeholder="给这次出击起个名字"
              />
            </div>
            <div className="space-y-2">
              <Label>出击时间 <span className="text-red-500">*</span></Label>
              <DateTimeField
                value={formState.startTime}
                onChange={(val) => updateForm({ startTime: val })}
              />
            </div>
            <div className="space-y-2">
              <Label>出击地点 <span className="text-red-500">*</span></Label>
              <LocationPicker
                value={formState.locationLat && formState.locationLng ? { lat: formState.locationLat, lng: formState.locationLng } : null}
                onChange={(loc) => updateForm({
                  locationLat: loc?.lat,
                  locationLng: loc?.lng,
                })}
                locationName={formState.locationName}
                onLocationNameChange={(name) => updateForm({ locationName: name })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weather */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">天气与环境</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>天气状况</Label>
              <div className="grid grid-cols-4 gap-2">
                {WEATHER_TYPES.map((weather) => (
                  <button
                    key={weather}
                    onClick={() => updateForm({ weatherType: weather })}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                      formState.weatherType === weather
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {weather}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>气温</Label>
              <Input 
                value={formState.weatherTemperatureText || ""} 
                onChange={(e) => updateForm({ weatherTemperatureText: e.target.value })}
                placeholder="如 25°C"
              />
            </div>
            <div className="space-y-2">
              <Label>风力</Label>
              <Input 
                value={formState.weatherWindText || ""} 
                onChange={(e) => updateForm({ weatherWindText: e.target.value })}
                placeholder="如 东风3级"
              />
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">可见性设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateForm({ visibility: "private" })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  formState.visibility === "private"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  formState.visibility === "private" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div className="text-center">
                  <div className="font-medium text-slate-900">仅自己可见</div>
                  <div className="text-xs text-slate-500">私密记录</div>
                </div>
              </button>
              <button
                onClick={() => updateForm({ visibility: "public" })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  formState.visibility === "public"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  formState.visibility === "public" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                </div>
                <div className="text-center">
                  <div className="font-medium text-slate-900">公开分享</div>
                  <div className="text-xs text-slate-500">可生成分享链接</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Gear */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">使用装备</CardTitle>
          </CardHeader>
          <CardContent>
            {combos.length === 0 ? (
              <div className="text-center py-4 text-slate-500">暂无装备组合</div>
            ) : (
              <div className="grid gap-2">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    onClick={() => toggleCombo(combo.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all",
                      formState.usedComboIds.includes(combo.id)
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{combo.name}</div>
                      <div className="text-xs text-slate-500">{combo.rod?.name} + {combo.reel?.name}</div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      formState.usedComboIds.includes(combo.id)
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300"
                    )}>
                      {formState.usedComboIds.includes(combo.id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">渔获记录</CardTitle>
            <Button size="sm" variant="outline" onClick={openAddCatchDialog}>
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </CardHeader>
          <CardContent>
            {formState.catches.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                暂无渔获记录
              </div>
            ) : (
              <div className="space-y-3">
                {formState.catches.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.photoUrls && item.photoUrls.length > 0 ? (
                        <img src={item.photoUrls[0]} alt={item.speciesName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Camera className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-slate-900">{item.speciesName}</h4>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {item.count}尾
                            {item.sizeText && ` · ${item.sizeText}`}
                            {item.lureText && ` · ${item.lureText}`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCatchDialog(item)}>
                            <span className="sr-only">编辑</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeCatch(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{item.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CatchDialog 
        open={isCatchDialogOpen} 
        onOpenChange={setIsCatchDialogOpen}
        onSave={handleAddCatch}
        initialData={editingCatchId ? formState.catches.find(c => c.id === editingCatchId) : undefined}
        combos={combos.filter(c => formState.usedComboIds.includes(c.id))}
      />
    </div>
  );
}

function CatchDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  initialData,
  combos 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSave: (data: TripCatchDraft) => void;
  initialData?: TripCatchDraft;
  combos: Combo[];
}) {
  const [speciesList, setSpeciesList] = useState<FishSpecies[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  const [count, setCount] = useState(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sizeText, setSizeText] = useState("");
  const [comboId, setComboId] = useState("");
  const [lureText, setLureText] = useState("");
  const [note, setNote] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "compressing" | "uploading">("idle");
  const [showMore, setShowMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Reset or load initial data
      if (initialData) {
        setSelectedSpecies({ id: initialData.speciesId, name: initialData.speciesName, isActive: true });
        setCount(initialData.count);
        setPhotoUrl(initialData.photoUrls?.[0] || null);
        setSizeText(initialData.sizeText || "");
        setComboId(initialData.comboId || "");
        setLureText(initialData.lureText || "");
        setNote(initialData.note || "");
        setShowMore(!!(initialData.sizeText || initialData.comboId || initialData.lureText || initialData.note));
      } else {
        setSelectedSpecies(null);
        setCount(1);
        setPhotoUrl(null);
        setSizeText("");
        setComboId("");
        setLureText("");
        setNote("");
        setShowMore(false);
      }
      
      // Fetch species if needed
      fetch("/api/fish-species").then(res => res.json()).then(data => {
        if (data.success) setSpeciesList(data.data);
      });
    }
  }, [open, initialData]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus("compressing");
      const { blob, filename } = await processImageForUpload(file);

      setUploadStatus("uploading");
      const formData = new FormData();
      formData.append("file", blob, filename);

      const res = await fetch("/api/upload/catch-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        setPhotoUrl(data.data.url);
      } else {
        alert(data.error || "上传失败");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("上传失败");
    } finally {
      setUploadStatus("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!selectedSpecies) {
      alert("请选择鱼种");
      return;
    }
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      speciesId: selectedSpecies.id,
      speciesName: selectedSpecies.name,
      count,
      photoUrls: photoUrl ? [photoUrl] : undefined,
      sizeText,
      comboId,
      lureText,
      note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "编辑渔获" : "添加渔获"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Photo Upload */}
          <div className="flex justify-center">
            <div 
              className="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="Catch" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <>
                  {uploadStatus === "idle" && (
                    <>
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500">上传照片</span>
                    </>
                  )}
                  {uploadStatus === "compressing" && (
                    <>
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <span className="text-xs text-blue-500">压缩中...</span>
                    </>
                  )}
                  {uploadStatus === "uploading" && (
                    <>
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <span className="text-xs text-blue-500">上传中...</span>
                    </>
                  )}
                </>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoSelect}
              />
            </div>
          </div>

          {/* Species Selection */}
          <div className="space-y-2">
            <Label>鱼种 <span className="text-red-500">*</span></Label>
            <Select 
              value={selectedSpecies?.id} 
              onValueChange={(val) => {
                const s = speciesList.find(item => item.id === val);
                if (s) setSelectedSpecies(s);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择鱼种" />
              </SelectTrigger>
              <SelectContent>
                {speciesList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Count */}
          <div className="space-y-2">
            <Label>数量</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setCount(Math.max(1, count - 1))}>-</Button>
              <span className="text-lg font-medium w-8 text-center">{count}</span>
              <Button variant="outline" size="icon" onClick={() => setCount(count + 1)}>+</Button>
            </div>
          </div>

          {/* More Options Toggle */}
          <div 
            className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer pt-2"
            onClick={() => setShowMore(!showMore)}
          >
            <span>更多选项 (尺寸、装备、备注等)</span>
            {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>

          {/* Extended Fields */}
          {showMore && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>尺寸 (cm/kg)</Label>
                  <Input 
                    value={sizeText} 
                    onChange={(e) => setSizeText(e.target.value)} 
                    placeholder="如 50cm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>使用拟饵</Label>
                  <Input 
                    value={lureText} 
                    onChange={(e) => setLureText(e.target.value)} 
                    placeholder="如 米诺"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>使用装备</Label>
                <Select value={comboId} onValueChange={setComboId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择本次使用的装备" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不指定</SelectItem>
                    {combos.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="记录更多细节..."
                  className="h-20"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!selectedSpecies || uploadStatus !== "idle"}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
