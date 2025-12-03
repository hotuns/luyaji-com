"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TripFormState, TripCatchDraft } from "@/lib/types";
import Step1BasicInfo from "../../new/step1-basic-info";
import Step2GearWeather from "../../new/step2-gear-weather";
import Step3Catches from "../../new/step3-catches";
import { X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

export default function EditTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const router = useRouter();
  const [formState, setFormState] = useState<TripFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载出击详情
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}`);
        if (!response.ok) {
          throw new Error("获取出击详情失败");
        }
        const result = await response.json();
        const trip = result.data;

        // 转换为表单状态
        setFormState({
          title: trip.title || "",
          startTime: trip.startTime,
          endTime: trip.endTime || undefined,
          locationName: trip.locationName,
          note: trip.note || "",
          usedComboIds: trip.combos.map((c: any) => c.id),
          weatherType: trip.weatherType || "",
          weatherTemperatureText: trip.weatherTemperatureText || "",
          weatherWindText: trip.weatherWindText || "",
          catches: trip.catches.map((c: any) => ({
            id: c.id, // 保留 ID 用于 key，虽然提交时可能不直接用
            speciesId: c.speciesId,
            speciesName: c.speciesName,
            count: c.count,
            sizeText: c.sizeText || "",
            comboId: c.comboId || "",
            lureText: c.lureText || "",
            note: c.note || "",
            caughtAt: c.caughtAt || undefined,
          })),
          currentStep: 1,
          isDraft: false,
        });
      } catch (error) {
        console.error("加载出击详情失败:", error);
        // alert("加载失败，请重试");
        router.push(`/trips/${tripId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, router]);

  // 更新表单字段
  const updateForm = (updates: Partial<TripFormState>) => {
    if (!formState) return;
    setFormState((prev) => (prev ? { ...prev, ...updates } : null));
  };

  // 下一步
  const nextStep = () => {
    if (formState && formState.currentStep < 3) {
      updateForm({ currentStep: (formState.currentStep + 1) as 1 | 2 | 3 });
    }
  };

  // 上一步
  const prevStep = () => {
    if (formState && formState.currentStep > 1) {
      updateForm({ currentStep: (formState.currentStep - 1) as 1 | 2 | 3 });
    }
  };

  // 提交更新
  const submitTrip = async () => {
    if (!formState) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formState.title || undefined,
          startTime: formState.startTime,
          endTime: formState.endTime || null,
          locationName: formState.locationName,
          note: formState.note || undefined,
          usedComboIds: formState.usedComboIds,
          weather: {
            type: formState.weatherType || undefined,
            temperatureText: formState.weatherTemperatureText || undefined,
            windText: formState.weatherWindText || undefined,
          },
          catches: formState.catches.map((c) => ({
            speciesId: c.speciesId,
            count: c.count,
            sizeText: c.sizeText || undefined,
            comboId: c.comboId || undefined,
            lureText: c.lureText || undefined,
            note: c.note || undefined,
            caughtAt: c.caughtAt || undefined,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("更新失败");
      }

      // 跳转到出击详情
      router.push(`/trips/${tripId}`);
      router.refresh(); // 刷新页面数据
    } catch (error) {
      console.error("更新出击失败:", error);
      alert("更新失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加渔获
  const addCatch = (catchItem: TripCatchDraft) => {
    if (!formState) return;
    updateForm({ catches: [...formState.catches, catchItem] });
  };

  // 删除渔获
  const removeCatch = (catchId: string) => {
    if (!formState) return;
    updateForm({
      catches: formState.catches.filter((c) => c.id !== catchId),
    });
  };

  if (isLoading || !formState) {
    return <EditTripSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push(`/trips/${tripId}`)}
            className="text-slate-500 hover:text-slate-900 -ml-2"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-base font-bold text-slate-900">编辑出击</h1>
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    step === formState.currentStep ? "bg-blue-600 w-6" : 
                    step < formState.currentStep ? "bg-blue-400 w-2" : "bg-slate-200 w-2"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6 md:p-8">
          {formState.currentStep === 1 && (
            <Step1BasicInfo
              formState={formState}
              updateForm={updateForm}
              onNext={nextStep}
              onCancel={() => router.push(`/trips/${tripId}`)}
            />
          )}
          
          {formState.currentStep === 2 && (
            <Step2GearWeather
              formState={formState}
              updateForm={updateForm}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          
          {formState.currentStep === 3 && (
            <Step3Catches
              formState={formState}
              catches={formState.catches}
              addCatch={addCatch}
              removeCatch={removeCatch}
              onSubmit={submitTrip}
              onPrev={prevStep}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function EditTripSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-24 h-5" />
          <div className="flex gap-1">
            <Skeleton className="w-6 h-1.5 rounded-full" />
            <Skeleton className="w-2 h-1.5 rounded-full" />
            <Skeleton className="w-2 h-1.5 rounded-full" />
          </div>
        </div>
        <div className="w-10" />
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <Skeleton className="w-32 h-6" />
          <div className="space-y-4">
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-12 rounded-xl" />
            <Skeleton className="w-full h-32 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
