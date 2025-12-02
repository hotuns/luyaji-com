"use client";

import { TripFormState, WEATHER_TYPES, Combo } from "@/lib/types";
import { useState, useEffect } from "react";

interface Step2Props {
  formState: TripFormState;
  updateForm: (updates: Partial<TripFormState>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2GearWeather({
  formState,
  updateForm,
  onNext,
  onPrev,
}: Step2Props) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewComboForm, setShowNewComboForm] = useState(false);

  // 获取用户的组合列表（禁用缓存确保获取最新数据）
  useEffect(() => {
    fetch("/api/combos", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCombos(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => {
    if (formState.usedComboIds.length === 0) {
      setError("请至少选择一个装备组合");
      return;
    }
    setError("");
    onNext();
  };

  const toggleCombo = (comboId: string) => {
    const newIds = formState.usedComboIds.includes(comboId)
      ? formState.usedComboIds.filter((id) => id !== comboId)
      : [...formState.usedComboIds, comboId];
    updateForm({ usedComboIds: newIds });
  };

  return (
    <div className="space-y-6">
      {/* 装备组合选择 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          使用的装备组合
        </h2>
        <p className="text-sm text-slate-500 mb-4">至少选择一个</p>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : combos.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-slate-500 mb-4">你还没有装备组合，先新建一个吧</p>
            <button
              onClick={() => setShowNewComboForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              ＋ 新建组合
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {combos.map((combo) => (
              <div
                key={combo.id}
                onClick={() => toggleCombo(combo.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formState.usedComboIds.includes(combo.id)
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{combo.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {combo.rod?.name} + {combo.reel?.name}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      formState.usedComboIds.includes(combo.id)
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300"
                    }`}
                  >
                    {formState.usedComboIds.includes(combo.id) && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowNewComboForm(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              ＋ 临时新建组合
            </button>
          </div>
        )}
      </div>

      {/* 天气情况 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          天气情况
        </h2>
        <p className="text-sm text-slate-500 mb-4">可选，后续也可以补充</p>

        {/* 天气类型 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            天气
          </label>
          <div className="flex flex-wrap gap-2">
            {WEATHER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  updateForm({
                    weatherType:
                      formState.weatherType === type ? "" : type,
                  })
                }
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  formState.weatherType === type
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 温度 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            温度
          </label>
          <input
            type="text"
            value={formState.weatherTemperatureText || ""}
            onChange={(e) =>
              updateForm({ weatherTemperatureText: e.target.value })
            }
            placeholder="如：8～12℃"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* 风力 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            风力
          </label>
          <input
            type="text"
            value={formState.weatherWindText || ""}
            onChange={(e) => updateForm({ weatherWindText: e.target.value })}
            placeholder="如：北风3级、微风"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* 底部按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
        >
          下一步
        </button>
      </div>

      {/* 新建组合弹窗 */}
      {showNewComboForm && (
        <NewComboModal
          onClose={() => setShowNewComboForm(false)}
          onCreated={(combo) => {
            setCombos((prev) => [combo, ...prev]);
            updateForm({ usedComboIds: [...formState.usedComboIds, combo.id] });
            setShowNewComboForm(false);
          }}
        />
      )}
    </div>
  );
}

// 新建组合弹窗组件
function NewComboModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (combo: Combo) => void;
}) {
  const [name, setName] = useState("");
  const [rodName, setRodName] = useState("");
  const [reelName, setReelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !rodName.trim() || !reelName.trim()) {
      alert("请填写完整信息");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/combos/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rodName, reelName }),
      });

      if (!response.ok) throw new Error("创建失败");

      const result = await response.json();
      onCreated(result.data);
    } catch {
      alert("创建失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">新建装备组合</h3>
          <button onClick={onClose} className="text-slate-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              组合名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：黑鱼专用组合"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              鱼竿名称
            </label>
            <input
              type="text"
              value={rodName}
              onChange={(e) => setRodName(e.target.value)}
              placeholder="如：天元路亚竿 2.1m M调"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              渔轮名称
            </label>
            <input
              type="text"
              value={reelName}
              onChange={(e) => setReelName(e.target.value)}
              placeholder="如：达瓦 LT2500"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
        >
          {isSubmitting ? "创建中..." : "创建组合"}
        </button>
      </div>
    </div>
  );
}
