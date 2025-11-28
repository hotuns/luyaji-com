"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    try {
      setIsLoading(true);
      // 使用 redirect: false 手动控制跳转，避免 signOut Promise 卡住
      await signOut({ redirect: false });
      // 手动跳转到登录页
      router.push("/auth/signin");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
      // 即使出错也尝试跳转
      router.push("/auth/signin");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? "正在退出..." : "退出登录"}
    </Button>
  );
}
