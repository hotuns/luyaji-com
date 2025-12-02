"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import { avatars, type AvatarOption } from "@/lib/avatar-config";
import { Check, X } from "lucide-react";

interface AvatarPickerProps {
  /** 当前选中的头像 URL */
  value?: string;
  /** 头像变更回调 */
  onChange: (url: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

export function AvatarPicker({
  value,
  onChange,
  disabled = false,
  className,
}: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(value || "");

  // 找到当前选中的头像
  const currentAvatar = avatars.find((a) => a.url === value) || avatars[0];

  const handleSelect = (avatar: AvatarOption) => {
    setSelectedUrl(avatar.url);
  };

  const handleConfirm = () => {
    onChange(selectedUrl);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedUrl(value || "");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "group relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg transition-all",
          "hover:shadow-xl hover:scale-105",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <Image
          src={currentAvatar?.url || avatars[0]?.url || ""}
          alt="用户头像"
          fill
          className="object-cover"
          unoptimized
        />
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-sm font-medium text-white">更换头像</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">选择头像</h3>
          <button
            onClick={handleCancel}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 预览区域 */}
        <div className="mb-6 flex justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-blue-100 shadow-lg">
            <Image
              src={selectedUrl || avatars[0]?.url || ""}
              alt="预览"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* 头像网格 */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {avatars.map((avatar) => (
            <button
              key={avatar.name}
              type="button"
              onClick={() => handleSelect(avatar)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                selectedUrl === avatar.url
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <Image
                src={avatar.url}
                alt={avatar.name}
                fill
                className="object-cover"
                unoptimized
              />
              {selectedUrl === avatar.url && (
                <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {/* 鱼种名称提示 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5 opacity-0 transition-opacity hover:opacity-100">
                <span className="text-xs text-white">{avatar.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarPicker;
