"use client";

import { TripFormState } from "@/lib/types";
import { useState } from "react";
import Link from "next/link";
import { FishingSpotPicker } from "@/components/fishing-spot-picker";
import { FishingSpotFormDialog } from "@/components/fishing-spot-form-dialog";
import { useFishingSpots } from "@/hooks/use-fishing-spots";
import type { FishingSpotOption } from "@/hooks/use-fishing-spots";
import { DateTimeField } from "@/components/date-time-field";

interface Step1Props {
  formState: TripFormState;
  updateForm: (updates: Partial<TripFormState>) => void;
  onNext: () => void;
  onCancel: () => void;
}

export default function Step1BasicInfo({
  formState,
  updateForm,
  onNext,
  onCancel,
}: Step1Props) {
  const [error, setError] = useState("");
  const [spotDialogOpen, setSpotDialogOpen] = useState(false);
  const {
    spots,
    loading: spotsLoading,
    error: spotsError,
    reload: reloadSpots,
    upsertSpot,
  } = useFishingSpots();
  const selectedSpot = spots.find((item) => item.id === formState.spotId) || null;

  const applySpotToForm = (spot: FishingSpotOption) => {
    updateForm({
      spotId: spot.id,
    });
    setError("");
  };

  const handleSpotSelect = (spot: FishingSpotOption) => {
    applySpotToForm(spot);
  };

  const handleSpotCreated = (spot: FishingSpotOption) => {
    upsertSpot(spot);
    reloadSpots();
    applySpotToForm(spot);
  };

  const handleNext = () => {
    if (!formState.startTime) {
      setError("请选择出击时间");
      return;
    }
    if (!formState.spotId) {
      setError("请选择一个钓点，或先创建新的钓点");
      return;
    }
    setError("");
    onNext();
  };

  // 格式化日期时间显示
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateStr = "";
    if (date.toDateString() === today.toDateString()) {
      dateStr = "今天";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateStr = "昨天";
    } else {
      dateStr = date.toLocaleDateString("zh-CN", {
        month: "numeric",
        day: "numeric",
      });
    }

    const timeStr = date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dateStr} ${timeStr}`;
  };

  return (
    <>
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">基础信息</h2>

      <div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <label className="text-sm font-medium text-slate-700">
            选择钓点 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setSpotDialogOpen(true)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + 新建钓点
          </button>
        </div>
        <div className="mt-2">
          <FishingSpotPicker
            spots={spots}
            value={formState.spotId}
            loading={spotsLoading}
            error={spotsError}
            onReload={reloadSpots}
            onSelect={handleSpotSelect}
          />
        </div>
        {selectedSpot ? (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-500">
            <div className="font-medium text-slate-800">
              {selectedSpot.name}
              <span className="ml-2 inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">
                {selectedSpot.visibility === "public"
                  ? "公开"
                  : selectedSpot.visibility === "friends"
                  ? "仅好友"
                  : "私密"}
              </span>
            </div>
            {selectedSpot.locationName && (
              <div className="mt-1">地点：{selectedSpot.locationName}</div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            建议先创建常用钓点，后续出击可复用并单独控制公开范围。
          </p>
        )}
        <div className="mt-3 text-xs">
          <Link href="/spots" className="text-blue-600 hover:text-blue-700">
            管理全部钓点
          </Link>
        </div>
      </div>

      {/* 出击标题（可选） */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          出击标题
          <span className="text-slate-400 font-normal ml-1">（选填）</span>
        </label>
        <input
          type="text"
          value={formState.title || ""}
          onChange={(e) => updateForm({ title: e.target.value })}
          placeholder="给这次出击起个名字，如 XX水库早晨翘嘴"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          maxLength={50}
        />
      </div>

      {/* 出击时间 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          出击时间
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <DateTimeField
          value={formState.startTime}
          onChange={(iso) => updateForm({ startTime: iso })}
        />
        <p className="text-xs text-slate-400 mt-1">
          当前选择：{formatDateTime(formState.startTime)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          结束时间
          <span className="text-slate-400 ml-1 text-xs">（可选）</span>
        </label>
        {formState.endTime ? (
          <div className="space-y-2">
            <DateTimeField
              value={formState.endTime}
              onChange={(iso) => updateForm({ endTime: iso })}
            />
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                当前选择：{formatDateTime(formState.endTime)}
              </span>
              <button
                type="button"
                onClick={() => updateForm({ endTime: undefined })}
                className="text-blue-600 hover:text-blue-700"
              >
                清除结束时间
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => updateForm({ endTime: new Date().toISOString() })}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600"
          >
            点击设置结束时间（默认使用提交时间）
          </button>
        )}
      </div>

      {/* 备注（可选） */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          备注
          <span className="text-slate-400 font-normal ml-1">（选填）</span>
        </label>
        <textarea
          value={formState.note || ""}
          onChange={(e) => updateForm({ note: e.target.value })}
          placeholder="想记点啥？比如水位、鱼情、同伴……"
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* 公开设置 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          可见性
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateForm({ visibility: "private" })}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
              formState.visibility === "private"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="font-medium">🔒 私有</div>
            <div className="text-xs text-slate-500 mt-0.5">仅自己可见</div>
          </button>
          <button
            type="button"
            onClick={() => updateForm({ visibility: "public" })}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
              formState.visibility === "public"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="font-medium">🌐 公开</div>
            <div className="text-xs text-slate-500 mt-0.5">可分享给好友</div>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* 底部按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
        >
          下一步
        </button>
      </div>
    </div>
    <FishingSpotFormDialog
      open={spotDialogOpen}
      onOpenChange={(open) => setSpotDialogOpen(open)}
      onCreated={handleSpotCreated}
    />
    </>
  );
}
