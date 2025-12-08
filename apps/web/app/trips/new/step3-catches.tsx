"use client";

import { TripFormState, TripCatchDraft, FishSpecies } from "@/lib/types";
import { processImageForUpload } from "@/lib/image-utils";
import { useState, useEffect, useRef } from "react";
import { Camera, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { SpeciesPicker } from "@/components/species-picker";

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
  formState,
  catches,
  addCatch,
  removeCatch,
  onSubmit,
  onPrev,
  isSubmitting,
}: Step3Props) {
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);
  const [count, setCount] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "compressing" | "uploading">("idle");
  const isUploading = uploadStatus !== "idle";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caughtAt] = useState<string>(() => new Date().toISOString());
  
  // 新增的可选字段
  const [sizeText, setSizeText] = useState("");
  const [selectedComboId, setSelectedComboId] = useState("");
  const [lureText, setLureText] = useState("");
  const [note, setNote] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  // 获取组合信息用于显示名称
  const [combosMap, setCombosMap] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (formState.usedComboIds.length > 0) {
      fetch("/api/combos", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const map: Record<string, string> = {};
            data.data.forEach((combo: { id: string; name: string }) => {
              if (formState.usedComboIds.includes(combo.id)) {
                map[combo.id] = combo.name;
              }
            });
            setCombosMap(map);
          }
        })
        .catch(() => {});
    }
  }, [formState.usedComboIds]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 阶段1: 压缩图片
      setUploadStatus("compressing");
      const { blob, filename } = await processImageForUpload(file);

      // 阶段2: 上传到服务器
      setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("folder", "catches");

      const res = await fetch("/api/upload/catch-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("照片上传响应:", data);

      if (data.success && data.data?.url) {
        console.log("设置照片URL:", data.data.url);
        setPhotoUrl(data.data.url);
      } else {
        console.error("照片上传失败:", data);
        alert(data.error || "上传失败");
      }
    } catch (error) {
      console.error("上传失败:", error);
      alert("上传失败，请重试");
    } finally {
      setUploadStatus("idle");
      // 清空 input 以便重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddCatch = () => {
    if (!selectedSpecies) return;

    console.log("添加渔获时的 photoUrl:", photoUrl);
    
    const newCatch: TripCatchDraft = {
      id: `temp_${Date.now()}`,
      speciesId: selectedSpecies.id,
      speciesName: selectedSpecies.name,
      count,
      caughtAt,
      photoUrls: photoUrl ? [photoUrl] : undefined,
      sizeText: sizeText.trim() || undefined,
      comboId: selectedComboId || undefined,
      lureText: lureText.trim() || undefined,
      note: note.trim() || undefined,
    };
    
    console.log("创建的渔获对象:", newCatch);

    addCatch(newCatch);
    // 重置所有表单字段
    setSelectedSpecies(null);
    setCount(1);
    setPhotoUrl(null);
    setSizeText("");
    setSelectedComboId("");
    setLureText("");
    setNote("");
    setShowMoreOptions(false);
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
        <h2 className="text-lg font-semibold text-slate-900 mb-1">渔获记录</h2>
        <p className="text-sm text-slate-500 mb-4">
          建议每次上鱼都记录一条渔获，方便统计时间、装备和照片；同一时刻上来的多条同种鱼，可以在一条里调整条数。
        </p>
      </div>

      {/* 快速添加渔获 */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-4">
        {/* 选择鱼种 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            鱼种
          </label>
          <SpeciesPicker
            value={selectedSpecies}
            onSelect={setSelectedSpecies}
            placeholder="点击选择鱼种"
          />
        </div>

        {/* 条数计数器 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            条数
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl font-medium text-slate-600 active:scale-95 transition-transform"
              disabled={count <= 1}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={count}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setCount(Math.max(1, Math.min(999, val)));
              }}
              className="w-20 h-12 text-center text-xl font-semibold text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={1}
              max={999}
            />
            <button
              onClick={() => setCount((c) => Math.min(999, c + 1))}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl font-medium text-slate-600 active:scale-95 transition-transform"
            >
              ＋
            </button>
          </div>
        </div>

        {/* 照片上传（可选） */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            照片 <span className="text-slate-400 font-normal">（可选）</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          {photoUrl ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="渔获照片"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPhotoUrl(null)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              {uploadStatus === "compressing" ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs mt-1">压缩中...</span>
                </>
              ) : uploadStatus === "uploading" ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs mt-1">上传中...</span>
                </>
              ) : (
                <>
                  <Camera size={24} />
                  <span className="text-xs mt-1">添加照片</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 更多选项折叠区 */}
        <button
          type="button"
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="flex items-center justify-center gap-1 w-full py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          {showMoreOptions ? (
            <>
              <ChevronUp size={16} />
              收起详细信息
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              填写更多信息（尺寸、装备、假饵等）
            </>
          )}
        </button>

        {showMoreOptions && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            {/* 尺寸 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                尺寸 <span className="text-slate-400 font-normal">（可选）</span>
              </label>
              <input
                type="text"
                value={sizeText}
                onChange={(e) => setSizeText(e.target.value)}
                placeholder="例如：35cm、2斤半"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* 使用的组合 */}
            {formState.usedComboIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  使用的装备 <span className="text-slate-400 font-normal">（可选）</span>
                </label>
                <select
                  value={selectedComboId}
                  onChange={(e) => setSelectedComboId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">不指定</option>
                  {formState.usedComboIds.map((comboId) => (
                    <option key={comboId} value={comboId}>
                      {combosMap[comboId] || comboId}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  选择这条鱼是用哪套装备钓上来的
                </p>
              </div>
            )}

            {/* 假饵 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                使用假饵 <span className="text-slate-400 font-normal">（可选）</span>
              </label>
              <input
                type="text"
                value={lureText}
                onChange={(e) => setLureText(e.target.value)}
                placeholder="例如：7cm 米诺、3.5g 亮片"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                备注 <span className="text-slate-400 font-normal">（可选）</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="记录这条鱼的特别之处..."
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* 添加按钮 */}
        <button
          onClick={handleAddCatch}
          disabled={!selectedSpecies || isUploading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "上传中..." : "添加渔获"}
        </button>
      </div>

      {/* 已添加的渔获列表 */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">
          已添加 ({catches.length})
        </h3>
        {catches.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <span className="text-4xl">🐟</span>
            <p className="mt-2 text-sm">还没有添加渔获</p>
            <p className="mt-1 text-xs">第一次上鱼时，可以点击上方“添加渔获”来记录这一条。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {catches.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100"
              >
                {/* 照片缩略图 */}
                {item.photoUrls && item.photoUrls.length > 0 && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photoUrls[0]}
                      alt="渔获照片"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {item.speciesName}
                    </span>
                    <span className="text-slate-500">× {item.count}</span>
                    {item.sizeText && (
                      <span className="text-xs text-slate-400">({item.sizeText})</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400">
                    {item.comboId && combosMap[item.comboId] && (
                      <span>🎣 {combosMap[item.comboId]}</span>
                    )}
                    {item.lureText && (
                      <span>🪝 {item.lureText}</span>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{item.note}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm("确认删除这条渔获记录吗？")) {
                      removeCatch(item.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-500"
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
          className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
        >
          {isUploading ? "上传中..." : isSubmitting ? "提交中..." : "完成出击"}
        </button>
      </div>

      {/* 无渔获确认弹窗 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              确认完成出击？
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              当前还没有记录渔获，确定要以"无渔获"完成出击吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium"
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
