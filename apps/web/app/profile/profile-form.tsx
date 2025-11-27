"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

interface ProfileFormProps {
  initialNickname: string | null;
  initialAvatarUrl: string | null;
}

export function ProfileForm({ initialNickname, initialAvatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    const payload = {
      nickname: nickname.trim() ? nickname.trim() : null,
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
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
    <form className="space-y-4" onSubmit={handleSubmit}>
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
        <Label htmlFor="avatarUrl">头像链接</Label>
        <Input
          id="avatarUrl"
          value={avatarUrl}
          type="url"
          placeholder="https://..."
          onChange={(event) => setAvatarUrl(event.target.value)}
        />
        <p className="text-xs text-gray-500">支持外部图片链接，留空则使用默认头像。</p>
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
