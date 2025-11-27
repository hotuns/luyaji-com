"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    try {
      setIsLoading(true);
      await signOut({ callbackUrl: "/auth/signin" });
    } finally {
      // NextAuth 会在 signOut 后跳转，此处无需重置状态
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
