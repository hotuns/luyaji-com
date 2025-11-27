"use client";

import { TripFormState, TripCatchDraft, FishSpecies } from "@/lib/types";
import { useState, useEffect } from "react";

interface Step3Props {
  formState: TripFormState;
  catches: TripCatchDraft[];
  addCatch: (catchItem: TripCatchDraft) => void;
  removeCatch: (catchId: string) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
}

export default function Step3Catches({
  catches,
  addCatch,
  removeCatch,
  onSubmit,
  onPrev,
  isSubmitting,
}: Step3Props) {
  const [showSpeciesSearch, setShowSpeciesSearch] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  const [count, setCount] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleAddCatch = () => {
    if (!selectedSpecies) return;

    const newCatch: TripCatchDraft = {
      id: `temp_${Date.now()}`,
      speciesId: selectedSpecies.id,
      speciesName: selectedSpecies.name,
      count,
    };

    addCatch(newCatch);
    setSelectedSpecies(null);
    setCount(1);
  };

  const handleSubmit = () => {
    if (catches.length === 0) {
      setShowConfirmDialog(true);
    } else {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">渔获记录</h2>
        <p className="text-sm text-gray-500 mb-4">
          添加这次出击的渔获（可选）
        </p>
      </div>

      {/* 快速添加渔获 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        {/* 选择鱼种 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            鱼种
          </label>
          <button
            onClick={() => setShowSpeciesSearch(true)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-left"
          >
            {selectedSpecies ? (
              <span className="text-gray-900">{selectedSpecies.name}</span>
            ) : (
              <span className="text-gray-400">点击选择鱼种</span>
            )}
          </button>
        </div>

        {/* 条数计数器 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            条数
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl font-medium text-gray-600"
              disabled={count <= 1}
            >
              −
            </button>
            <span className="text-2xl font-semibold text-gray-900 min-w-[3rem] text-center">
              {count}
            </span>
            <button
              onClick={() => setCount((c) => Math.min(99, c + 1))}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl font-medium text-gray-600"
            >
              ＋
            </button>
          </div>
        </div>

        {/* 添加按钮 */}
        <button
          onClick={handleAddCatch}
          disabled={!selectedSpecies}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          添加渔获
        </button>
      </div>

      {/* 已添加的渔获列表 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          已添加 ({catches.length})
        </h3>
        {catches.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl">🐟</span>
            <p className="mt-2 text-sm">还没有添加渔获</p>
          </div>
        ) : (
          <div className="space-y-2">
            {catches.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {item.speciesName}
                  </span>
                  <span className="text-gray-500 ml-2">× {item.count}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm("确认删除这条渔获记录吗？")) {
                      removeCatch(item.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
        >
          {isSubmitting ? "提交中..." : "完成出击"}
        </button>
      </div>

      {/* 鱼种搜索弹窗 */}
      {showSpeciesSearch && (
        <FishSpeciesSearch
          onClose={() => setShowSpeciesSearch(false)}
          onSelect={(species) => {
            setSelectedSpecies(species);
            setShowSpeciesSearch(false);
          }}
        />
      )}

      {/* 无渔获确认弹窗 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              确认完成出击？
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              当前还没有记录渔获，确定要以"无渔获"完成出击吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                继续记录
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  onSubmit();
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 鱼种搜索组件
function FishSpeciesSearch({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (species: FishSpecies) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fish-species")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSpecies(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredSpecies = species.filter((s) =>
    s.name.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 搜索头部 */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-600">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索鱼种..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* 鱼种列表 */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSpecies.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="text-2xl">🐟</span>
                <span className="font-medium text-gray-900">{s.name}</span>
              </button>
            ))}
            {filteredSpecies.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                没有找到匹配的鱼种
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
