"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { AvatarPicker } from "@/components/avatar-picker";
import { defaultAvatar } from "@/lib/avatar-config";

interface ProfileFormProps {
  initialNickname: string | null;
  initialAvatarUrl: string | null;
}

export function ProfileForm({ initialNickname, initialAvatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? defaultAvatar?.url ?? "");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
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

      setStatus({ type: "success", message: "保存成功" });
      router.refresh();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "保存失败，请稍后再试",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* 头像选择 */}
      <div className="flex flex-col items-center space-y-3">
        <Label className="text-center">头像</Label>
        <AvatarPicker
          value={avatarUrl}
          onChange={setAvatarUrl}
          disabled={isSaving}
        />
        <p className="text-xs text-slate-500">点击头像更换</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">昵称</Label>
        <Input
          id="nickname"
          value={nickname}
          maxLength={20}
          placeholder="钓友昵称"
          onChange={(event) => setNickname(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">个人简介</Label>
        <textarea
          id="bio"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={200}
          placeholder="简单介绍一下自己，比如常钓水域、目标鱼种等"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
        />
        <p className="text-xs text-slate-400">最多 200 字</p>
      </div>

      {status ? (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            status.type === "success"
              ? "text-green-700 bg-green-50"
              : "text-red-700 bg-red-50"
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? "保存中..." : "保存资料"}
      </Button>
    </form>
  );
}
