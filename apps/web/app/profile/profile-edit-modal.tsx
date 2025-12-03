"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { avatars, defaultAvatar, type AvatarOption } from "@/lib/avatar-config";
import { Check, X, Pencil, User } from "lucide-react";

interface ProfileEditModalProps {
  /** 当前昵称 */
  nickname: string | null;
  /** 当前头像 URL */
  avatarUrl: string | null;
  /** 用于显示的名称 */
  displayName: string;
}

export function ProfileEditModal({
  nickname: initialNickname,
  avatarUrl: initialAvatarUrl,
  displayName,
}: ProfileEditModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? defaultAvatar?.url ?? "");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 确保客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 找到当前选中的头像
  const currentAvatar = avatars.find((a) => a.url === avatarUrl) || avatars.find((a) => a.url === initialAvatarUrl);

  const handleOpen = () => {
    setNickname(initialNickname ?? "");
    setAvatarUrl(initialAvatarUrl ?? defaultAvatar?.url ?? "");
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelectAvatar = (avatar: AvatarOption) => {
    setAvatarUrl(avatar.url);
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    const payload = {
      nickname: nickname.trim() ? nickname.trim() : null,
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      bio: bio.trim() ? bio.trim() : null,
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "保存失败，请稍后再试");
      }

      router.refresh();
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请稍后再试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* 触发按钮 - 头像区域 */}
      <button
        type="button"
        onClick={handleOpen}
        className="group relative flex items-center gap-5 w-full text-left"
      >
        <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-inner">
          {currentAvatar?.url || initialAvatarUrl ? (
            <Image
              src={currentAvatar?.url || initialAvatarUrl || ""}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <User className="w-10 h-10 text-white/80" />
          )}
          {/* 编辑遮罩 */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Pencil className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
            <Pencil className="w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-blue-200 text-xs mt-1">点击编辑个人资料</p>
        </div>
      </button>

      {/* 编辑弹框 - 使用 Portal 渲染到 body */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* 头部 */}
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">编辑个人资料</h3>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 当前头像预览 */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-blue-100 shadow-lg">
                <Image
                  src={avatarUrl || defaultAvatar?.url || ""}
                  alt="预览"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">选择一个头像</p>
            </div>

            {/* 头像选择网格 */}
            <div className="mb-6 grid grid-cols-5 gap-2">
              {avatars.map((avatar) => (
                <button
                  key={avatar.name}
                  type="button"
                  onClick={() => handleSelectAvatar(avatar)}
                  title={avatar.name}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                    avatarUrl === avatar.url
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
                  {avatarUrl === avatar.url && (
                    <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 昵称输入 */}
            <div className="mb-4 space-y-2">
              <Label htmlFor="edit-nickname">昵称</Label>
              <Input
                id="edit-nickname"
                value={nickname}
                maxLength={20}
                placeholder="给自己取个钓鱼名字吧"
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* 个人简介 */}
            <div className="mb-6 space-y-2">
              <Label htmlFor="edit-bio">个人简介</Label>
              <textarea
                id="edit-bio"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={200}
                placeholder="简单介绍一下自己，比如常钓水域、目标鱼种等"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <p className="text-xs text-slate-400">最多 200 字</p>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
