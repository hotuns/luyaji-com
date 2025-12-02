"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TripFormState, TripCatchDraft } from "@/lib/types";
import Step1BasicInfo from "../../new/step1-basic-info";
import Step2GearWeather from "../../new/step2-gear-weather";
import Step3Catches from "../../new/step3-catches";
import { X } from "lucide-react";

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
          })),
          currentStep: 1,
          isDraft: false,
        });
      } catch (error) {
        console.error("加载出击详情失败:", error);
        alert("加载失败，请重试");
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => router.push(`/trips/${tripId}`)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-6 w-6" />
          </button>
          <h1 className="text-base font-semibold text-slate-900">
            编辑出击 ({formState.currentStep}/3)
          </h1>
          <div className="w-10" /> {/* 占位，保持标题居中 */}
        </div>
        
        {/* 步骤指示器 */}
        <div className="flex gap-1.5 px-4 pb-3">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step <= formState.currentStep 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500" 
                  : "bg-slate-100"
              }`}
            />
          ))}
        </div>
      </header>

      {/* 步骤内容 */}
      <div className="mx-auto max-w-3xl p-4 pb-24">
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
    </div>
  );
}
