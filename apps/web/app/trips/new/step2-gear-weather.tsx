"use client";

import { useState, useEffect } from "react";
import { TripFormState, Combo, Rod, Reel } from "@/lib/types";
import { useMetadataOptions } from "@/hooks/use-metadata-options";

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
  const { options: weatherOptions } = useMetadataOptions("weather_type");

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

  const handleWeatherSelect = (option: { id: string; label?: string | null; value: string }) => {
    if (formState.weatherMetadataId === option.id) {
      updateForm({ weatherType: "", weatherMetadataId: undefined });
    } else {
      updateForm({
        weatherType: option.label || option.value,
        weatherMetadataId: option.id,
      });
    }
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
        <div className="mb-4 space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            天气
          </label>
          <input
            type="text"
            value={formState.weatherType || ""}
            onChange={(e) =>
              updateForm({
                weatherType: e.target.value,
                weatherMetadataId: undefined,
              })
            }
            placeholder="如：晴、阴、阵雨"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {weatherOptions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {weatherOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleWeatherSelect(option)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    formState.weatherMetadataId === option.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label || option.value}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            选择推荐天气会自动填入上方输入框，也可自定义输入。
          </p>
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
  const [rodId, setRodId] = useState("");
  const [rodName, setRodName] = useState("");
  const [reelId, setReelId] = useState("");
  const [reelName, setReelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rods, setRods] = useState<Rod[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);

  // 加载现有装备
  useEffect(() => {
    const fetchGear = async () => {
      try {
        const [rodsRes, reelsRes] = await Promise.all([
          fetch("/api/rods"),
          fetch("/api/reels")
        ]);
        const rodsData = await rodsRes.json();
        const reelsData = await reelsRes.json();
        
        if (rodsData.success) setRods(rodsData.data);
        if (reelsData.success) setReels(reelsData.data);
      } catch (e) {
        console.error("Failed to fetch gear", e);
      }
    };
    fetchGear();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !rodId || !reelId) {
      alert("请填写完整信息");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/combos/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          rodId,
          rodName,
          reelId,
          reelName
        }),
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full md:w-[480px] md:rounded-2xl rounded-t-2xl p-6 animate-slide-up md:animate-none">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">新建装备组合</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <GearSelect
            label="鱼竿"
            value={rodId}
            onChange={(id, name) => {
              setRodId(id);
              setRodName(name);
            }}
            items={rods}
            placeholder="请选择鱼竿"
          />

          <GearSelect
            label="渔轮"
            value={reelId}
            onChange={(id, name) => {
              setReelId(id);
              setReelName(name);
            }}
            items={reels}
            placeholder="请选择渔轮"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isSubmitting ? "创建中..." : "创建组合"}
        </button>
      </div>
    </div>
  );
}

// 装备选择组件（纯下拉选择）
function GearSelect({
  label,
  value,
  onChange,
  items,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (id: string, name: string) => void;
  items: { id: string; name: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => {
          const selected = items.find(item => item.id === e.target.value);
          if (selected) {
            onChange(selected.id, selected.name);
          }
        }}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
      >
        <option value="">{placeholder}</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
