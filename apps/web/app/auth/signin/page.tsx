"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { Fish, Smartphone, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 验证手机号格式
  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("phone", {
        phone,
        code: "", // 当前阶段不需要验证码
        redirect: false,
      });

      if (result?.error) {
        setError("登录失败，请稍后重试");
      } else {
        // 登录成功，跳转首页
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("发生错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 opacity-10" />
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative w-full max-w-sm px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20">
            <Fish className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">路亚记</h1>
          <p className="mt-2 text-gray-500">记录每一次出击，珍藏每一份收获</p>
        </div>

        {/* 登录表单 */}
        <div className="overflow-hidden rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-gray-200/50">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
            手机号登录 / 注册
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                手机号
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2 border-r border-gray-200 pr-2 text-gray-500">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">+86</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    // 只允许输入数字
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 11) {
                      setPhone(value);
                    }
                  }}
                  placeholder="请输入手机号"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-24 pr-4 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || phone.length !== 11}
              className="group w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                "登录中..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  立即登录
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            首次登录将自动创建账号
          </p>
        </div>

        {/* 底部提示 */}
        <p className="mt-8 text-center text-xs text-gray-400">
          继续即表示您同意我们的
          <a href="#" className="text-gray-600 hover:underline">服务条款</a>
          和
          <a href="#" className="text-gray-600 hover:underline">隐私政策</a>
        </p>
      </div>
    </div>
  );
}
