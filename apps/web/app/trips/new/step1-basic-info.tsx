"use client";

import { TripFormState } from "@/lib/types";
import { useState, useEffect } from "react";
import { LocationPicker } from "@/components/map";

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
  const [lastLocation, setLastLocation] = useState<string | null>(null);

  // 获取上一次出击地点
  useEffect(() => {
    fetch("/api/trips/last-location")
      .then((res) => res.json())
      .then((data) => {
        if (data.locationName) {
          setLastLocation(data.locationName);
        }
      })
      .catch(() => {});
  }, []);

  const handleNext = () => {
    if (!formState.startTime) {
      setError("请选择出击时间");
      return;
    }
    if (!formState.locationName.trim()) {
      setError("请填写出击地点");
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
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">基础信息</h2>

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
        <div className="relative">
          <input
            type="datetime-local"
            value={formState.startTime.slice(0, 16)}
            onChange={(e) =>
              updateForm({ startTime: new Date(e.target.value).toISOString() })
            }
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          当前选择：{formatDateTime(formState.startTime)}
        </p>
      </div>

      {/* 出击地点 - 使用地图组件 */}
      <LocationPicker
        value={
          formState.locationLat && formState.locationLng
            ? { lat: formState.locationLat, lng: formState.locationLng }
            : null
        }
        onChange={(location) => {
          if (location) {
            updateForm({
              locationLat: location.lat,
              locationLng: location.lng,
            });
          } else {
            updateForm({
              locationLat: undefined,
              locationLng: undefined,
            });
          }
        }}
        locationName={formState.locationName}
        onLocationNameChange={(name) => updateForm({ locationName: name })}
      />
      {lastLocation && formState.locationName !== lastLocation && (
        <button
          type="button"
          onClick={() => updateForm({ locationName: lastLocation })}
          className="mt-2 text-sm text-blue-600"
        >
          使用上一次的地点：{lastLocation}
        </button>
      )}

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
  );
}
