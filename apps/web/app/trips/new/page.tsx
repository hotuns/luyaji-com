"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TripFormState, TripCatchDraft } from "@/lib/types";
import Step1BasicInfo from "./step1-basic-info";
import Step2GearWeather from "./step2-gear-weather";
import Step3Catches from "./step3-catches";
import { X } from "lucide-react";

// 本地存储 key
const DRAFT_STORAGE_KEY = "luyaji_trip_draft_current";

// 初始表单状态
const getInitialFormState = (): TripFormState => ({
  title: "",
  startTime: new Date().toISOString(),
  locationName: "",
  note: "",
  usedComboIds: [],
  weatherType: "",
  weatherTemperatureText: "",
  weatherWindText: "",
  catches: [],
  currentStep: 1,
  isDraft: false,
});

export default function NewTripPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<TripFormState>(getInitialFormState());
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 检查是否有草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as TripFormState;
        if (draft.isDraft) {
          setShowDraftDialog(true);
        }
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, []);

  // 自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formState.locationName || formState.title) {
        const draftData: TripFormState = {
          ...formState,
          isDraft: true,
          lastSavedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formState]);

  // 加载草稿
  const loadDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft) as TripFormState;
      setFormState(draft);
    }
    setShowDraftDialog(false);
  };

  // 丢弃草稿
  const discardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormState(getInitialFormState());
    setShowDraftDialog(false);
  };

  // 手动保存草稿并返回
  const saveDraftAndExit = () => {
    const draftData: TripFormState = {
      ...formState,
      isDraft: true,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    router.push("/trips");
  };

  // 更新表单字段
  const updateForm = (updates: Partial<TripFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  // 下一步
  const nextStep = () => {
    if (formState.currentStep < 3) {
      updateForm({ currentStep: (formState.currentStep + 1) as 1 | 2 | 3 });
    }
  };

  // 上一步
  const prevStep = () => {
    if (formState.currentStep > 1) {
      updateForm({ currentStep: (formState.currentStep - 1) as 1 | 2 | 3 });
    }
  };

  // 提交出击记录
  const submitTrip = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
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
        throw new Error("提交失败");
      }

      const result = await response.json();
      
      // 清除草稿
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      
      // 跳转到出击详情
      router.push(`/trips/${result.data.id}`);
    } catch (error) {
      console.error("提交出击失败:", error);
      alert("提交失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加渔获
  const addCatch = (catchItem: TripCatchDraft) => {
    updateForm({ catches: [...formState.catches, catchItem] });
  };

  // 删除渔获
  const removeCatch = (catchId: string) => {
    updateForm({
      catches: formState.catches.filter((c) => c.id !== catchId),
    });
  };

  // 渲染草稿恢复对话框
  if (showDraftDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            检测到未完成的出击
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            系统自动保存了您上次未完成的记录，是否继续编辑？
          </p>
          <div className="flex gap-3">
            <button
              onClick={discardDraft}
              className="flex-1 rounded-xl border border-gray-200 py-3 font-medium text-gray-600 transition hover:bg-gray-50"
            >
              丢弃
            </button>
            <button
              onClick={loadDraft}
              className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              继续编辑
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => {
              if (formState.locationName || formState.title) {
                if (confirm("是否保存为草稿？")) {
                  saveDraftAndExit();
                } else {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  router.push("/trips");
                }
              } else {
                router.push("/trips");
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            新建出击 ({formState.currentStep}/3)
          </h1>
          <button
            onClick={saveDraftAndExit}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            保存草稿
          </button>
        </div>
        
        {/* 步骤指示器 */}
        <div className="flex gap-1.5 px-4 pb-3">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step <= formState.currentStep 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500" 
                  : "bg-gray-100"
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
            onCancel={() => router.push("/trips")}
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
