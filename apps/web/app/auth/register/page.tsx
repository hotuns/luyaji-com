"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Fish, User, Lock, ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export default function RegisterPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("请输入账号/手机号和密码");
      return;
    }

    if (password.length < 6) {
      setError("密码长度至少为 6 位");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, nickname }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "注册失败，请稍后重试");
        setIsLoading(false);
        return;
      }

      // 注册成功后自动登录
      const loginResult = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // 自动登录失败则跳转到登录页
        router.push("/auth/signin");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("注册失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 opacity-10" />
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20">
            <Fish className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">路亚记</h1>
          <p className="mt-2 text-gray-500">注册新账号，开始记录每一次出击</p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-gray-200/50">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
            账号 / 手机号 注册
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                账号或手机号
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 border-r border-gray-200 pr-2 text-gray-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="请输入账号或手机号"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-24 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="nickname"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                昵称（可选）
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="用于展示的昵称"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                密码
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 border-r border-gray-200 pr-2 text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少 6 位）"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-24 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 px-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="group w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                "注册中..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  立即注册
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          已有账号？
          <button
            type="button"
            onClick={() => router.push("/auth/signin")}
            className="ml-1 text-gray-600 hover:underline"
          >
            去登录
          </button>
        </p>
      </div>
    </div>
  );
}
